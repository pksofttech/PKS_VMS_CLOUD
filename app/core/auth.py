"""auth.py"""

from datetime import datetime, timedelta
from http import HTTPStatus
from typing import Any, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError

from pydantic import BaseModel

# Google library for verify the token
from google.oauth2 import id_token
from google.auth.transport import requests


from app.core import config
from app.core.database import get_async_session, System_Users
from app.core.models import Site_User, System_User_Type
from app.stdio import print_error, print_success, print_warning, time_now
from .utility import verify_password


OAUTH_PATH = "/oauth"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=OAUTH_PATH)
router = APIRouter()


async def allowed_permissions(
    db: AsyncSession,
    user: System_Users | dict,
    permissions: str,
) -> bool:
    """allowed_permissions"""
    system_user_type_id = None
    if isinstance(user, dict):
        system_user_type_id = user["system_user_type_id"]
    else:
        system_user_type_id = user.system_user_type_id

    _sql = select(System_User_Type.permission_allowed).where(
        System_User_Type.id == system_user_type_id
    )
    _allowed = (await db.execute(_sql)).one_or_none()
    print(permissions)
    if _allowed:
        _allowed = _allowed[0].split(",")
        print(_allowed)
        if permissions in _allowed:
            return 1
    return 0


async def authenticate_user(
    db,
    username: str,
    password: str,
    site_name: str,
    app_mode: str,
) -> tuple[System_Users, Site_User]:
    """authenticate_user"""
    if not site_name:
        site_name = username
    system_user = None
    site_user = None
    _sql = select(System_Users).where(System_Users.username == site_name)
    _row = (await db.execute(_sql)).one_or_none()

    if _row:
        system_user: System_Users = _row[0]
        if app_mode in ("BUILDING-OWNER"):
            _sql = select(Site_User).where(
                Site_User.system_users_id == system_user.id,
                Site_User.username == "system",
            )
            _row = (await db.execute(_sql)).one_or_none()
            if _row:
                site_user: Site_User = _row[0]

            if not verify_password(password, system_user.password):
                system_user = None
        else:
            _sql = select(Site_User).where(
                Site_User.system_users_id == system_user.id,
                Site_User.username == username,
                Site_User.password_hash == password,
            )
            _row = (await db.execute(_sql)).one_or_none()
            if _row:
                site_user: Site_User = _row[0]

    return (system_user, site_user)


async def create_access_token(data: dict, expires_delta: timedelta = None) -> bytes:
    """create_access_token"""
    to_encode = data.copy()

    if expires_delta:
        expire = time_now() + expires_delta
    else:
        expire = time_now() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        config.API_SECRET_KEY,
        algorithm=config.API_ALGORITHM,
    )
    print(to_encode)
    return encoded_jwt


async def get_jwt_access(token: str = Depends(oauth2_scheme)) -> int:
    """get_jwt_access"""
    credentials_exception = HTTPException(
        status_code=HTTPStatus.UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    expired_exception = HTTPException(
        status_code=HTTPStatus.UNAUTHORIZED,
        detail="Signature has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            config.API_SECRET_KEY,
            algorithms=[config.API_ALGORITHM],
            options={"verify_exp": False},
        )
        # print_success(payload)
        username = payload.get("sub")
        user_id = payload.get("user_id", None)

        if username is None:
            raise credentials_exception
        # token_data = TokenData(username=username)

    except PyJWTError as e:
        print_error(e)
        if str(e) == "Signature has expired":
            raise expired_exception from e
        raise credentials_exception from e

    if user_id is None:
        raise credentials_exception
    print_success(f"get_jwt_access : {user_id}")
    return int(user_id)


async def access_session_token(
    request: Request,
    token_name="Authorization",
    db: AsyncSession = Depends(get_async_session),
):
    """access_session_token"""
    userdata = None
    _token_str = request.query_params.get("token")
    if _token_str:
        token = _token_str.split(" ")[1]
        userdata = await get_current_user_id_token(token)

    return userdata


async def get_current_user_id_token(token: str) -> Union[dict | None]:
    """get_current_user_id_token"""
    # print(token)
    try:
        payload = jwt.decode(
            token,
            config.API_SECRET_KEY,
            algorithms=[config.API_ALGORITHM],
        )
        print(payload)
        userdata = {
            "user_id": payload.get("user_id"),
            # "site_id": payload.get("site_id"),
            "app_mode": payload.get("app_mode"),
            "site_user_id": payload.get("site_user_id"),
        }

    except PyJWTError:
        return None

    return userdata


@router.get("/login_session", tags=["OAuth"])
async def login_session(
    siteUser: str,
    db=Depends(get_async_session),
    user_id=Depends(get_jwt_access),
):
    """login_session"""

    sql = select(Site_User.username, Site_User.full_name).where(
        Site_User.system_users_id == user_id,
        Site_User.username == siteUser,
        Site_User.system_users_id == user_id,
    )
    user = (await db.execute(sql)).mappings().one_or_none()
    # print(user)
    return user


@router.post(OAUTH_PATH, tags=["OAuth"])
async def login_for_access_token(
    db=Depends(get_async_session),
    form_data: OAuth2PasswordRequestForm = Depends(),
    app_mode: str = Form("BUILDING-OWNER"),
    site_name: str = Form(None),
) -> dict[str, Any]:
    """login_for_access_token"""
    # print_success(app_mode,site_name)
    system_user, site_user = await authenticate_user(
        db,
        form_data.username,
        form_data.password,
        site_name,
        app_mode,
    )
    print_success(system_user, site_user)
    if not system_user:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(
        minutes=config.API_ACCESS_TOKEN_EXPIRE_MINUTES,
        # seconds=60,
    )
    access_token = await create_access_token(
        data={
            "sub": system_user.username,
            "user_id": system_user.id,
            "app_mode": app_mode,
            "site_user_id": site_user.id,
        },
        expires_delta=access_token_expires,
    )
    print_success(access_token)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "system_user_id": system_user.id,
        "user_name": site_user.username,
        "fullName": site_user.full_name,
    }


GOOGLE_CLIENT_ID = (
    """580399598169-chtllmue5343fvl20150n4ecg9cl3li6.apps.googleusercontent.com"""
)


@router.post("/google_login", tags=["OAuth"])
async def google_login_for_access_token(
    request: Request,
    db=Depends(get_async_session),
) -> dict[str, Any]:
    """login_for_access_token"""
    # print(request)
    res = await request.json()
    # for x in res:
    #     print(x, res[x])
    # print(res)

    try:
        credential = res.get("credential")
        # Specify the CLIENT_ID of the app that accesses the backend:
        user_info = id_token.verify_oauth2_token(
            credential, requests.Request(), GOOGLE_CLIENT_ID
        )
        print(user_info)
        email = user_info.get("email")
        print(email)
        if email:
            row = (
                await db.execute(
                    select(System_Users).where(System_Users.username == email)
                )
            ).first()

            if not row:
                raise HTTPException(
                    status_code=HTTPStatus.UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            user: System_Users = row[0]
            print(user)
            access_token_expires = timedelta(
                minutes=config.API_ACCESS_TOKEN_EXPIRE_MINUTES,
                # seconds=60,
            )
            access_token = await create_access_token(
                data={
                    "sub": user.username,
                    "user_id": user.id,
                },
                expires_delta=access_token_expires,
            )
            print_success(access_token)
            return {"access_token": access_token, "token_type": "bearer"}
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except ValueError as err:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err

    return {"access_token": "access_token", "token_type": "bearer"}

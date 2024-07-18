"""api"""

from datetime import datetime
from io import BytesIO
import re
from PIL import Image
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile


from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func, or_, select, and_
from sqlalchemy.orm import aliased

# from sqlmodel import select
from app.core.database import get_async_session
from app.core.auth import (
    get_jwt_access,
)


from app.core import config


from app.core.models import (
    Site_Member,
    Site_User,
    System_Users,
    Transaction,
    Transaction_Record,
)
from app.core.utility import get_password_hash
from app.stdio import print_debug, print_error, time_now

DIR_PATH = config.DIR_PATH

router_api = APIRouter(tags=["API"], prefix="/api")

# *** def for helper


def extract_select_columns(params):
    """extract_select_columns"""
    select_columns = set()
    for k in params:
        if re.search(r"^columns\[.*\]\[data\]", k):
            select_columns.add(params[k])
    return select_columns


def extract_date_range(date_range: str):
    """extract_date_range"""

    date_format = "%Y/%m/%d %H:%M"
    d_start, d_end = date_range.split(" - ")
    d_start = datetime.strptime(d_start, date_format)
    d_end = datetime.strptime(d_end, date_format)
    # print_debug(f"d_start : {d_start}")
    # print_debug(f"d_end : {d_end}")
    print_debug(f"extract_date_range : {d_start} - {d_end}")
    return (d_start, d_end)


def extract_ordering(params):
    """extract_ordering"""
    order_by_col = params.get("order[0][column]")
    order_by_column = params.get(f"columns[{order_by_col}][data]")
    order_dir = params.get("order[0][dir]", "asc")
    return order_by_column, order_dir


def extract_pagination(params):
    """extract_pagination"""
    limit = int(params.get("length", 10))
    skip = int(params.get("start", 0))
    return limit, skip


def get_order_column_by_name(table, column_name: str):
    """
    Retrieves the order column from a table by its name.

    Args:
        table: The SQLAlchemy table object to retrieve the column from.
        column_name (str): The name of the column to retrieve.

    Returns:
        SQLAlchemy Column: The column to order by. Defaults to `table.id` if the column is not found.
    """
    if not column_name:
        return table.id
    # Split the column name by '.' and take the first part if it exists
    column_name = column_name.split(".")[1] if "." in column_name else column_name

    # Retrieve the column attribute from the table or default to `table.id`
    return getattr(table, column_name, table.id)


def get_order_by_clause(order_columns, order_dir):
    """get_order_by_clause"""
    return order_columns.asc() if order_dir == "asc" else order_columns.desc()


async def get_records_count(db, sql):
    """get_total_records"""
    count_sql = select(func.count()).select_from(sql)
    return (await db.execute(count_sql)).scalar()


async def fetch_data(db, sql, order_by, skip, limit):
    """fetch_data"""
    sql = sql.order_by(order_by).offset(skip).limit(limit)
    # print_debug(sql)
    return (await db.execute(sql)).mappings().all()


def create_result(params, recordsTotal, recordsFiltered, rows):
    """create_result"""
    return {
        "draw": params.get("draw", 1),
        "recordsTotal": recordsTotal,
        "recordsFiltered": recordsFiltered,
        "data": rows,
    }


# ********************************************************************


# *** API-SiteUser **************************************************


@router_api.get("/site/site_user/{id}")
async def get_site_site_user(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """get_site_site_user"""

    _sql = select(Site_User).where(Site_User.id == id)
    _rows = (await db.execute(_sql)).mappings().one_or_none()
    return {"success": True, "msg": "", "data": _rows}


@router_api.post("/site/site_user/")
async def post_site_user(
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
    username: str = Form(...),
    full_name: str = Form(...),
    password_hash: str = Form(""),
    is_active: str = Form(...),
    role: str = Form(...),
):
    """post_site/site_user"""
    print_debug(user_jwt)
    username = username.strip()
    success = False
    data = None
    msg = ""
    # current_time = time_now()
    if username == "system":
        return {"success": False, "msg": "system เป็นชื่อที่ไม่สามารถใช้ได้"}

    _sql = select(Site_User).where(
        Site_User.username == username,
        Site_User.system_users_id == user_jwt,
    )
    _row = (await db.execute(_sql)).one_or_none()
    if _row:
        return {"success": False, "msg": "item is not already in database"}

    _Site_User = Site_User(
        username=username,
        full_name=full_name,
        password_hash=password_hash,
        is_active=is_active in ("ENABLE"),
        role=role,
        owner=user_jwt,
        system_users_id=user_jwt,
    )
    db.add(_Site_User)

    try:
        await db.commit()
        await db.refresh(_Site_User)
        data = _Site_User
        success = True
    except Exception as e:
        print_error(e)
        msg = str(e)
        if "duplicate key value" in str(e):
            msg = "รายการข้อมูลซ้ำกับข้อมูลที่มีในระบบแล้ว"
    return {"success": success, "msg": msg, "data": data}


@router_api.put("/site/site_user/{id}")
async def put_site_user(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
    username: str = Form(...),
    full_name: str = Form(...),
    password_hash: str = Form(""),
    is_active: str = Form(...),
    role: str = Form(...),
):
    """put_site/site_user"""
    print_debug(user_jwt)
    username = username.strip()
    success = False
    data = None
    msg = ""
    # current_time = time_now()
    _sql = select(Site_User).where(Site_User.id == id)
    _row = (await db.execute(_sql)).one_or_none()
    if not _row:
        return {"success": False, "msg": "item is not already in database"}

    _Site_User: Site_User = _row[0]
    _Site_User.username = username
    _Site_User.full_name = full_name
    if password_hash:
        _Site_User.password_hash = password_hash
    _Site_User.is_active = is_active in ("ENABLE")
    _Site_User.role = role

    try:
        await db.commit()
        await db.refresh(_Site_User)
        data = _Site_User
        success = True
    except Exception as e:
        print_error(e)
        msg = str(e)
        if "duplicate key value" in str(e):
            msg = "รายการข้อมูลซ้ำกับข้อมูลที่มีในระบบแล้ว"
    return {"success": success, "msg": msg, "data": data}


@router_api.delete("/site/site_user/{id}")
async def delete_site_site_user(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """delete_site"""
    success = False
    msg = "รายการข้อมูลไม่มี"
    _sql = select(Site_User).where(Site_User.id == id)
    _row = (await db.execute(_sql)).one_or_none()
    if _row:
        try:
            # stmt = delete(Transaction).where(Transaction.site_id == id)
            # await db.execute(stmt)
            await db.delete(_row[0])
            await db.commit()
            msg = "successfully"
            success = True
        except Exception as e:
            print_error(e)
            msg = str(e)
    return {
        "success": success,
        "msg": msg,
    }


# *** API-SystemUser **************************************************


@router_api.get("/system_user/{id}")
async def get_system_user(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """get system user"""
    user_id = user_jwt
    user = None
    if id:
        user_id = id
    _sql = select(System_Users).where(System_Users.id == user_id)
    user = (await db.execute(_sql)).mappings().one_or_none()

    return {"success": True, "msg": None, "data": user}


@router_api.put("/system_user/")
async def put_system_user(
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
    username: str = Form(None),
    email: str = Form(None),
    picture_url: UploadFile = File(None),
    password: str = Form(None),
    fullname: str = Form(None),
    address: str = Form(None),
    contacts: str = Form(None),
    objectives: str = Form(None),
    company: str = Form(None),
    remark: str = Form(None),
):
    """put_system_user"""
    print_debug(user_jwt)
    success = False
    data = None
    msg = ""
    current_time = time_now()
    _sql = select(System_Users).where(System_Users.id == user_jwt)
    _rows = (await db.execute(_sql)).one_or_none()
    if _rows:
        _System_Users: System_Users = _rows[0]
        if username:
            _System_Users.username = username.strip()
        if password:
            _System_Users.password = get_password_hash(password)
        if email:
            _System_Users.email = email.strip()

        if fullname:
            _System_Users.fullname = fullname
        if address:
            _System_Users.address = address
        if contacts:
            _System_Users.contacts = contacts
        if objectives:
            _System_Users.objectives = objectives
        if company:
            _System_Users.company = company
        if remark:
            _System_Users.remark = remark

        if picture_url:
            try:
                image_content = await picture_url.read()
                image_upload = Image.open(BytesIO(image_content))
                if image_upload.format == "PNG":
                    image_upload = image_upload.convert("RGB")
                _path = f"/static/data_base/image/system_user/{_System_Users.id}.jpg"
                image_upload.save(f".{_path}")
                time_stamp = int(current_time.timestamp())
                _System_Users.picture_url = _path + f"?time_stamp={time_stamp}"
            except Exception as e:
                print_error(e)
                msg = str(e)
        try:
            await db.commit()
            await db.refresh(_System_Users)
            data = _System_Users
            success = True
            msg = "success"
        except Exception as e:
            print_error(e)
            msg = str(e)
            if "duplicate key value" in str(e):
                msg = "รายการข้อมูลซ้ำกับข้อมูลที่มีในระบบแล้ว"
    return {"success": success, "msg": msg, "data": data}


# *** API-Transaction **************************************************


@router_api.get("/transaction/{id}/")
async def get_transaction(
    id: int,
    card_id: str = None,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """get_transaction"""
    # print_debug(user_jwt)
    success = False
    data = None
    msg = ""
    # current_time = time_now()
    create_by: Site_User = aliased(Site_User)
    stamp_by: Site_User = aliased(Site_User)
    success_by: Site_User = aliased(Site_User)
    table = Transaction
    if id:
        _sql = (
            select(
                table,
                create_by.username.label("create_by"),
                stamp_by.username.label("stamp_by"),
                success_by.username.label("success_by"),
                create_by.pictureUrl.label("create_pictureUrl"),
                stamp_by.pictureUrl.label("stamp_pictureUrl"),
                success_by.username.label("success_by"),
            )
            .where(table.id == id)
            .outerjoin(create_by, (create_by.id == table.create_by))
            .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
            .outerjoin(success_by, (success_by.id == table.success_by))
        )
        data = (await db.execute(_sql)).mappings().one_or_none()

        success = True
    else:
        if card_id:
            _sql = (
                select(
                    table,
                    create_by.username.label("create_by"),
                    stamp_by.username.label("stamp_by"),
                    success_by.username.label("success_by"),
                    create_by.pictureUrl.label("create_pictureUrl"),
                    stamp_by.pictureUrl.label("stamp_pictureUrl"),
                )
                .where(table.card_id == card_id)
                .outerjoin(create_by, (create_by.id == table.create_by))
                .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
                .outerjoin(success_by, (success_by.id == table.success_by))
            )
            data = (await db.execute(_sql)).mappings().one_or_none()
            success = True

    print_debug(data)
    info = {}
    if data:
        _Transaction: Transaction = data["Transaction"]
        info["parked"] = str(time_now() - _Transaction.create_date).split(".")[0]
        print_debug(info)
    return {"success": success, "msg": msg, "data": data, "info": info}


@router_api.get("/transaction_record/{id}")
async def get_transaction_record(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """get_transaction_record"""
    # print_debug(user_jwt)
    success = False
    data = None
    msg = ""
    # current_time = time_now()
    create_by: Site_User = aliased(Site_User)
    stamp_by: Site_User = aliased(Site_User)
    success_by: Site_User = aliased(Site_User)
    table = Transaction_Record
    _sql = (
        select(
            table,
            create_by.username.label("create_by"),
            stamp_by.username.label("stamp_by"),
            success_by.username.label("success_by"),
        )
        .where(table.id == id)
        .outerjoin(create_by, (create_by.id == table.create_by))
        .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
        .outerjoin(success_by, (success_by.id == table.success_by))
    )
    data = (await db.execute(_sql)).mappings().one_or_none()

    success = True
    return {"success": success, "msg": msg, "data": data}


@router_api.post("/transaction/")
async def post_transaction(
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
    machine: str = Form("machine"),
    card_id: str = Form(...),
    name: str = Form(...),
    license: str = Form(""),
    tel: str = Form(""),
    car_type: str = Form(""),
    company: str = Form(...),
    contacts: str = Form(...),
    objective: str = Form(...),
    remark: str = Form(""),
    image_in_url: UploadFile = File(None),
    site_user_id: int = Form(...),
):
    """post_transaction"""
    print_debug(user_jwt)
    name = name.strip()
    success = False
    data = None
    msg = ""
    current_time = time_now()
    print_debug(current_time)

    _sql = select(Transaction).where(
        Transaction.card_id == card_id,
        Transaction.status != "SUCCESS",
        Transaction.system_users_id == user_jwt,
    )
    _row = (await db.execute(_sql)).one_or_none()
    if _row:
        return {
            "success": False,
            "data": _row[0],
            "msg": "item is not already in database",
        }

    _Transaction = Transaction(
        machine=machine,
        card_id=card_id,
        name=name,
        license=license,
        tel=tel,
        car_type=car_type,
        company=company,
        contacts=contacts,
        objective=objective,
        remark=remark,
        status="REGISTERED",
        create_date=current_time,
        create_by=site_user_id,
        system_users_id=user_jwt,
    )
    db.add(_Transaction)

    if image_in_url:
        try:
            await db.commit()
            await db.refresh(_Transaction)
            image_content = await image_in_url.read()
            image_upload = Image.open(BytesIO(image_content))
            if image_upload.format == "PNG":
                image_upload = image_upload.convert("RGB")
            _path = f"/static/data_base/image/transaction/in_{_Transaction.id}.jpg"
            image_upload.save(f".{_path}")
            time_stamp = int(time_now().timestamp())
            _Transaction.image_in_url = _path + f"?time_stamp={time_stamp}"
        except Exception as e:
            print_error(e)
            msg = str(e)

    try:
        await db.commit()
        await db.refresh(_Transaction)
        data = _Transaction
        success = True
    except Exception as e:
        print_error(e)
        msg = str(e)
        if "duplicate key value" in str(e):
            msg = "รายการข้อมูลซ้ำกับข้อมูลที่มีในระบบแล้ว"
    return {"success": success, "msg": msg, "data": data}


@router_api.put("/transaction/{id}")
async def put_transaction(
    id: int,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
    mode: str = Form("STAMP"),
    site_user: str = Form(...),
):
    """put_transaction"""
    print_debug(site_user)
    now = time_now()
    data = None
    _sql = select(Site_User).where(
        Site_User.username == site_user,
        Site_User.system_users_id == user_jwt,
    )
    _row = (await db.execute(_sql)).one_or_none()
    if _row:
        _Site_User: Site_User = _row[0]
        _sql = select(Transaction).where(Transaction.id == id)
        _row = (await db.execute(_sql)).one_or_none()
        if _row:
            _Transaction: Transaction = _row[0]
            create_by: Site_User = aliased(Site_User)
            stamp_by: Site_User = aliased(Site_User)
            success_by: Site_User = aliased(Site_User)
            # print(_Site_User)
            # STAMP
            if mode == "STAMP":
                _Transaction.stamp_by = _Site_User.id
                _Transaction.stamp_date = now
                _Transaction.status = "STAMP"
                await db.commit()
                await db.refresh(_Transaction)
                table = Transaction
                _sql = (
                    select(
                        table,
                        create_by.username.label("create_by"),
                        stamp_by.username.label("stamp_by"),
                        success_by.username.label("success_by"),
                        create_by.pictureUrl.label("create_pictureUrl"),
                        stamp_by.pictureUrl.label("stamp_pictureUrl"),
                    )
                    .where(table.id == _Transaction.id)
                    .outerjoin(create_by, (create_by.id == table.create_by))
                    .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
                    .outerjoin(success_by, (success_by.id == table.success_by))
                )
                data = (await db.execute(_sql)).mappings().one_or_none()
                # print(data)

            if mode == "CHECK_OUT":
                _Transaction.success_by = _Site_User.id
                _Transaction.success_date = now
                dic_Transaction = _Transaction.__dict__
                await db.delete(_Transaction)
                print_debug(dic_Transaction)
                _Transaction_Record = Transaction_Record(**dic_Transaction)
                _Transaction_Record.id = None
                _Transaction_Record.status = "SUCCESS"
                print_debug(_Transaction_Record)
                db.add(_Transaction_Record)
                await db.commit()
                await db.refresh(_Transaction_Record)
                _Transaction = _Transaction_Record
                table = Transaction_Record
                _sql = (
                    select(
                        table,
                        create_by.username.label("create_by"),
                        stamp_by.username.label("stamp_by"),
                        success_by.username.label("success_by"),
                        create_by.pictureUrl.label("create_pictureUrl"),
                        stamp_by.pictureUrl.label("stamp_pictureUrl"),
                    )
                    .where(table.id == _Transaction.id)
                    .outerjoin(create_by, (create_by.id == table.create_by))
                    .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
                    .outerjoin(success_by, (success_by.id == table.success_by))
                )
                data = (await db.execute(_sql)).mappings().one_or_none()

            return {
                "success": True,
                "data": data,
                "msg": f"{mode} : Successful",
            }
    return {
        "success": False,
        "msg": "item is not already in database",
    }


@router_api.get("/transaction_datatable")
async def get_transaction_datatable(
    req_para: Request,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handles the datatable request for transactions.

    Args:
        req_para (Request): The request object containing query parameters.
        user_jwt: The user JWT dependency for authentication.
        db (AsyncSession): The database session dependency.

    Returns:
        dict: The response containing draw, recordsTotal, recordsFiltered, and data.
    """
    params = dict(req_para.query_params)
    # select_columns = extract_select_columns(params)
    order_by_column, order_dir = extract_ordering(params)
    limit, skip = extract_pagination(params)
    search = params.get("search[value]", "")

    table = Transaction
    create_by: Site_User = aliased(Site_User)
    stamp_by: Site_User = aliased(Site_User)
    success_by: Site_User = aliased(Site_User)
    order_columns = get_order_column_by_name(table, order_by_column)
    # print_debug(f"order_columns : {order_columns}")

    condition = Transaction.system_users_id == user_jwt
    if search:
        condition = and_(
            condition,
            or_(
                Transaction.card_id.like(f"%{search}%"),
                Transaction.tel.like(f"%{search}%"),
                Transaction.car_type.like(f"%{search}%"),
                Transaction.company.like(f"%{search}%"),
                Transaction.contacts.like(f"%{search}%"),
                Transaction.objective.like(f"%{search}%"),
                Transaction.status.like(f"%{search}%"),
            ),
        )
    order_by = get_order_by_clause(order_columns, order_dir)
    sql = (
        select(
            table,
            create_by.username.label("create_by"),
            stamp_by.username.label("stamp_by"),
            success_by.username.label("success_by"),
        )
        .where(condition)
        .outerjoin(create_by, (create_by.id == table.create_by))
        .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
        .outerjoin(success_by, (success_by.id == table.success_by))
    )

    recordsTotal = await get_records_count(db, sql)
    recordsFiltered = await get_records_count(db, sql)
    rows = await fetch_data(db, sql, order_by, skip, limit)
    return create_result(params, recordsTotal, recordsFiltered, rows)


@router_api.get("/transaction_record_datatable")
async def get_transaction_record_datatable(
    req_para: Request,
    date_range: str,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handles the datatable request for transaction_record_datatable.

    Args:
        req_para (Request): The request object containing query parameters.
        user_jwt: The user JWT dependency for authentication.
        db (AsyncSession): The database session dependency.

    Returns:
        dict: The response containing draw, recordsTotal, recordsFiltered, and data.
    """
    params = dict(req_para.query_params)
    # select_columns = extract_select_columns(params)
    print_debug(f"date_range : {date_range}")
    order_by_column, order_dir = extract_ordering(params)
    limit, skip = extract_pagination(params)
    search = params.get("search[value]", "")

    table = Transaction_Record
    create_by: Site_User = aliased(Site_User)
    stamp_by: Site_User = aliased(Site_User)
    success_by: Site_User = aliased(Site_User)
    order_columns = get_order_column_by_name(table, order_by_column)
    # print_debug(f"order_columns : {order_columns}")
    date_start, date_end = extract_date_range(date_range)

    condition = table.success_date.between(date_start, date_end)
    if search:
        condition = and_(
            condition,
            or_(
                Transaction_Record.card_id.like(f"%{search}%"),
                Transaction_Record.tel.like(f"%{search}%"),
                Transaction_Record.car_type.like(f"%{search}%"),
                Transaction_Record.company.like(f"%{search}%"),
                Transaction_Record.contacts.like(f"%{search}%"),
                Transaction_Record.objective.like(f"%{search}%"),
                Transaction_Record.status.like(f"%{search}%"),
            ),
        )

    order_by = get_order_by_clause(order_columns, order_dir)
    sql = (
        select(
            table,
            create_by.username.label("create_by"),
            stamp_by.username.label("stamp_by"),
            success_by.username.label("success_by"),
        )
        .where(table.system_users_id == user_jwt, condition)
        .outerjoin(create_by, (create_by.id == table.create_by))
        .outerjoin(stamp_by, (stamp_by.id == table.stamp_by))
        .outerjoin(success_by, (success_by.id == table.success_by))
    )
    print(sql)
    recordsTotal = await get_records_count(db, sql)
    recordsFiltered = await get_records_count(db, sql)
    rows = await fetch_data(db, sql, order_by, skip, limit)

    return create_result(params, recordsTotal, recordsFiltered, rows)


@router_api.get("/site/user/datatable")
async def get_site_user_datatable(
    req_para: Request,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handles the datatable request for SiteUser.

    Args:
        req_para (Request): The request object containing query parameters.
        user_jwt: The user JWT dependency for authentication.
        db (AsyncSession): The database session dependency.

    Returns:
        dict: The response containing draw, recordsTotal, recordsFiltered, and data.
    """
    params = dict(req_para.query_params)
    select_columns = extract_select_columns(params)
    print_debug(f"select_columns : {select_columns}")
    order_by_column, order_dir = extract_ordering(params)
    limit, skip = extract_pagination(params)
    search = params.get("search[value]", "")

    table = Site_User
    order_columns = get_order_column_by_name(table, order_by_column)
    print_debug(f"order_columns : {order_columns}")
    condition = table.system_users_id == user_jwt
    if search:
        condition = and_(
            (table.system_users_id == user_jwt),
            or_(
                table.username.like(f"%{search}%"),
                table.full_name.like(f"%{search}%"),
                table.role.like(f"%{search}%"),
            ),
        )

    order_by = get_order_by_clause(order_columns, order_dir)

    sql = select(table).where(condition, table.username != "system")
    print(sql)
    recordsTotal = await get_records_count(db, sql)
    recordsFiltered = await get_records_count(db, sql)
    rows = await fetch_data(db, sql, order_by, skip, limit)

    return create_result(params, recordsTotal, recordsFiltered, rows)


@router_api.get("/site/member/datatable")
async def get_site_member_datatable(
    req_para: Request,
    user_jwt=Depends(get_jwt_access),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Handles the datatable request for SiteMember.
    """
    params = dict(req_para.query_params)
    select_columns = extract_select_columns(params)
    print_debug(f"select_columns : {select_columns}")
    order_by_column, order_dir = extract_ordering(params)
    limit, skip = extract_pagination(params)
    search = params.get("search[value]", "")

    table = Site_Member
    order_columns = get_order_column_by_name(table, order_by_column)
    print_debug(f"order_columns : {order_columns}")
    condition = table.system_users_id == user_jwt
    if search:
        condition = and_(
            (table.system_users_id == user_jwt),
            or_(
                table.username.like(f"%{search}%"),
                table.full_name.like(f"%{search}%"),
            ),
        )
    order_by = get_order_by_clause(order_columns, order_dir)
    sql = select(table).where(condition)
    print(sql)
    recordsTotal = await get_records_count(db, sql)
    recordsFiltered = await get_records_count(db, sql)
    rows = await fetch_data(db, sql, order_by, skip, limit)

    return create_result(params, recordsTotal, recordsFiltered, rows)

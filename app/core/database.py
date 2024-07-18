"""database.py"""

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel, select

# from sqlalchemy.pool import Pool
from app.core.utility import get_password_hash

from app.stdio import print_success, print_warning, time_now

from app.core.models import (
    App_Configurations,
    Site_Member,
    Site_User,
    System_User_Type,
    System_Users,
)


# from app.core import config


# SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///sqlacm.db"
# # ? connect_args={"check_same_thread": False} For Sqlite เท่านั้น
# async_engine = create_async_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )

print("Connect DataBase")


# For postgres DB
postgres_server = "localhost"
postgres_database = "CPKSM"
postgres_database_password = "12341234"
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://root:{postgres_database_password}@{postgres_server}/{postgres_database}"

# for elephantsql DB
# SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://ucqvdwlc:Ie6Wo6hbKgp2DVp-ml9qgfYVggRnxeFQ@rosie.db.elephantsql.com/ucqvdwlc"

async_engine = create_async_engine(SQLALCHEMY_DATABASE_URL)


# SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///sqlacm.db"
# # ? connect_args={"check_same_thread": False} For Sqlite เท่านั้น
# async_engine = create_async_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )

print_success(f"create_async_engine \n{SQLALCHEMY_DATABASE_URL} \n{async_engine}")
# ? MAIN LIB+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

_async_session_maker = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


async def get_async_session() -> AsyncSession:  # type: ignore
    """get_async_session"""
    async with _async_session_maker() as session:
        yield session


async def init_databases():
    """init_databases"""
    # Generet database test

    app_configurations_init = {
        "app_configurations_name": "PKS-PARKING",
        "app_configurations_address": "PKS Address",
        "app_configurations_phone": "01-234-5678",
        "app_configurations_vat_no": "00-xxxxxxxx-00",
        "app_configurations_remark": "ตัวอย่าง",
        "app_configurations_image": "/static/image/logo.jpg",
    }

    print_success("********************************************************")
    print_success(f"Init_db config Time {time_now()}")

    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

    async with _async_session_maker() as db:
        for k, v in app_configurations_init.items():
            _item = App_Configurations(key=k, value=v)
            print_success(k)
            db.add(_item)
        await db.commit()

        for l in [
            "ROOT",
            "OWNER",
        ]:
            _system_user_type = System_User_Type(user_type=l)
            if l == "ROOT":
                _system_user_type.permission_allowed = (
                    "system_config,management_system_user,station_config"
                )
            db.add(_system_user_type)
        await db.commit()

        sql = select(System_User_Type.id).where(System_User_Type.user_type == "ROOT")
        _system_user_type_root: System_User_Type = (await db.execute(sql)).one_or_none()
        # print(_system_user_type_root.id)
        print_warning("DataBase is missing root user")
        print_warning("SystemUser root not found init_db() create new root")
        _password = get_password_hash("12341234")
        _root = System_Users(
            username="system",
            password=_password,
            system_user_type_id=_system_user_type_root.id,
            create_by="init_db",
            status="Enable",
            pictureUrl="/static/data_base/image/default/system.jpg",
        )
        db.add(_root)

        sql = select(System_User_Type.id).where(System_User_Type.user_type == "OWNER")
        _system_user_type: System_User_Type = (await db.execute(sql)).one_or_none()

        sites = [{"username": "PKS-DEMO-SITE"}, {"username": "DEMO-001"}]
        for site in sites:
            _owner_demo = System_Users(
                username=site["username"],
                fullname=f"{site['username']}-FULL-NAME",
                email="pksofttech@gmail.com",
                password=_password,
                system_user_type_id=_system_user_type.id,
                create_by="init_db",
                status="Enable",
                pictureUrl="/static/data_base/image/default/system.jpg",
                address="Test Address",
                company="company001\r\ncompany002",
                contacts="contacts001\r\ncontacts002",
                objectives="objectives001\r\nobjectives",
            )
            db.add(_owner_demo)
            await db.commit()
            await db.refresh(_owner_demo)

            site_user_demo = Site_User(
                username="system",
                full_name=f"{site['username']}",
                is_active=True,
                role="BOOKING,TRANSACTION,STAMP",
                password_hash="12341234",
                pictureUrl="/static/data_base/image/default/system.jpg",
                system_users_id=_owner_demo.id,
            )
            db.add(site_user_demo)
            await db.commit()

            site_member_demo = Site_Member(
                username="315/108",
                full_name="Member Owner",
                is_active=True,
                role="MEMBER",
                password_hash="12341234",
                pictureUrl="/static/data_base/image/default/system.jpg",
                system_users_id=_owner_demo.id,
            )
            db.add(site_member_demo)
            await db.commit()

    print_success(
        "********************* Success Set Data For Test ************************"
    )


async def init_db(init=False):
    """init_db"""
    print("*" * 50)
    print(f"init_db :{init}")

    if not init:
        print("Not Init DB")
        async with async_engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    else:
        print_warning("*****************INIT DB******************")
        await init_databases()
    async with _async_session_maker() as db:
        # sql = select(App_Configurations.value).where(
        #     App_Configurations.key == "app_configurations_allow_not_register_member"
        # )
        # row = (await db.execute(sql)).one_or_none()
        # if row:
        #     app_configurations_allow_not_register_member = row[0]
        #     if app_configurations_allow_not_register_member == "Enable":
        #         config.app_configurations_allow_not_register_member = True

        print("*" * 50)
    return

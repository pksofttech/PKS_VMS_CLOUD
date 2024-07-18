"""models.py"""

from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from app.stdio import time_now


class App_Configurations(SQLModel, table=True):
    """Represents configurations for the application."""

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, nullable=False)
    value: str = Field(default="")


class System_User_Type(SQLModel, table=True):
    """Represents different types of system user type."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_type: str
    permission_allowed: str = Field(default="")


class System_Users(SQLModel, table=True):
    """Represents system users."""

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    fullname: str = Field(default="")
    password: str
    create_date: datetime = Field(default=time_now(0), nullable=False)
    create_by: str
    picture_url: str = Field(default="/static/image/logo.png")
    remark: str = Field(default="")
    email: str = Field(default="")
    address: str = Field(default="")
    status: str = Field(default="ENABLE")
    objectives: str = Field(default="")
    contacts: str = Field(default="")
    company: str = Field(default="")
    system_user_type_id: int = Field(foreign_key="system_user_type.id", nullable=False)


class Log(SQLModel, table=True):
    """Represents log entries."""

    id: Optional[int] = Field(default=None, primary_key=True)
    time: Optional[datetime]
    log_type: Optional[str] = Field(default="info")
    msg: str
    log_owner: int = Field(foreign_key="system_users.id")


class Site_User(SQLModel, table=True):
    """Represents sites User."""

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(nullable=False)
    full_name: Optional[str] = Field(default=None)
    password_hash: str = Field(nullable=False)
    date_joined: datetime = Field(default=time_now())
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)
    role: str = Field(default="", nullable=False)
    pictureUrl: str = Field(default="/static/data_base/image/default/system.jpg")
    system_users_id: int = Field(foreign_key="system_users.id", nullable=False)


class Site_Member(SQLModel, table=True):
    """Represents sites Member."""

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(nullable=False)
    full_name: Optional[str] = Field(default=None)
    password_hash: str = Field(nullable=False)
    date_joined: datetime = Field(default=time_now())
    is_active: bool = Field(default=True)
    role: str = Field(default="", nullable=False)
    pictureUrl: str = Field(default="/static/data_base/image/default/system.jpg")
    address: str = Field(default="")
    message: str = Field(default="")
    remark: str = Field(default="")
    system_users_id: int = Field(foreign_key="system_users.id", nullable=False)


class Transaction(SQLModel, table=True):
    """Represents transactions."""

    id: Optional[int] = Field(default=None, primary_key=True)
    machine: str
    card_id: str
    name: str
    license: str = Field(default="")
    tel: str = Field(default="")
    car_type: str = Field(default="")
    company: str = Field(default="")
    contacts: str
    objective: str
    remark: str = Field(default="")
    create_date: datetime
    create_by: int = Field(foreign_key="site_user.id", nullable=True)
    stamp_date: datetime = Field(default=None, nullable=True)
    stamp_by: int = Field(foreign_key="site_user.id", nullable=True)
    success_date: datetime = Field(default=None, nullable=True)
    success_by: int = Field(foreign_key="site_user.id", nullable=True)
    status: str = Field(default="REGISTERED")
    image_in_url: str = Field(default=None, nullable=True)
    image_stamp_url: str = Field(default=None, nullable=True)
    image_out_url: str = Field(default=None, nullable=True)
    system_users_id: int = Field(foreign_key="system_users.id", nullable=False)


class Transaction_Record(SQLModel, table=True):
    """Represents transactions record."""

    id: Optional[int] = Field(default=None, primary_key=True)
    machine: str
    card_id: str
    name: str
    license: str = Field(default="")
    tel: str = Field(default="")
    car_type: str = Field(default="")
    company: str = Field(default="")
    contacts: str
    objective: str
    remark: str = Field(default="")
    create_date: datetime
    create_by: int = Field(foreign_key="site_user.id", nullable=True)
    stamp_date: datetime = Field(default=None, nullable=True)
    stamp_by: int = Field(foreign_key="site_user.id", nullable=True)
    success_date: datetime = Field(default=None, nullable=True)
    success_by: int = Field(foreign_key="site_user.id", nullable=True)
    status: str = Field(default="REGISTERED")
    image_in_url: str = Field(default=None, nullable=True)
    image_stamp_url: str = Field(default=None, nullable=True)
    image_out_url: str = Field(default=None, nullable=True)
    system_users_id: int = Field(foreign_key="system_users.id", nullable=False)

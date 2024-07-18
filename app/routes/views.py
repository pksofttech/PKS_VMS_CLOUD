"""Module view.py for public endpoints."""

import os
from fastapi import APIRouter, Cookie, Depends, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse, RedirectResponse

# from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.database import get_async_session
from app.core.auth import access_session_token
from app.core.models import App_Configurations
from app.stdio import print_error, time_now, print_debug
from app.core import config

DIR_PATH = config.DIR_PATH
templates = Jinja2Templates(directory="templates")
router = APIRouter(tags=["Public"])


@router.get("/service-worker.js")
async def ep_static():
    """end point static path"""
    print_debug("static")
    return FileResponse("./static/common/service-worker.js")


@router.get("/page_404")
async def page_404(url: str = ""):
    """Function page_404."""
    _now = time_now()
    print_error(f"page_404 : {url}")
    return templates.TemplateResponse(
        "404.html",
        {"request": {}, "now": _now, "app_title": config.APP_TITLE, "url": url},
    )


@router.get("/")
async def page_main(
    db: AsyncSession = Depends(get_async_session),
    userdata=Depends(access_session_token),
):
    """page main"""
    _now = time_now()
    # for check_login user
    print_debug("request from user", userdata)
    # Check login user
    owner_logo = "/static/image/pk_logo.jpg"
    sql = select(App_Configurations.value).where(
        App_Configurations.key == "app_configurations_image"
    )
    row = (await db.execute(sql)).one_or_none()
    if row:
        owner_logo = row[0]
    print_debug(owner_logo)
    # user = None
    if userdata:
        print_debug(userdata)
        match userdata.get("app_mode"):
            case "BUILDING-OWNER":
                print_debug("BUILDING-OWNER: app.html")
                return templates.TemplateResponse(
                    "app.html",
                    {
                        "request": {},
                        "now": _now,
                        "user": userdata,
                        "app_title": config.APP_TITLE,
                        "owner_logo": owner_logo,
                    },
                )
            case "VMS-DEVICES":
                print_debug("VMS-DEVICES: app.html")
                return templates.TemplateResponse(
                    "vms_device.html",
                    {
                        "request": {},
                        "now": _now,
                        "user": userdata,
                        "app_title": config.APP_TITLE,
                        "owner_logo": owner_logo,
                    },
                )

            case _:
                return RedirectResponse(url="/page?page=403")

    print_debug("not User TemplateResponse to login")
    return templates.TemplateResponse(
        "login.html",
        {
            "request": {},
            "now": _now,
            "user": userdata,
            "app_title": config.APP_TITLE,
            "owner_logo": owner_logo,
        },
    )


@router.get("/page/")
async def ep_page(
    page: str,
    db: AsyncSession = Depends(get_async_session),
    user=Depends(access_session_token),
):
    """page path"""
    _now = time_now()
    # for check_login user
    # print("request from user", user)
    # Check login user
    # if not user:
    #     return RedirectResponse(url="/")
    # return None

    page_templates = f"./templates/{page}.html"
    print_debug(page_templates)
    if os.path.isfile(page_templates):
        page_templates = f"{page}.html"
    else:
        page_templates = "404.html"
    return templates.TemplateResponse(
        page_templates,
        {
            "request": {},
            "now": _now,
            "app_title": config.APP_TITLE,
            "user": user,
        },
    )


@router.get("/about")
async def ep_about():
    """end point about"""
    _now = time_now()
    return templates.TemplateResponse(
        "about.html",
        {"request": {}, "now": _now, "app_title": config.APP_TITLE},
    )


@router.get("/ping")
async def ep_ping(request: Request):
    """end point tool-ping"""
    _now = time_now()
    _header = request.headers
    for k, v in _header.items():
        print(k, v)
    return f"Time process : {time_now() - _now}"


# Test

import stripe

"""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"""
"""sk_test_51OYNHeAXQrTOcid5Q83tUgJtYnaAwgPtloIiOmc8NSg4CgUpctAKedSDdvaFLFStdrlD08U3jp5bp9oZnoVdzwPa00F494qnj8"""
stripe.api_key = "sk_test_51OYNHeAXQrTOcid5Q83tUgJtYnaAwgPtloIiOmc8NSg4CgUpctAKedSDdvaFLFStdrlD08U3jp5bp9oZnoVdzwPa00F494qnj8"


# client = StripeClient("sk_test_51OYNHeAXQrTOcid5Q83tUgJtYnaAwgPtloIiOmc8NSg4CgUpctAKedSDdvaFLFStdrlD08U3jp5bp9oZnoVdzwPa00F494qnj8")
@router.get("/payment/get_qr_mock")
async def ep_get_qr_mock(
    request: Request,
    amount: int,
):
    """end point tool-ping"""
    _now = time_now()
    _header = request.headers
    # for k, v in _header.items():
    #     print(k, v)
    # return f"Time process : {time_now() - _now}"

    pm = stripe.PaymentMethod.create(
        type="promptpay",
        billing_details={"email": "pksofttech@gmail.com"},
    )
    pm_id = pm.id
    # print(pm_id)

    try:
        payment_intent: dict = stripe.PaymentIntent.create(
            amount=amount * 100,  # amount in satang
            currency="thb",
            payment_method_types=["promptpay"],
            payment_method=pm_id,
            # automatic_payment_methods={"enabled":True}
        )
    except stripe.error.StripeError as e:
        print_error(e)
        return {"success": False, "data": str(e), "ref": None}

    payment_intent = stripe.PaymentIntent.confirm(
        payment_intent.id,
    )
    print(payment_intent)
    data = payment_intent.get("next_action")
    ref = None
    if data:
        data = data["promptpay_display_qr_code"]["data"]
        ref = payment_intent.get("id")
        print(data)

    return {"success": True, "data": data, "ref": ref}


@router.get("/payment/chack_qr_mock_pay")
async def ep_get_chack_qr_mock_pay(
    request: Request,
    ref: str,
):
    """ep_get_chack_qr_mock_pay"""
    _now = time_now()
    _header = request.headers
    # for k, v in _header.items():
    #     print(k, v)
    success = False
    data = None
    try:
        # Retrieve the PaymentIntent
        payment_intent = stripe.PaymentIntent.retrieve(ref)

        # Check the status
        data = str(payment_intent.status)
        if payment_intent.status == "succeeded":
            print_debug("Payment was successful!")
            print(payment_intent)
            success = True
        else:
            print_debug(f"Payment status: {payment_intent.status}")

    except stripe.error.StripeError as e:
        # Handle errors from Stripe
        print_error(f"An error occurred: {e}")

    return {"success": success, "data": data}


import httpx


@router.post("/strip/{api}")
async def ep_proxy(
    request: Request,
    api: str,
):
    """ep_post_strip"""

    _now = time_now()
    _json = await request.json()
    # print(_json)
    api_key = _json.get("api_key")
    payment_data = _json.get("data")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    stripe_url = "https://api.stripe.com/v1"
    success = False
    if api == "payment_promptpay":
        with httpx.Client() as client:
            url_payment_methods = f"{stripe_url}/payment_methods"
            url_payment_intents = f"{stripe_url}/payment_intents"
            client.headers = headers
            data = {
                "type": payment_data.get("type"),
                "billing_details[email]": payment_data.get("billing_details[email]"),
            }
            r = client.post(url_payment_methods, data=data)
            payment_methods = r.json()
            # print(payment_methods)
            # print("*" * 50)

            if payment_methods.get("error") or not payment_methods.get("id"):
                return {"success": False, "error": payment_methods.get("error")}

            pm_id = payment_methods.get("id")
            data = {
                "amount": 1000,
                "currency": "thb",
                "payment_method": pm_id,
                "payment_method_types[0]": payment_data.get("type"),
            }

            r = client.post(url_payment_intents, data=data)
            payment_intent = r.json()
            # print(payment_intent)
            # print("*" * 50)

            if payment_intent.get("error") or not payment_intent.get("id"):
                return {"success": False, "error": payment_intent.get("error")}

            r = client.post(
                f"{url_payment_intents}/{payment_intent.get("id")}/confirm",
            )
            payment_intent = r.json()
            # print(payment_intent)
            # print("*" * 50)
            data = payment_intent.get("next_action")
            ref = None
            if data:
                data = data["promptpay_display_qr_code"]["data"]
                ref = payment_intent.get("id")
                print(data)

            return {"success": True, "data": data, "ref": ref}
    elif api == "payment_promptpay_status":
        with httpx.Client() as client:
            url_payment_intents = f"{stripe_url}/payment_intents"
            client.headers = headers
            r = client.get(
                f"{url_payment_intents}/{payment_data.get("id")}",
            )
            payment_intent = r.json()
            # print(payment_intent)
            # print("*" * 50)
            status = payment_intent.get("status")
            if status == "succeeded":
                print_debug("Payment was successful!")
                # print(payment_intent)
                success = True
            else:
                print_debug(f"Payment status: {status}")
            return {"success": success, "data": status}

    return {"success": success, "data": None}

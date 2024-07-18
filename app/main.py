"""
    Python3.12
    Edit by Pksofttech
    ? main for set application
"""

# import logging
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager

# from starlette.exceptions import HTTPException
# from fastapi.exceptions import RequestValidationError
# from fastapi.responses import (
#     PlainTextResponse,
#     JSONResponse,
#     RedirectResponse,
#     HTMLResponse,
# )

# from fastapi_mqtt.fastmqtt import FastMQTT
# from fastapi_mqtt.config import MQTTConfig
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from app.stdio import time_now, print_success, print_warning, print_debug

from app.core import auth, database

from app.routes import (
    views,
    websocket,
    api,
)


@asynccontextmanager
async def lifespan(_):
    """lifespan"""
    print_debug("lifespan Start")
    # For init DATABASE
    await database.init_db()
    print_success(f"Server Start Time : {time_now()}")
    yield
    # Clean up the ML models and release the resources
    print_warning(f"Server shutdown Time : {time_now()}")


app = FastAPI(title="LPR-AUTO", version="3.02.1", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="./static"), name="static")
app.mount("/js", StaticFiles(directory="./js"), name="js")

# Set all CORS enabled origins

# root_logger = logging.getLogger()
# root_logger.setLevel(logging.INFO)
# handler = logging.FileHandler("applog.log", "w", "utf-8")
# handler.setFormatter(logging.Formatter(f"%(levelname)s %(asctime)s  %(name)s %(threadName)s : %(message)s"))
# root_logger.addHandler(handler)
#
# root_logger.info(f"************************************************************")
# root_logger.info(f"Start Msg Logger at time {time_now()}")
# root_logger.info(f"************************************************************")

# origins = [
#     "http://localhost.tiangolo.com",
#     "https://localhost.tiangolo.com",
#     "http://localhost",
#     "http://192.168.1.152/",
# ]


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.middleware("http")
# async def add_process_time_header(request: Request, call_next):
#     start_time = time.time()
#     response: Response = await call_next(request)
#     process_time = time.time() - start_time
#     response.headers["X-Process-Time"] = str(process_time)
#     print_debug("*" * 30)
#     print_debug(f"**   {process_time}   **")
#     print_debug("*" * 30)
#     return response


app.include_router(auth.router)
app.include_router(websocket.router)
app.include_router(views.router)

app.include_router(api.router_api)


# @app.exception_handler(HTTPException)
# async def app_exception_handler(request: Request, exception: HTTPException):
#     url_str = str(request.url).split("/")[-1]
#     # print_error(url_str)
#     if request.method == "GET":
#         print_error(exception.detail)
#         if exception.detail == "Not Found":
#             if "." in url_str:
#                 return HTMLResponse(
#                     str(exception.detail), status_code=exception.status_code
#                 )
#             return RedirectResponse(url=f"/page_404?url={request.url}")
#         return PlainTextResponse(
#             str(exception.detail), status_code=exception.status_code
#         )

#     else:
#         return JSONResponse(str(exception.detail), status_code=exception.status_code)

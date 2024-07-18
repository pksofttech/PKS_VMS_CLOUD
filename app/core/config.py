"""
    config.py
    Load configuration from .ini file.
"""

import os

# from dotenv import load_dotenv

# load_dotenv("./.env")


APP_TITLE = "LPR AUTO MANAGEMENT"
APP_VERSION = "V3.02.a"
DIR_PATH = os.getcwd()
# Auth configs.
API_SECRET_KEY = "pksofttech@gmail.com"
API_ALGORITHM = "HS256"
API_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 10

app_configurations_allow_not_register_member = True
IMAGE_MAX_SIZE = (400, 400)

"""utility.py"""

import os

from passlib.context import CryptContext

from app.stdio import print_error, print_info

from app.core import config

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """verify_password"""
    return _pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """get_password_hash"""
    return _pwd_context.hash(password)


def save_image_file(img_raw, file_path, file_name):
    """Save an image file to the specified directory with the given file name.

    Args:
        img_raw (PIL.Image.Image): The raw image object to save.
        file_path (str): The directory path where the image will be saved.
        file_name (str): The name of the image file.

    Returns:
        str: The path to the saved image file, or None if an error occurs.
    """
    if not img_raw:
        print_error("No image provided.")
        return None

    # Ensure the directory exists, create it if not
    if not os.path.exists(file_path):
        os.makedirs(file_path)
        print_info("The new directory is created!")

    with img_raw as img:
        # Convert PNG format to RGB if necessary
        if img.format == "PNG":
            print_info("Converting image to RGB.")
            img = img.convert("RGB")

        # Resize the image to fit the maximum size
        img.thumbnail(config.IMAGE_MAX_SIZE)
        print_info(f"Resized image: {img.size}")

        try:
            # Save the image as a JPEG file
            file_path_save_file = f"{file_path}/{file_name}.jpg"
            img.save(file_path_save_file, "JPEG")
            print_info(f"Image saved successfully: {file_path_save_file}")
            return file_path_save_file
        except Exception as e:
            print_error(f"Error saving image: {e}")
            return None

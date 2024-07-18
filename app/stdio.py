"""stdio for standard for app"""

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from printdebug import DebugPrinter


@dataclass
class DebugColor:
    """class DebugColor"""

    Default = "\033[39m"
    Black = "\033[30m"
    Red = "\033[31m"
    Green = "\033[32m"
    Yellow = "\033[33m"
    Blue = "\033[34m"
    Magenta = "\033[35m"
    Cyan = "\033[36m"
    LightGray = "\033[37m"
    DarkGray = "\033[90m"
    LightRed = "\033[91m"
    LightGreen = "\033[92m"
    LightYellow = "\033[93m"
    LightBlue = "\033[94m"
    LightMagenta = "\033[95m"
    LightCyan = "\033[96m"
    White = "\033[97m"

    HEADER = "\033[95m"
    DEBUG = Cyan
    SUCCESS = Green
    WARNING = Yellow
    ERROR = Red
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    INFO = "\033[96m"

    I = "\033[3m"
    U = "\033[4m"


# debug_enable(False)


def print_error_info():
    """print error info"""
    try:
        exc_type, exc_obj, exc_tb = sys.exc_info()
        if exc_type and exc_obj and exc_tb:
            fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
            _print_error("*" * 50)
            _print_error(exc_type, fname, exc_tb.tb_lineno)
            _print_error("*" * 50)

    except IOError as e:
        _print_error(str(e))


dp = DebugPrinter(
    fmt=DebugColor.DEBUG
    + DebugColor.I
    + "[DEBUG]\t\t:{lineno}\t{filename}:\t#{name}:\t\t"
    + DebugColor.ENDC
)
print_info = dp.debug
print_debug = dp.debug

wp = DebugPrinter(
    fmt=DebugColor.WARNING
    + "[WARN]\t\t:{lineno}\t{filename}:\t#{name}:\t\t"
    + DebugColor.ENDC
)
print_warning = wp.debug

ep = DebugPrinter(
    fmt=DebugColor.ERROR
    + "[ERROR]\t\t:{lineno}\t{filename}:\t#{name}:\t\t"
    + DebugColor.ENDC
)
_print_error = ep.debug

sp = DebugPrinter(
    fmt=DebugColor.SUCCESS
    + "[SUCCESS]\t:{lineno}\t{filename}:\t#{name}:\t\t"
    + DebugColor.ENDC
)
print_success = sp.debug


def print_error(*args):
    """print error"""
    _print_error(*args)
    print_error_info()


def time_now(utc_offset: int = 7) -> datetime:
    """
    Get the current time with an optional UTC offset.

    Args:
        utc_offset (int): The UTC offset in hours. Default is 7.

    Returns:
        datetime: The current time with the specified UTC offset, with tzinfo set to None.
    """
    tz = timezone(timedelta(hours=utc_offset))
    current_time = datetime.now(tz=tz)

    return current_time.replace(tzinfo=None)


print("test console print")
print_debug("test console print_debug")
print_success("test console print_success")
print_warning("test console print_warning")
print_error("test console print_error")

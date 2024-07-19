


from datetime import datetime

import pytz


def get_time_zone():
    utc = datetime.now(pytz.utc)
    tm = pytz.timezone("Etc/GMT-3")
    gmt = utc.astimezone(tm)
    return gmt.strftime("%H:%M")
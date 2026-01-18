from flask import jsonify
import pytz
import requests
from flask_apscheduler import APScheduler
import logging 
from datetime import datetime
import conf
from flask import Blueprint, request, jsonify

prev_bp = Blueprint('previously',__name__)


prevTracks = {'tracks':{}}



logging.basicConfig(filename='self.app.log') #logger


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

fh = logging.FileHandler('example.log')
fh.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(fh)
logger.addHandler(ch)


@prev_bp.route("",methods=['GET'])
def returnList():
    return jsonify(prevTracks)


def add_tracks(time, track):
    
    def track_to_array(time, track):
        prevTracks['tracks'][time] = track
        logger.info('[prevTrack] Added a new track to the list.')

    # Check if the previous track is not the same as the present
    if len(prevTracks['tracks']) >= 30 and int(datetime.now(pytz.utc).astimezone(pytz.timezone("Etc/GMT-3")).strftime("%H")) == 0:
        empty_tracks()
        logger.info('[prevTrack] Removing tracks as the list exceeded 30 entries and it is midnight.')

    keys = list(prevTracks['tracks'].keys())
    values = list(prevTracks['tracks'].values())

    if keys:
        if time not in keys and str(values[-1]) != str(track):
            track_to_array(time, track)
    else:
        track_to_array(time, track)


def empty_tracks():
    global prevTracks
    prevTracks['tracks'] = {}
    logger.info('[prevTrack]Tracks list has been cleared.')



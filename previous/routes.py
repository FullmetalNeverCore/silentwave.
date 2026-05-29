from flask import jsonify
import pytz
import requests
from flask_apscheduler import APScheduler
from datetime import datetime
import conf
from flask import Blueprint, request, jsonify

prev_bp = Blueprint('previously',__name__)


prevTracks = {'tracks':{}}









# Add the handlers to the logger


@prev_bp.route("",methods=['GET'])
def returnList():
    return jsonify(prevTracks)


def add_tracks(time, track):
    
    def track_to_array(time, track):
        prevTracks['tracks'][time] = track

    # Check if the previous track is not the same as the present
    if len(prevTracks['tracks']) >= 30 and int(datetime.now(pytz.utc).astimezone(pytz.timezone("Etc/GMT-3")).strftime("%H")) == 0:
        empty_tracks()

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



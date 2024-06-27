from flask import jsonify
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


@prev_bp.route("/",methods=['GET'])
def returnList():
    logger.debug(prevTracks)
    return jsonify(prevTracks)


def add_tracks(time,track):
    kys = list(prevTracks['tracks'].keys())
    vls = list(prevTracks['tracks'].values())
    #check if previous track if not the same as present
    if len(prevTracks['tracks']) >= 50:
         prevTracks['tracks'].pop(0) # removing there are more then 50 entries in list 
    if time not in kys and (len(kys) == 0 or prevTracks['tracks'][kys[len(kys)-1]] != track):
            prevTracks['tracks'][time] = track 
            logger.info('[prevTrack]Added a new track to the list.')


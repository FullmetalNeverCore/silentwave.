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

# def reverse_elements(d):
#      keys = list(d.keys())[::-1]
#      values = list(d.values())[::-1]

#      tempDict = {}
#      if len(keys) == 0:
#          return tempDict
#      for x,y in zip(keys,values):
#         tempDict[x] = y
#      return tempDict

@prev_bp.route("/",methods=['GET'])
def returnList():
    #reversing
    # print(prevTracks)
    # copyPT = {'tracks': reverse_elements(prevTracks['tracks'])}
    # print(prevTracks)
    return jsonify(prevTracks)


def add_tracks(time,track):
    kys = list(prevTracks['tracks'].keys())
    vls = list(prevTracks['tracks'].values())


    #check if previous track if not the same as present
    if len(prevTracks['tracks']) >= 30:
        oldest_time = kys[-1]
        del prevTracks['tracks'][oldest_time] # removing there are more then 50 entries in list 

    if kys:
        if time not in kys and str(vls[-1]) != str(track):
                prevTracks['tracks'][time] = track 
                logger.info('[prevTrack]Added a new track to the list.')
    else:
            prevTracks['tracks'][time] = track
            logger.info('[prevTrack]Added a new track to the list.')


def nullify_tracks():
    if len(prevTracks['tracks']) >= 10:
        prevTracks['tracks'] = {}
        logger.info('[prevTrack]Tracks list has been cleared.')


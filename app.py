import random
from flask import Flask, render_template, jsonify, request, abort, Response
import requests
import socket
from datetime import datetime
from dataclasses import dataclass, replace
import logging
import bg_list
from flask_apscheduler import APScheduler
import conf
import pytz

# logging
logging.basicConfig(filename='self.app.log')
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

fh = logging.FileHandler('example.log')
fh.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)

logger.addHandler(fh)
logger.addHandler(ch)

import previous.routes
from previous.routes import prev_bp
from track_name.routes import tn_bp

# flask app
app = Flask(__name__)
app.register_blueprint(prev_bp, url_prefix='/previous')
app.register_blueprint(tn_bp, url_prefix='/track_name')

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

bgi = bg_list.bglist
music_host = conf.music_host

@app.route('/endpoints', methods=['GET'])
def get_endpoints():
    logger.warning('Trying to get endpoints...')
    routes = {}
    for r in app.url_map._rules:
        routes[r.rule] = {}
        routes[r.rule]["functionName"] = r.rule
        routes[r.rule]["methods"] = list(r.methods)
    routes.pop("/static/<path:filename>")
    logger.info('Endpoints returned')
    return jsonify(routes)

@app.route("/test")
def test_home():
    name = "silentwave."
    if datetime.now().month >= 12 and datetime.now().month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    background = get_season_background(season)
    logger.info('Welcome to %s, currently its %s season.', name, season)
    return render_template('styletest.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)

def get_season_background(season):
    if 9 <= datetime.now().hour < 21:
        time = 'day'
        background = random.choice(bgi[season][time])
    else:
        time = 'night'
        background = random.choice(bgi[season][time])
    return background

@app.route("/")
def home_page():
    name = "silentwave."
    if datetime.now().month >= 12 and datetime.now().month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    background = get_season_background(season)
    logger.info('Welcome to %s, currently its %s season.', name, season)
    return render_template('helloworld.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)

def get_time_zone():
    utc = datetime.now(pytz.utc)
    tm = pytz.timezone("Etc/GMT-3")
    gmt = utc.astimezone(tm)
    return gmt.strftime("%H:%M")

@scheduler.task('interval', id='check_tracks', seconds=5, misfire_grace_time=900)
def check_tracks():
    status_url = f'{conf.host}/status.xsl'
    response = requests.get(status_url)
    html = response.text
    try:
        track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
        current_time = get_time_zone() #getting time in correct time zone
        previous.routes.add_tracks(time=current_time, track=track_name)
    except Exception as e:
        logger.error(f'{e} - Is RadioDJ working fine?')

if __name__ == "__main__":
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
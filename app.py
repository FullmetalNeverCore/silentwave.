import random
from flask import Flask, render_template, jsonify, request, abort, Response, url_for, send_file
import requests
import socket
from datetime import datetime
from dataclasses import dataclass, replace
import logging
import bg_list
from flask_apscheduler import APScheduler
import conf
import pytz
import misc 
import numpy as np
import threading
import time
from scipy import signal
from scipy.io import wavfile
import json

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

app = Flask(__name__)
app.register_blueprint(prev_bp, url_prefix='/previous')
app.register_blueprint(tn_bp, url_prefix='/track_name')

@app.after_request
def add_cors_headers(response):
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, Accept')
    response.headers.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
    return response

scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

bgi = bg_list.bglist
music_host = conf.music_host
bgtype = ['nier','silenthill']

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
    return render_template('styletest.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)

@app.route("/prodtest")
def test_prod():
    name = "silentwave."
    return render_template('prodtest.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)

def get_background(season, bg_type):
    match bg_type: 
        case 'silenthill':
            if 9 <= datetime.now().hour < 21:
                time = 'day'
                background = random.choice(bgi['silenthill'][season][time])
            else:
                time = 'night'
                background = random.choice(bgi['silenthill'][season][time])
        case 'nier':
            background = random.choice(bgi['nier'])
        case _:  
            logger.error(f'Неизвестный тип фона: {bg_type}')
            return None  
    return background

@app.route("/")
def home_page():
    name = "silentwave."
    bgt = random.choice(bgtype)
    current_date = datetime.now()
    if current_date.month == 10 and current_date.day == 31:
        season = 'halloween'
        background = bgi['hw']
        return render_template('halloween.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)
    elif current_date.month >= 12 or current_date.month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    background = get_background(season,bgt)
    vhstime = 2001 if bgt == 'silenthill' else 11945
    return render_template('helloworld.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background,year = vhstime)

@scheduler.task('interval', id='check_tracks', seconds=5, misfire_grace_time=900)
def check_tracks():
    pass

@app.route('/random_bg')
def random_bg():
    pass

@app.route('/alpine')
def alpine():
    return render_template('alpine_lowend.html', title='Alpine Visualizer',
                         stream_url=url_for('stream'),
                         test_audio_url=url_for('test_audio'))

@app.route('/test-audio')
def test_audio():
    try:
        return send_file('static/test_audio.wav', mimetype='audio/wav')
    except Exception as e:
        logger.error(f"Test audio error: {e}")
        return Response("Test audio not found", status=404)

@app.route('/stream', methods=['GET', 'HEAD', 'OPTIONS'])
def stream():
    if request.method == 'OPTIONS':
        response = Response()
        return response

    try:
        upstream_url = conf.music_host
        logger.info(f"Proxying request for {request.path} to {upstream_url}")
        range_header = request.headers.get('Range', None)
        proxy_headers = {'Range': range_header} if range_header else {}
        r = requests.get(upstream_url, stream=True, headers=proxy_headers, timeout=10)
        response_headers = {}
        copy_headers = ['Content-Type', 'Content-Length', 'Accept-Ranges', 'Content-Range']
        for h in copy_headers:
            if h in r.headers:
                response_headers[h] = r.headers[h]
        response = Response(
            r.iter_content(chunk_size=8192), 
            status=r.status_code, 
            headers=response_headers,
            mimetype=r.headers.get('Content-Type')
        )
        return response

    except requests.exceptions.RequestException as e:
        logger.error(f"Stream proxy error: {e}")
        return Response("Stream error: could not connect to upstream server", status=502)

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
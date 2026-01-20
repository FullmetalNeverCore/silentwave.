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
import misc 

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
    if datetime.now().month >= 12 and datetime.now().month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    background = get_season_background(season)
    logger.info('Welcome to %s, currently its %s season.', name, season)
    return render_template('styletest.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)


# @app.route("/hw")
# def hw():
#     name = "silentwave."
#     season = 'halloween'
#     background = bgi['hw']
#     logger.info('Welcome to %s, currently its %s season.,HALLOWEEN MODE', name, season)
#     return render_template('halloween.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)


# @app.route("/hwtest")
# def hw_home():
#     name = "silentwave."
#     season = 'halloween'
#     background = bgi['hw']
#     logger.info('Welcome to %s, currently its %s season.,HALLOWEEN MODE', name, season)
#     return render_template('halloweentest.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)

@app.route("/prodtest")
def test_prod():
    name = "silentwave."
    if datetime.now().month >= 12 and datetime.now().month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    background = get_season_background(season)
    logger.info('Welcome to %s, currently its %s season.', name, season)
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

@app.route('/stream_proxy')
def stream_proxy():
    import requests
    from flask import Response
    def generate():
        r = requests.get(conf.music_host, stream=True, timeout=10)
        for chunk in r.iter_content(chunk_size=1024):
            yield chunk
    return Response(generate(), content_type="audio/mpeg")

@app.route("/")
def home_page():
    name = "silentwave."
    bgt = random.choice(bgtype)
    current_date = datetime.now()
    
    # Device detection
    user_agent = request.headers.get('User-Agent', '').lower()
    is_mobile = any(keyword in user_agent for keyword in ['mobile', 'android', 'iphone', 'ipad', 'touch'])

    if current_date.month == 10 and current_date.day == 31:
        season = 'halloween'
        background = bgi['hw']
        logger.info('Добро пожаловать в %s, сейчас сезон %s. РЕЖИМ ХЭЛЛОУИНА', name, season)
        return render_template('halloween.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)
    
    if current_date.month >= 12 or current_date.month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    
    background = get_background(season, bgt)
    vhstime = 2001 if bgt == 'silenthill' else 11945
    logger.info('Добро пожаловать в %s, сейчас сезон %s.', name, season)
    
    if is_mobile:
        return render_template('helloworld.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background, year=vhstime)
    else:
        return render_template('tv_3d.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background, year=vhstime)

@scheduler.task('interval', id='check_tracks', seconds=5, misfire_grace_time=900)
def check_tracks():
    status_url = f'{conf.host}/status.xsl'
    response = requests.get(status_url)
    html = response.text
    try:
        track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
        current_time = misc.get_time_zone() #getting time in correct time zone
        previous.routes.add_tracks(time=current_time, track=track_name)
    except Exception as e:
        logger.error(f'{e} - Is RadioDJ working fine?')

@app.route('/robots.txt')
def robots():
    return app.send_static_file('robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return app.send_static_file('sitemap.xml')

@app.route('/random_bg')
def random_bg():
    now = datetime.now()
    if now.month == 10 and now.day == 31:
        background = bgi.get('hw')
    else:
        if now.month >= 12 or now.month <= 2:
            season = 'winter'
        else:
            season = 'summer'
        bgt_choice = random.choice(bgtype)
        background = get_background(season, bgt_choice)
    return jsonify({'bg_img': background})

@app.route('/alpine')
def alpine():
    return render_template('alpine.html', title='Alpine Visualizer')

if __name__ == "__main__":
    # app.debug = True
    app.run(host='0.0.0.0',debug=True, port=5000)
    # app.run(host='0.0.0.0', debug=True, port=5000, ssl_context=('192.168.8.14.pem','192.168.8.14-key.pem'))
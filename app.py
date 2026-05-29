import random
from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime
import logging
import bg_list
import conf

# logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

# flask app
app = Flask(__name__)

bgi = bg_list.bglist
music_host = conf.music_host
bgtype = ['nier','silenthill']

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
            return None  
    return background

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
        return render_template('halloween.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background)
    
    if current_date.month >= 12 or current_date.month <= 2:
        season = 'winter'
    else:
        season = 'summer'
    
    background = get_background(season, bgt)
    vhstime = 2001 if bgt == 'silenthill' else 11945
    
    if is_mobile:
        return render_template('helloworld.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background, year=vhstime)
    else:
        return render_template('tv_3d.html', title='silentwave.', username=name, stream_url=f'{music_host}', bg_img=background, year=vhstime)

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
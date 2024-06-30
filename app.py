import random
from flask import Flask,render_template,jsonify,request,abort,Response
import requests
import socket 
from datetime import datetime
from dataclasses import dataclass,replace
import logging
import bg_list
from flask_apscheduler import APScheduler
import conf 
import pytz



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


import previous.routes
from previous.routes import prev_bp
from track_name.routes import tn_bp



class SiteItSelf():

    def __init__(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.music_host = conf.music_host
        self.host = conf.host

        self.app = Flask(__name__)
        #endpoints
        self.app.register_blueprint(prev_bp,url_prefix='/previous')
        self.app.register_blueprint(tn_bp,url_prefix='/track_name')

        _scheduler = APScheduler()
        _scheduler.init_app(self.app)

        _scheduler.start() #starting scheduler
        
        self.bgi = bg_list.bglist

                    

        #Mainly used in admin panel,endpoint return every endpoint in flask backend
        @self.app.route('/endp',methods=['GET'])
        def endp():
            logger.warning('Trying to get endpoints...')
            routes = {}
            for r in self.app.url_map._rules:
                routes[r.rule] = {}
                routes[r.rule]["functionName"] = r.rule
                routes[r.rule]["methods"] = list(r.methods)
            routes.pop("/static/<path:filename>")
            #print(routes)
            logger.info('Endpoints returned')
            return jsonify(routes)
        
        @self.app.route("/test")
        def testhome():
                name = "silentwave."
                if datetime.now().month >= 12 and datetime.now().month <= 2:
                    season = 'winter'
                else:
                     season = 'summer'
                background = season_getter(season)
                logger.info('Welcome to %s,currently its %s season.',name,season)
                return render_template('styletest.html', title='silentwave.', username=name,stream_url=f'{self.music_host}',bg_img=background)

                
        def season_getter(season):
                    if int(datetime.now().hour) >= 9 and int(datetime.now().hour) < 21:
                        time = 'day'
                        background = random.choice(self.bgi[season][time])
                    else:
                        time = 'night'
                        background = random.choice(self.bgi[season][time])  
                        
                    return background
                
        #index page
        @self.app.route("/")
        def home():
                name = "silentwave."
                if datetime.now().month >= 12 and datetime.now().month <= 2:
                    season = 'winter'
                else:
                     season = 'summer'
                background = season_getter(season)
                logger.info('Welcome to %s,currently its %s season.',name,season)
                return render_template('helloworld.html', title='silentwave.', username=name,stream_url=f'{self.music_host}',bg_img=background)

        def gettingTimeZone():
            utc = datetime.now(pytz.utc)  
            tm = pytz.timezone("Etc/GMT-3")
            gmt = utc.astimezone(tm)
            return gmt.strftime("%H:%M")
                
        @_scheduler.task('interval', id='check_tracks', seconds=5, misfire_grace_time=900)
        def check_tracks():
            status_url = f'{conf.host}/status.xsl'
            response = requests.get(status_url) 
            html = response.text
            try:
                            track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
                            current_time = gettingTimeZone() #getting time in correct time zone
                            previous.routes.add_tracks(time=current_time,track=track_name)
            except Exception as e:
                            logger.error(f'{e} - Is RadioDJ working fine?')
        

        @_scheduler.task('interval', id='check_tracks', minutes=60, misfire_grace_time=900)
        def nullifyTrackHistory():
            if datetime.now().strftime("%H") == "00":
                previous.routes.nullify_tracks()












    def run(self):
        self.app.debug = True 
        self.app.run(host = '0.0.0.0',port=5000)







        


if __name__ == "__main__":
    webRad = SiteItSelf()
    webRad.run()

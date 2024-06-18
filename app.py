import random
from flask import Flask,render_template,jsonify,request,abort,Response
import requests
import socket 
import datetime
from dataclasses import dataclass,replace
import logging
import bg_list




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



class Data:

    @dataclass 
    class MTMode:
        maintance : bool 

    @dataclass
    class IPClass:
        ip : str 



    @dataclass 
    class ip_whitelist:
         ipw : list 



class SiteItSelf():

    def __init__(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.music_host = "https://cast.az-streamingserver.com/proxy/nncdcccp/stream" #cors fix
        self.host = "http://cast.az-streamingserver.com:8755"
        default_allowed_ips = ['127.0.0.1']
        try:
                # Try to connect to a router
                s.connect(('10.255.255.255', 1))
                ip = s.getsockname()[0]
                default_allowed_ips.append(ip)
        except Exception as e:
                # If the connection fails, just pass

                pass
        finally:
                s.close()
        logger.info('Current ip - %s',ip)
        self.ip = Data.IPClass(ip)
        logger.info(self.ip.ip)
        self.app = Flask(__name__)
        self.mt = Data.MTMode(False)
        self.whitelist = Data.ip_whitelist(default_allowed_ips)
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
                logger.warn(self.ip.ip)
                name = "silentwave."
                background = random.choice(self.bgi)
                logger.info('Welcome to %s',name)
                if not self.mt.maintance:
                    return render_template('styletest.html', title='silentwave.', username=name,stream_url=f'{self.music_host}',bg_img=background)
                else: 
                    return render_template('maintance.html')
                
            
                
        #index page
        @self.app.route("/")
        def home():
                logger.warn(self.ip.ip)
                name = "silentwave."
                background = random.choice(self.bgi)
                logger.info('Welcome to %s',name)
                if not self.mt.maintance:
                    return render_template('helloworld.html', title='silentwave.', username=name,stream_url=f'{self.music_host}',bg_img=background)
                else: 
                    return render_template('maintance.html')
            
        #Get current song data
        @self.app.route('/track_name')
        def track_name():
                logger.warning('Trying to get /track_name')
                status_url = f'{self.host}/status.xsl'
                response = requests.get(status_url) 
                html = response.text
                try:
                    track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
                    listeners = html.split('<td class="streamstats">')[3].split('</td>')[0]
                    logger.info('Return of track name is successful.')
                    return jsonify({'track_name': track_name,'listeners' : listeners})
                except Exception as e:
                    logger.error(f'{e} - Is RadioDJ working fine?')
                    return jsonify({'track_name':'null','listeners':0})













    def run(self):
        self.app.debug = True 
        self.app.run(host = '0.0.0.0',port=5000)







        


if __name__ == "__main__":
    webRad = SiteItSelf()
    webRad.run()

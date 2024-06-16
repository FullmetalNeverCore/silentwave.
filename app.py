from flask import Flask,render_template,jsonify,request,abort,Response
import requests
import socket 
import datetime
from dataclasses import dataclass,replace
import logging




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
    class BGIMG:   #bg image 
        morning_link : str


    @dataclass 
    class ip_whitelist:
         ipw : list 



class SiteItSelf():

    def __init__(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.host = "cast.az-streamingserver.com:8755"
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
        self.bgi = Data.BGIMG('https://i.imgur.com/N0eAUAq.jpeg')



        def whitelist_req(view_func):
            def wrapper(*args, **kwargs):
                    if request.remote_addr not in self.whitelist.ipw:
                        abort(403)  # Return a "Forbidden" HTTP status code if the user's IP is not in the whitelist
                    return view_func(*args, **kwargs)
            wrapper.__name__ = view_func.__name__
            return wrapper

        @self.app.route('/ipw',methods=['GET'])
        def ipw():
                return jsonify(self.whitelist.ipw)


                    

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

        #index page
        @self.app.route("/")
        def home():
                logger.warn(self.ip.ip)
                name = "silentwave."
                time = None
                if int(datetime.datetime.now().hour) >= 9 and int(datetime.datetime.now().hour) < 18: 
                    time = 'day'
                    background = self.bgi.morning_link 
                elif int(datetime.datetime.now().hour) >= 18 and int(datetime.datetime.now().hour) < 23:
                    time = 'evening'
                    background = self.bgi.morning_link 
                else:
                    time = 'night'
                    background = self.bgi.morning_link 
                logger.info('Welcome to %s currently its in %s mode',name,time)
                if not self.mt.maintance:
                    return render_template('helloworld.html', title='silentwave.', username=name,stream_url=f'{self.host}/live',bg_img=background)
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

        #Admin panel
        @self.app.route('/ad_panel')
        @whitelist_req
        def ad_panel():
                logger.warning('Accessing ad_panel from - %s',request.remote_addr)
                return render_template('ad_panel.html')







        @self.app.route('/queue_return',methods=['POST'])
        def queue_return():
            try:
                data = request.get_json()
                uname = data.get('username')
                passw = data.get('password')
                conn = self.db.login(uname,passw) #checking username and password
                if not conn == False:
                    print('successful login')
                    return '<h1>test</h1>' #returning data from the database table
                else: 
                    print('unlogin')
                    return 'Not'
            except Exception as e:
                return 'Not'




    def run(self):
        self.app.debug = True 
        self.app.run(host = '0.0.0.0',port=5000)







        


if __name__ == "__main__":
    webRad = SiteItSelf()
    webRad.run()

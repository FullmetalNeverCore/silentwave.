from flask import Flask,render_template,jsonify,request
import requests
import db_works
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
        evening_link : str 
        night_link : str 



class SiteItSelf(Data):

    def __init__(self):
        hostname = socket.gethostname()
        ipadd = socket.gethostbyname(hostname)#ip adress of localnet for testing
        logger.info('Current ip - %s',ipadd)
        self.app = Flask(__name__)
        self.mt = super().MTMode(False)
        self.ip = super().IPClass(str(ipadd))
        self.bgi = super().BGIMG('https://cdna.artstation.com/p/assets/images/images/004/720/972/large/randall-mackey-mural2.jpg?1485790389',
                                 'https://livewire.thewire.in/wp-content/uploads/2022/02/DanyloHrechyshkinSovietwave-1024x650.jpeg',
                                 'https://wallpapercave.com/wp/wp9186396.jpg')
        self.db = db_works.DBWorks() #Connecting to db
        self.db.create_tables_if_not_exist() #initialisation        

        #endpoint for getting song like points from database
        @self.app.route('/get_songs_data',methods=['POST',
                                            'GET'])
        def get_songs_data():
                match(request.method):
                    case 'GET':
                        logger.warning('%s accessing /get_songs_data',request.remote_addr)
                        title = request.form['title']
                        return self.db_query('get_love_data',title)
                    case 'POST':
                        logger.warning('%s accessing /get_songs_data add mark',request.remote_addr)
                        title = request.form['title']
                        return  self.db_query('love',title)
                    

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
                name = "SovietWave Radio"
                time = None
                if int(datetime.datetime.now().hour) >= 9 and int(datetime.datetime.now().hour) < 18: 
                    time = 'day'
                    background = self.bgi.morning_link 
                elif int(datetime.datetime.now().hour) >= 18 and int(datetime.datetime.now().hour) < 23:
                    time = 'evening'
                    background = self.bgi.evening_link
                else:
                    time = 'night'
                    background = self.bgi.night_link
                logger.info('Welcome to %s currently its in %s mode',name,time)
                if not self.mt.maintance:
                    return render_template('helloworld.html', title='SovietWave Radio', username=name,stream_url=f'http://{self.ip.ip}:8000/stream',bg_img=background)
                else: 
                    return render_template('maintance.html')
            
        #Get current song data
        @self.app.route('/track_name')
        def track_name():
                logger.warning('Trying to get /track_name')
                status_url = 'http://localhost:8000/status.xsl'
                response = requests.get(status_url) 
                html = response.text
                try:
                    track_name = html.split('<td class="streamstats">')[5].split('</td>')[0]
                    listeners = html.split('<td class="streamstats">')[3].split('</td>')[0]
                    logger.info('Return of track name is successful.')
                    return jsonify({'track_name': track_name,'listeners' : listeners})
                except Exception as e:
                    logger.error(f'{e} - Is RadioDJ working fine?')
                    return jsonify({'track_name':'null','listeners':0})

        #Admin panel
        @self.app.route('/ad_panel')
        def ad_panel():
                logger.warning('Accessing ad_panel from - %s',request.remote_addr)
                return render_template('ad_panel.html')


        #Maintenance 
        @self.app.route('/mt_mode',methods=['POST'])
        def mt_mode():
                uname = request.form['username']
                passw = request.form['password']
                conn = self.auth_check(uname,passw) #checking username and password
                logger.warning('Attempting to change maintenance mode from - %s',request.remote_addr)
                #print('Attempt to enter maintenance mode')
                if not conn == False:
                    logger.info('Successful login!')
                    #print('successful login')
                    if self.mt.maintance:
                        self.mt = self.MTMode(False)
                    else: 
                        self.mt = self.MTMode(True)
                    logger.info("Maintenance mode state is - %s",mt)
                    #bgi = BGIMG(str(link)) if type(link) is str else bgi
                    return '.' #returning data from the database table
                else: 
                    logger.error('Error with verifying user - %s',request.remote_addr)
                    #print('unlogin')
                    return 'Not'


        #Update site's background image
        @self.app.route('/img_update',methods=['POST'])
        def img_update():
                logger.warning('Updating img from - %s',request.remote_addr)
                #print(request.form)
                uname = request.form['username']
                passw = request.form['password']
                link = request.form['link']
                time = request.form['time']
                conn = self.db.login(uname,passw) #checking username and password
                global bgi
                swap = {'1':replace(self.bgi,morning_link=link),'2':replace(self.bgi,evening_link=link),'3':replace(self.bgi,morning_link=link)}
                #print(bgi)
                #print('Attempt to change image')
                if not conn == False:
                    #print('successful login')
                    if type(link) is str:
                        logger.info('Success!')
                        self.bgi = swap.get(time)
                        #print(bgi)
                    else: 
                        logger.error('Change ends with error - ling is not str')
                        pass 
                    #bgi = BGIMG(str(link)) if type(link) is str else bgi
                    return '.' #returning data from the database table
                else: 
                    logger.error('Error with verifying user - %s',request.remote_addr)
                    #print('unlogin')
                    return 'Not'



        @self.app.route('/queue_return',methods=['POST'])
        def queue_return():
            try:
                uname = request.form['username']
                passw = request.form['password']
                conn = self.db.login(uname,passw) #checking username and password
                if not conn == False:
                    print('successful login')
                    return '<h1>test</h1>' #returning data from the database table
                else: 
                    print('unlogin')
                    return 'Not'
            except Exception as e:
                return 'Not'

        #Admin panel
        @self.app.route('/admin')
        def admin():
                logger.warning('Accessing /admin from - %s',request.remote_addr)
                return render_template('admin.html')

        #Verifying credentials to return admin page functionality
        @self.app.route('/verify_credentials',methods=['POST'])
        def verf_cred():
                logger.warning('Second layer of ad_panel verification,from - %s',request.remote_addr)
                uname = request.form['username']
                passw = request.form['password']
                conn = self.db.login(uname,passw) #checking username and password
                #print(conn)
                if not conn == False:
                    logger.info("Successful login!")
                    #print('successful login')
                    return jsonify({'username': request.form['username'],'id':conn[1],'password':request.form['password'],'code':'''
            <h1 class="text-center" id="uppertext">Thats gonna be admin panel!</h1>
            <h2 class="text-center" id="statustext" hidden>Thats gonna be admin panel!</h2>
            </div>
            <div class="container" id="imgchange" hidden>
                <div class="row" id="def_prod"></div>
                <h1>Upload Image</h1>
                <div class="form-group">
                    <label for="linkIMG">Image-Link</label>
                    <input type="input" class="form-control" id="linkIMG" aria-describedby="emailHelp" placeholder="Enter link">
                        <select class="form-select form-select-lg mb-3" aria-label=".form-select-lg example" id='time_sel'>
                        <option selected value="1">Morning</option>
                        <option value="2">Evening</option>
                        <option value="3">Night</option>
                        </select>
                </div>             
                    '''}) #jsonify username and id to send back to ad_panel page
                else: 
                    logger.error('Error with verifying user in second layer of verification - %s',request.remote_addr)
                    #print('unlogin')
                    return 'Not'

    def run(self):
        self.app.debug = True 
        self.app.run(host = '0.0.0.0',port=5000)

    #function to optimize work with db data.
    def db_query(self,func,title):
        logger.info('At the crossroad of db_que title %s',title)
        match func:
            case 'love':
                conn = self.db.add_love(title)
            case 'get_love_data':
                conn = self.db.check_song(title)

        if not conn == False: 
                return jsonify({'love':conn[0]})
        else:
                return 'Not'

    #Admin authentication
    def auth_check(self,u,p):
        logger.warning('Trying to log in to ad_panel from - %s',request.remote_addr)
        conn = self.db.login(u,p) 
        if conn:
            return True 
        else: 
            return False 
        


if __name__ == "__main__":
    webRad = SiteItSelf()
    webRad.run()

from flask import Flask,render_template,jsonify,request
import requests
import db_works
import socket 
import datetime
from dataclasses import dataclass,replace
import logging


app = Flask(__name__)
logging.basicConfig(filename='app.log') #logger

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

#Dataclasses 

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


#function to optimize work with db data.
def db_query(func,title):
    logger.info('At the crossroad of db_que title %s',title)
    match func:
         case 'love':
              conn = db.add_love(title)
         case 'get_love_data':
              conn = db.check_song(title)

    if not conn == False: 
            return jsonify({'love':conn[0]})
    else:
            return 'Not'

#endpoint for getting song like points from database
@app.route('/get_songs_data',methods=['POST'])
def get_songs_data():
        logger.warning('%s accessing /get_songs_data',request.remote_addr)
        title = request.form['title']
        return db_query('get_love_data',title)

@app.route('/add_song_love',methods=['POST'])
def add_song_love():
    logger.warning('%s accessing add_song_love',request.remote_addr)
    title = request.form['title']
    return  db_query('love',title)

#Mainly used in admin panel,endpoint return every endpoint in flask backend
@app.route('/endp',methods=['GET'])
def endp():
    logger.warning('Trying to get endpoints...')
    routes = {}
    for r in app.url_map._rules:
        routes[r.rule] = {}
        routes[r.rule]["functionName"] = r.rule
        routes[r.rule]["methods"] = list(r.methods)
    routes.pop("/static/<path:filename>")
    #print(routes)
    logger.info('Endpoints returned')
    return jsonify(routes)

#index page
@app.route("/")
def home():
        name = "SovietWave Radio"
        time = None
        if int(datetime.datetime.now().hour) >= 9 and int(datetime.datetime.now().hour) < 18: 
            time = 'day'
            background = bgi.morning_link 
        elif int(datetime.datetime.now().hour) >= 18 and int(datetime.datetime.now().hour) < 23:
            time = 'evening'
            background = bgi.evening_link
        else:
            time = 'night'
            background = bgi.night_link
        logger.info('Welcome to %s currently its in %s mode',name,time)
        if not mt.maintance:
            return render_template('helloworld.html', title='SovietWave Radio', username=name,stream_url=f'http://{ip.ip}:8000/stream',bg_img=background)
        else: 
            return render_template('maintance.html')
        
#Get current song data
@app.route('/track_name')
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
@app.route('/ad_panel')
def ad_panel():
        logger.warning('Accessing ad_panel from - %s',request.remote_addr)
        return render_template('ad_panel.html')

#Admin authentication
def auth_check(u,p):
    logger.warning('Trying to log in to ad_panel from - %s',request.remote_addr)
    conn = db.login(u,p) 
    if conn:
        return True 
    else: 
        return False 

#Maintenance 
@app.route('/mt_mode',methods=['POST'])
def mt_mode():
        uname = request.form['username']
        passw = request.form['password']
        conn = auth_check(uname,passw) #checking username and password
        logger.warning('Attempting to change maintenance mode from - %s',request.remote_addr)
        #print('Attempt to enter maintenance mode')
        if not conn == False:
            logger.info('Successful login!')
            #print('successful login')
            global mt
            if mt.maintance:
                mt = MTMode(False)
            else: 
                mt = MTMode(True)
            logger.info("Maintenance mode state is - %s",mt)
            #bgi = BGIMG(str(link)) if type(link) is str else bgi
            return '.' #returning data from the database table
        else: 
            logger.error('Error with verifying user - %s',request.remote_addr)
            #print('unlogin')
            return 'Not'


#Update site's background image
@app.route('/img_update',methods=['POST'])
def img_update():
        logger.warning('Updating img from - %s',request.remote_addr)
        #print(request.form)
        uname = request.form['username']
        passw = request.form['password']
        link = request.form['link']
        time = request.form['time']
        conn = db.login(uname,passw) #checking username and password
        global bgi
        swap = {'1':replace(bgi,morning_link=link),'2':replace(bgi,evening_link=link),'3':replace(bgi,morning_link=link)}
        #print(bgi)
        #print('Attempt to change image')
        if not conn == False:
            #print('successful login')
            if type(link) is str:
                logger.info('Success!')
                bgi = swap.get(time)
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



@app.route('/queue_return',methods=['POST'])
def queue_return():
    try:
        uname = request.form['username']
        passw = request.form['password']
        conn = db.login(uname,passw) #checking username and password
        if not conn == False:
            print('successful login')
            return '<h1>test</h1>' #returning data from the database table
        else: 
            print('unlogin')
            return 'Not'
    except Exception as e:
        return 'Not'

#Admin panel
@app.route('/admin')
def admin():
        logger.warning('Accessing /adming from - %s',request.remote_addr)
        return render_template('admin.html')

#Verifying credentials to return admin page functionality
@app.route('/verify_credentials',methods=['POST'])
def verf_cred():
        logger.warning('Second layer of ad_panel verification,from - %s',request.remote_addr)
        uname = request.form['username']
        passw = request.form['password']
        conn = db.login(uname,passw) #checking username and password
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


if __name__ == "__main__":
    global mt
    global db 
    global bgi 
    global ip 
    hostname = socket.gethostname()
    ipadd = socket.gethostbyname(hostname)#ip adress of localnet for testing
    logger.info('Current ip - %s',ipadd)
    mt = MTMode(False)
    ip = IPClass(str(ipadd))
    bgi = BGIMG('https://cdna.artstation.com/p/assets/images/images/004/720/972/large/randall-mackey-mural2.jpg?1485790389','https://livewire.thewire.in/wp-content/uploads/2022/02/DanyloHrechyshkinSovietwave-1024x650.jpeg','https://wallpapercave.com/wp/wp9186396.jpg')
    db = db_works.DBWorks() #Connecting to db
    db.create_tables_if_not_exist() #initialisation
    app.debug = True 
    app.run(host = '0.0.0.0',port=5000)

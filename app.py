from flask import Flask,render_template,jsonify,request
import requests
import db_works
import socket 
import datetime
from dataclasses import dataclass,replace
app = Flask(__name__)


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




@app.route('/get_songs_data',methods=['POST'])
def track_data():
    title = request.form['title']
    conn = db_works.DBWorks().check_song(title)
    print(conn)
    if not conn == False: 
        return jsonify({'love':conn[0]})
    else:
        return 'Not'
@app.route("/")
def home():
        name = "SovietWave Radio"
        if int(datetime.datetime.now().hour) >= 9 and int(datetime.datetime.now().hour) < 18: 
            background = bgi.morning_link 
        elif int(datetime.datetime.now().hour) >= 18 and int(datetime.datetime.now()) < 23:
            background = bgi.evening_link
        else:
            background = bgi.night_link
        print(background)
        if not mt.maintance:
            return render_template('helloworld.html', title='SovietWave Radio', username=name,stream_url=f'http://{ip.ip}:8000/stream',bg_img=background)
        else: 
            return render_template('maintance.html')
@app.route('/track_name')
def track_name():
        status_url = 'http://localhost:8000/status.xsl'
        response = requests.get(status_url) 
        html = response.text
        track_name = html.split('<td class="streamstats">')[5].split('</td>')[0]
        listeners = html.split('<td class="streamstats">')[3].split('</td>')[0]
        return jsonify({'track_name': track_name,'listeners' : listeners})

@app.route('/ad_panel')
def admin_panel():
        return render_template('ad_panel.html')

def auth_check(u,p):
    conn = db.login(u,p) 
    #return True if conn else False
    if conn:
        return True 
    else: 
        return False 


@app.route('/mt_mode',methods=['POST'])
def mt_mode():
        uname = request.form['username']
        passw = request.form['password']
        conn = auth_check(uname,passw) #checking username and password
        print('Attempt to enter maintance mode')
        if not conn == False:
            print('successful login')
            global mt
            if mt.maintance:
                mt = MTMode(False)
            else: 
                mt = MTMode(True)
            #bgi = BGIMG(str(link)) if type(link) is str else bgi
            return '.' #returning data from the database table
        else: 
            print('unlogin')
            return 'Not'



@app.route('/img_update',methods=['POST'])
def img_update():
        print(request.form)
        uname = request.form['username']
        passw = request.form['password']
        link = request.form['link']
        time = request.form['time']
        conn = db.login(uname,passw) #checking username and password
        global bgi
        swap = {'1':replace(bgi,morning_link=link),'2':replace(bgi,evening_link=link),'3':replace(bgi,morning_link=link)}
        print(bgi)
        print('Attempt to change image')
        if not conn == False:
            print('successful login')
            if type(link) is str:
                print('link is str')
                bgi = swap.get(time)
                print(bgi)
            else: 
                print('link is not str')
                pass 
            #bgi = BGIMG(str(link)) if type(link) is str else bgi
            return '.' #returning data from the database table
        else: 
            print('unlogin')
            return 'Not'


@app.route('/queue_return',methods=['POST'])
def queue_return():
        uname = request.form['username']
        passw = request.form['password']
        conn = db.login(uname,passw) #checking username and password
        if not conn == False:
            print('successful login')
            return '<h1>test</h1>' #returning data from the database table
        else: 
            print('unlogin')
            return 'Not'

@app.route('/admin')
def admin():
        return render_template('admin.html')

@app.route('/verify_credentials',methods=['POST'])
def verf_cred():
        uname = request.form['username']
        passw = request.form['password']
        conn = db.login(uname,passw) #checking username and password
        print(conn)
        if not conn == False:
            print('successful login')
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
            print('unlogin')
            return 'Not'


if __name__ == "__main__":
    global mt
    global db 
    global bgi 
    global ip 
    hostname = socket.gethostname()
    ipadd = socket.gethostbyname(hostname)#ip adress of localnet for testing
    mt = MTMode(False)
    ip = IPClass(str(ipadd))
    bgi = BGIMG('https://cdna.artstation.com/p/assets/images/images/004/720/972/large/randall-mackey-mural2.jpg?1485790389','https://livewire.thewire.in/wp-content/uploads/2022/02/DanyloHrechyshkinSovietwave-1024x650.jpeg','https://wallpapercave.com/wp/wp9186396.jpg')
    db = db_works.DBWorks() #Connecting to db
    app.debug = True 
    app.run(host = '0.0.0.0',port=5000)
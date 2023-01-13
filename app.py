from flask import Flask,render_template,jsonify,request
import requests
import db_works
from dataclasses import dataclass
app = Flask(__name__)

@dataclass
class BGIMG:   #bg image 
    link : str


@app.route("/")
def home():
        name = "test"
        return render_template('helloworld.html', title='SovietWave Radio', username=name,stream_url='http://localhost:8000/stream',bg_img=bgi.link)

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

@app.route('/img_update',methods=['POST'])
def img_update():
        uname = request.form['username']
        passw = request.form['password']
        link = request.form['link']
        conn = db.login(uname,passw) #checking username and password
        print('Attempt to change image')
        if not conn == False:
            print('successful login')
            global bgi 
            if type(link) is str:
                print('link is str')
                bgi = BGIMG(link)
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
            return jsonify({'username': request.form['username'],'id':conn[1],'password':request.form['password']}) #jsonify username and id to send back to ad_panel page
        else: 
            print('unlogin')
            return 'Not'


if __name__ == "__main__":
    global db 
    global bgi 
    bgi = BGIMG('https://wallpapercave.com/wp/wp9186396.jpg')
    db = db_works.DBWorks() #Connecting to db
    app.debug = True 
    app.run(host = '0.0.0.0',port=5000)
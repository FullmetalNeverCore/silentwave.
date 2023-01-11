from flask import Flask,render_template,jsonify,request
import requests
import db_works
app = Flask(__name__)

@app.route("/")
def home():
    name = "test"
    return render_template('helloworld.html', title='SovietWave Radio', username=name,stream_url='http://localhost:8000/stream')

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


@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/verify_credentials',methods=['POST'])
def verf_cred():
    uname = request.form['username']
    passw = request.form['password']
    db = db_works.DBWorks() #Connecting to db
    conn = db.login(uname,passw) #checking username and password
    print(conn)
    if not conn == False:
        print('successful login')
        return jsonify({'username': request.form['username'],'id':conn[1],'password':request.form['password']}) #jsonify username and id to send back to ad_panel page
    else: 
        print('unlogin')
        return 'Not'


if __name__ == "__main__":
    app.debug = True 
    app.run(host = '0.0.0.0',port=5000)
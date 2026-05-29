from flask import jsonify
import requests
from datetime import datetime
import conf
from flask import Blueprint, request, jsonify

tn_bp = Blueprint('track_name',__name__)





#Get current song data
@tn_bp.route('')
def track_name():
    status_url = f'{conf.host}/status.xsl'
    
    try:
        response = requests.get(status_url)
        response.raise_for_status()
        html = response.text
        
        track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
        listeners = html.split('<td class="streamstats">')[3].split('</td>')[0]
        
        return jsonify({'track_name': track_name, 'listeners': listeners})
    
    except requests.RequestException as e:
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
    
    except IndexError as e:
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
    
    except Exception as e:
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
from flask import jsonify
import requests
from flask_apscheduler import APScheduler
import logging 
from datetime import datetime
import conf
from flask import Blueprint, request, jsonify

tn_bp = Blueprint('track_name',__name__)


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


#Get current song data
@tn_bp.route('')
def track_name():
    logger.warning('Trying to get /track_name')
    status_url = f'{conf.host}/status.xsl'
    
    try:
        response = requests.get(status_url)
        response.raise_for_status()
        html = response.text
        
        track_name = html.split('<td class="streamstats">')[7].split('</td>')[0]
        listeners = html.split('<td class="streamstats">')[3].split('</td>')[0]
        
        logger.info('Return of track name is successful.')
        return jsonify({'track_name': track_name, 'listeners': listeners})
    
    except requests.RequestException as e:
        logger.error(f'HTTP error occurred: {e}')
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
    
    except IndexError as e:
        logger.error(f'Parsing error occurred: {e}')
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
    
    except Exception as e:
        logger.error(f'An unexpected error occurred: {e}')
        return jsonify({'track_name': 'null', 'listeners': 0}), 500
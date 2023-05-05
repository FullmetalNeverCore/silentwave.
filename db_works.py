import subprocess
import sys
try:
    import mariadb
except Exception as e:
    subprocess.check_call([sys.executable, "-m", "pip", "install", 'mariadb'])
import sys
import hashlib
import logging 
from abc import ABC, abstractmethod

logging.basicConfig(filename='app.log', level=logging.DEBUG)


db_logger = logging.getLogger('db')

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

#The Database

class DatabaseFactory(ABC):
    @abstractmethod
    def made_instance(self):
        pass


class DBinterface(ABC):

    #Class constructor that creating mariadb cursor
    def __init__(self):
        # Connect to MariaDB Platform
        self.conn = DBFactory().made_instantce()
    
    @abstractmethod
    def create_tables_if_not_exist(self):
        raise NotImplementedError

    @abstractmethod
    def login(self):
        raise NotImplementedError

    @abstractmethod
    def check_song(self):
        raise NotImplementedError
    
    @abstractmethod
    def add_love(self):
        raise NotImplementedError

class DBFactory(DatabaseFactory):
    def made_instantce(self):
        db_logger.warning('Connecting to MariaDB Platform')
        try:
            self.conn = mariadb.connect(
                user="root",
                password="root",
                host="127.0.0.1",
                port=3306,
                database="soviet"

            )
            db_logger.info('MariaDB - Success')
            # Get Cursor
            self.cur = self.conn.cursor()
            return self.conn
        except mariadb.Error as e:
            db_logger.error(f"MariaDB -Error connecting to MariaDB Platform: {e}")  
            return None

class DBWorks(DBinterface):

    def create_tables_if_not_exist(self):
        # Connect to MariaDB Platform
        db_logger.info('Checking if tables exist inside the db')
        try:
            # Get Cursor
            
            # Create tables if they do not exist
            self.cur.execute('''CREATE TABLE IF NOT EXISTS admin_site (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user VARCHAR(255),
                        password VARCHAR(255))''')
            
            self.cur.execute('''CREATE TABLE IF NOT EXISTS songs_table (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255),
                        love INT)''')

            db_logger.info('MariaDB - Tables created successfully!')
        except mariadb.Error as e:
            db_logger.error(f"MariaDB -Error connecting to MariaDB Platform: {e}")

    #login into db
    def login(self,l,p): #params - login, password 
        db_logger.info('Logging in into db')
        try: 
            #print(l,p)
            self.cur.execute(f"SELECT user,id FROM admin_site WHERE user='{l}' AND password='{p}'" )
            db_logger.info("MariaDB - Successfully read account!")
            dataArray = []
            for (user,id) in self.cur:
                for x in (user,id):
                    dataArray.append(x)
            #return dataArray if not len(dataArray) == 0 else False
            if len(dataArray) == 0:
                return False 
            else: 
                return dataArray
        except mariadb.Error as e: 
            db_logger.error(f"MariaDB - Error : {e}")
            return False

    #Get the song title and like number,or write new song title into db
    def check_song(self,title):
        db_logger.info('Check data for song %s',title)
        db_logger.info(f'check song - {title}')
        try:
                self.cur.execute(f"SELECT love FROM soviet.songs_table WHERE title='{title}'")
                dataArray = []
                for (love) in self.cur:
                    for x in (love):
                        db_logger.info(f'in Love {x}')
                        dataArray.append(x)
                #return dataArray if not len(dataArray) == 0 else False
                if len(dataArray) == 0:
                    self.cur.execute(f"INSERT INTO soviet.songs_table (title,love) VALUES ('{title}',0)")
                    db_logger.info('MariaDB - Insertion of data complete!')
                    self.conn.commit()
                    self.check_song(title)
                else: 
                    return dataArray
        except mariadb.Error as e:
            db_logger.error(f"MariaDB - Error : {e}")
            return False 
    
    #add love to chosen song 
    def add_love(self,title):
        db_logger.info('Adding love to song %s',title)
        try:
            db_logger.info('Adding love')
            self.cur.execute(f"UPDATE soviet.songs_table SET love = love + 1 WHERE title='{title}'")
            self.conn.commit()
            return [True]
        except mariadb.Error as e:
            db_logger.error(f"MariaDB - Error : {e}")
            return False 
        
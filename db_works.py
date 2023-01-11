import mariadb
import sys
import hashlib



class DBWorks:

    def __init__(self):
        # Connect to MariaDB Platform
        try:
            conn = mariadb.connect(
                user="root",
                password="root",
                host="127.0.0.1",
                port=3306,
                database="soviet"

            )
            print('MariaDB - Success')
            # Get Cursor
            self.cur = conn.cursor()
        except mariadb.Error as e:
            print(f"MariaDB -Error connecting to MariaDB Platform: {e}")

    
    def login(self,l,p): #params - login, password 
        try: 
            print(l,p)
            self.cur.execute(f"SELECT user,id FROM admin_site WHERE user='{l}' AND password='{p}'" )
            print("MariaDB - Successfully read account!")
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
            print(f"MariaDB - Error : {e}")
            return False
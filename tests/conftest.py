import pytest 
import socket 



@pytest.fixture
def get_ip():
    hostname = socket.gethostname()
    ipadd = socket.gethostbyname(hostname)#ip adress of localnet for testing 
    print(f'Current IP address - {ipadd}')
    return ipadd
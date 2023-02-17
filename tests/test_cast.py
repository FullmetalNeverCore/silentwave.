import pytest 
import requests


class Test_cast:

    @pytest.fixture(autouse=True)
    def _getting_ip(self,get_ip):
        self.ip = get_ip

    def test_ice(self):
            request = requests.get(f'http://{self.ip}:8000/stream')
            assert request.status_code == 200,print('NoStream - 404 :: Likely Icecast is working but there is no music translation on /stream')

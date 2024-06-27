FROM balenalib/raspberry-pi-python:3.8

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip3 install -v --no-cache-dir -r requirements.txt

COPY . .
CMD ["python3", "app.py"]

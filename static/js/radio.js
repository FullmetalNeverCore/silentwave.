function vol(){
  var audio = document.querySelector('audio'); 
  var volumeControl = document.querySelector('#volume-control');

  volumeControl.addEventListener('input', function() {
    audio.volume = this.value;
  });
}


function radio(){
    var audio = document.querySelector('audio'); 
    var button = document.getElementById('audio-button'); 

    button.addEventListener('click', function(){ 
      if (audio.paused) { 
        audio.play(); 
        button.src = "static/pause.png"; 
      } else {   
        audio.pause();  
        button.src = "static/play.png";          
      }
    }); 
}

function addLove(title){
  return $.ajax({
    type: "POST",
    url: '/add_song_love',
    data: {title: title},
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}


function getSongData(title){
  return $.ajax({
    type: "GET",
    url: '/get_songs_data',
    data: {title: title},
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}


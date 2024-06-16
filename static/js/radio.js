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
    var soundEffect = new Audio('static/audio/interaction.mp3');
    button.addEventListener('click', function(){ 
      soundEffect.play();
      if (audio.paused) { 
        audio.play(); 
        button.src = "static/pause.png"; 
      } else {   
        audio.pause();  
        button.src = "static/play.png";          
      }
    }); 

}

function addLove(type,title){
  return $.ajax({
    type: "POST",
    contentType: 'application/json',
    url: '/get_songs_data',
    data: JSON.stringify({"type":type,"title": title})
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}


function getSongData(type,title){
  return $.ajax({
    type: "POST",
    url: '/get_songs_data',
    contentType: 'application/json',
    data: JSON.stringify({"type":type,"title": title}),
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}


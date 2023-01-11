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


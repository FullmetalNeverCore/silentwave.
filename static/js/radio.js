
function radio()
{
    var audio = document.querySelector('audio'); 
    audio.volume = 0.6; //initial loudness
    var button = document.getElementById('audio-button'); 
      //press effect
      var pressEffect = new Audio('static/audio/interaction.mp3');
      //vhs noise effect
      var soundEffect = new Audio('static/audio/vhs.mp3');
      soundEffect.loop = true;
      soundEffect.volume = 0.45;
      //silent hill's press effect
      pressEffect.play(); 
      //check if vhs static sound is already playing,to prevent stacking
      if (soundEffect.paused) {
        soundEffect.play();
      } else {
          soundEffect.pause();
      }
      if (audio.paused) { 
        button.src = "static/pause.png"; 
        soundEffect.play();
        audio.play(); 
      
      } else {   
        button.src = "static/play.png";
        audio.pause();  
        soundEffect.pause();       
      }
}

function addLove(type,title)
{
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


function getSongData(type,title)
{
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


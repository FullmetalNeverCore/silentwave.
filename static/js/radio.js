
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
      pressEffect.play(); 
      //silent hill's press effect
      if (audio.paused) { 
        audio.play(); 
        soundEffect.play();
        button.src = "static/pause.png"; 
      } else {   
        audio.pause();  
        button.src = "static/play.png";          
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


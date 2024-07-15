function radio() {
    const audio = document.querySelector('audio');
    const button = document.getElementById('audio-button');
    const pressEffect = new Audio('static/audio/interaction.mp3');
    const soundEffect = new Audio('static/audio/vhs.mp3');

    audio.volume = 0.6; // initial loudness
    soundEffect.loop = true;
    soundEffect.volume = 0.45;

    pressEffect.play(); // silent hill's press effect

    // Check if vhs static sound is already playing, to prevent stacking
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


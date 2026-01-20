function radio() {
    const audio = document.getElementById('main-audio') || document.querySelector('audio');
    const button = document.getElementById('audio-button');
    // const pressEffect = new Audio('static/audio/interaction.mp3');
    const soundEffect = new Audio('static/audio/vhs.mp3');

    audio.volume = 0.6; // initial loudness
    soundEffect.loop = true;
    soundEffect.volume = 0.35;

    // pressEffect.play(); // silent hill's press effect

    if (soundEffect.paused) {
        soundEffect.play();
    } else {
        soundEffect.pause();
    }

    if (audio.paused) {
        const currentSrc = audio.querySelector('source').src.split('?')[0];
        audio.src = currentSrc + "?t=" + new Date().getTime();
        audio.load();

        button.src = "/static/pause.png";
        soundEffect.play();
        audio.play();
    } else {
        button.src = "/static/play.png";
        audio.pause();
        audio.src = "";
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

window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            radio();
        }
    }
});


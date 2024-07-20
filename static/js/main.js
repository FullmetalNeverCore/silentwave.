console.log("Welcome to silentwave.");
var audio = document.querySelector('audio'); 
var volumeControl = document.querySelector('#volume-control');
var showWindowBtn = document.getElementById('showWindowBtn');

showWindowBtn.addEventListener('click', function() {
  $('#slideout').toggleClass('on');
});
document.addEventListener('mousemove', function(event) {
    const screenHeight = window.innerHeight;
    const mouseY = event.clientY;

    if (mouseY >= screenHeight - 100) { 
        document.body.classList.add('footer-visible');
    } else {
        document.body.classList.remove('footer-visible');
    }
});
volumeControl.addEventListener('input', function() {
  audio.volume = this.value;
});

function updateTrackName() {
  $.get('/track_name', function(data) {
    $('#track-name').html(data.track_name);
    $('#listeners').html(data.listeners);
  });
}

setInterval(updateTrackName, 5000);

let prevTracks;

function updateLatestTracks() {
  $.get('/previous', function(data) {
    var list = $('.list'); 
    list.empty();
    if(Object.entries(data.tracks).reverse() != prevTracks)
    {
      console.log("New entry.")
      prevTracks = Object.entries(data.tracks).reverse();
      prevTracks.forEach(function([time, track_name]) {
      var li = $('<li style="margin:5px;margin-left:30px;text-size:5px;"></li>').html(time + ": " + track_name);
      list.append(li);
    });
    };
  });
}

setInterval(updateLatestTracks,10000);
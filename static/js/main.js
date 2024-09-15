console.log("Welcome to silentwave.");
var audio = document.querySelector('audio'); 
var volumeControl = document.querySelector('#volume-control');
var showWindowBtn = document.getElementById('showWindowBtn');
var slideout = document.getElementById('slideout');


/* COUNTER */
function pad(val) {
  var valString = val + "";
  if (valString.length < 2) {
    return "0" + valString;
  } else {
    return valString;
  }
}

var totalSeconds = 0;

setInterval(setTime, 1000);

function setTime() {
  ++totalSeconds;
  document.getElementById("seconds").innerHTML = pad(totalSeconds % 60);
  document.getElementById("minutes").innerHTML = pad(parseInt(totalSeconds / 60));
}

    /* TIME IN FORMAT HH:MM:SS */
function checkTime(i) {
      if (i < 10) {
          i = "0" + i;
      }
      return i;
      }
  
setInterval(getCurrentFormattedDate, 1000);

function getCurrentFormattedDate() {
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          const date = new Date(); 
          const year = 2001; 
          const formattedDate = date.toLocaleDateString('en-US', options);
          var formattedDateOrigin = formattedDate.replace(/(\w+)\s(\d+),\s(\d+)/, `$1. $2. ${year}`).replace(/January|February|March|April|May|June|July|August|September|October|November|December/g, (match) => match.slice(0, 3).toUpperCase());
          document.getElementById('vhs').innerHTML = formattedDateOrigin;
      }

function getTime() {
          var today = new Date();
          var h = today.getHours();
          var m = today.getMinutes();
          var s = today.getSeconds();
          // add a zero in front of numbers < 10
          m = checkTime(m);
          s = checkTime(s);
          if (h > 12) {
            document.getElementById('time').innerHTML = "PM " + h + ":" + m;
          } else {
            document.getElementById('time').innerHTML = "AM " + h + ":" + m;
          }
          t = setTimeout(function() {
              getTime()
          }, 500);
      }

showWindowBtn.addEventListener('click', function(event) {
    slideout.classList.toggle('on');
    event.stopPropagation(); // Prevent the click event from bubbling up to the document
  });

document.addEventListener('click', function(event) {
    if (!slideout.contains(event.target) && !showWindowBtn.contains(event.target)) {
      slideout.classList.remove('on');
    }
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

setInterval(updateLatestTracks,6000);


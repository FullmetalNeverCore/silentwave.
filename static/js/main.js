console.log("Welcome to silentwave.");
var audio = document.querySelector('audio'); 
var volumeControl = document.querySelector('#volume-control');
var showWindowBtn = document.getElementById('showWindowBtn');
var slideout = document.getElementById('slideout');
var lastTrack = '';


/* COUNTER REMOVED */

    /* TIME IN FORMAT HH:MM:SS */
function checkTime(i) {
      if (i < 10) {
          i = "0" + i;
      }
      return i;
      }
  
document.addEventListener('DOMContentLoaded', function() {
        setInterval(getCurrentFormattedDate, 1000);
});

function getCurrentFormattedDate() {
          const yearVal = document.getElementById('yearValue').value;
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          const date = new Date(); 
          const formattedDate = date.toLocaleDateString('en-US', options);
          var formattedDateOrigin = formattedDate.replace(/(\w+)\s(\d+),\s(\d+)/, `$1. $2. `).replace(/January|February|March|April|May|June|July|August|September|October|November|December/g, (match) => match.slice(0, 3).toUpperCase());
          document.getElementById('vhs').innerHTML = formattedDateOrigin + yearVal;
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
    var newTrack = data.track_name;
    var previousTrack = lastTrack;
    // update DOM
    $('#track-name').html(newTrack);
    $('#listeners').html(data.listeners);
    $('#viewers-count').html(data.listeners);
    // update document title only when track changes
    if (previousTrack && previousTrack !== newTrack) {
      var parts = newTrack.split('-');
      if (parts.length >= 2) {
        console.log("Updating title with trimmed song title");
        document.title = "silentwave. : " + parts[1].trim();
      } else {
        console.log("Keeping title silentwave.");
        document.title = "silentwave.";
      }
    }
    // if actual track changed, flash static then load new background
    if (previousTrack && previousTrack !== newTrack) {
      var body = $('body');
      var staticBgUrl = '/static/pictures/tv.gif';
      
      // Only update body background if NOT in 3D mode
      if (document.getElementById('three-container') === null) {
        body.css('background-image', 'url(' + staticBgUrl + ')');
      }

      if (typeof screenEffect !== 'undefined' && screenEffect.effects) {
        screenEffect.remove('video');
        screenEffect.remove('image');
        screenEffect.add('image', { src: staticBgUrl, blur: 1.2 });
      }
      setTimeout(function() {
        $.get('/random_bg', function(resp) {
          var newBg = resp.bg_img;
          
          if (document.getElementById('three-container') === null) {
            body.css('background-image', 'url("' + newBg + '")');
          }

          if (typeof screenEffect !== 'undefined' && screenEffect.effects && (screenEffect.effects.image || screenEffect.effects.video)) {
            screenEffect.remove('video');
            screenEffect.remove('image');
            screenEffect.add('image', { src: newBg, blur: 1.2 });
          }
        });
      }, 2000);
    }
    // remember for next poll
    lastTrack = newTrack;
  });
}

setInterval(updateTrackName, 5000);

let prevTracks;

function updateLatestTracks() {
  $.get('/previous', function(data) {
    var list = $('.list'); 
    list.empty();
    
    // Also update CRT menu if it exists (for 3D mode)
    const crtList = document.getElementById('crt-track-list');
    if (crtList) crtList.innerHTML = '';

    if(Object.entries(data.tracks).reverse() != prevTracks)
    {
      console.log("New entry.")
      prevTracks = Object.entries(data.tracks).reverse();
      prevTracks.forEach(function([time, track_name]) {
        var li = $('<li style="margin:5px;margin-left:30px;text-size:5px;"></li>').html(time + ": " + track_name);
        list.append(li);
        
        if (crtList) {
          const crtLi = document.createElement('li');
          crtLi.className = 'crt-item';
          crtLi.innerHTML = `<span class="crt-time">${time}</span><span class="crt-track">${track_name}</span>`;
          crtList.appendChild(crtLi);
        }
      });
    };
  });
}

setInterval(updateLatestTracks,6000);


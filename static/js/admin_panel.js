function verifyAccount(username, password) {
    return $.ajax({
      type: "POST",
      contentType: 'application/json',
      url: '/verify_credentials',
      data: JSON.stringify({username: username, password: password})
    }).then(function(response) {
      if(response !== "Not"){
        return {status: true, value: response};
      }
      else{
        return {status: false, value: response};
      }
    }).catch(function(error) {
      return {status: false, error: error.status + ": " + error.statusText};
    });
  }

function MTMode(username,password){
  return $.ajax({
    type: "POST",
    url: '/mt_mode',
    contentType: 'application/json',
    data: JSON.stringify({username: username, password: password})
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });  
}


function getEndP(username, password){
  return $.ajax({
    type: "GET",
    url: '/endp',
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}

function getQueue(username, password){
  return $.ajax({
    type: "POST",
    contentType: 'application/json',
    url: '/queue_return',
    data: JSON.stringify({username: username, password: password})
  }).then(function(response){
    return {status: true, value: response};
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  });
}

function updateIMG(username,password,link,time){
  console.log('UPDATING IMG')
  return $.ajax({
    type: "POST",
    contentType: 'application/json',
    url: '/img_update',
    data: JSON.stringify({username: username, password: password, link: link,time: time})
  }).then(function(response){
    if(response !== "Not"){
      return {status: true, value: response};
    }
    else{
      return {status: false, value: response};
    }
  }).catch(function(error) {
    return {status: false, error: error.status + ": " + error.statusText};
  }); 
}
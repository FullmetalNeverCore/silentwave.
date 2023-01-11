function verifyAccount(username, password) {
    return $.ajax({
      type: "POST",
      url: '/verify_credentials',
      data: {username: username, password: password}
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
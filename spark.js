/*
Name:          spark.js
Description:   Read and control Spark Cores with node.js
Author:        Franklin van de Meent (https://frankl.in)
Feedback:      https://github.com/fvdm/nodejs-spark/issues
Source:        https://github.com/fvdm/nodejs-spark
Service:       Spark (https://www.spark.io)
License:       Unlicense (Public Domain)
               https://github.com/fvdm/nodejs-spark/blob/master/LICENSE
*/

var http = require ('httpreq');

// Default settings
var app = {
  timeout: 10000
};

// Security details must not be public
var auth = {
  username: null,
  password: null,
  access_token: null,
  access_token_expires: null
};

// List devices
app.devices = function (cb) {
  talk ({ path: 'devices', callback: cb });
};

// One device
app.device = function (device) {
  return {
    info: function (cb) {
      talk ({ path: 'devices/'+ device, callback: cb });
    },

    variable: function (variable, cb) {
      talk ({ path: 'devices/'+ device +'/'+ variable, callback: cb });
    },

    func: function (func, arg, cb) {
      var vars = null;
      if (typeof arg === 'function') {
        cb = arg;
      } else if (typeof arg === 'string' || typeof arg === 'numeric') {
        vars = {args: arg};
      }

      talk ({
        method: 'POST',
        path: 'devices/'+ device +'/'+ func,
        query: vars,
        callback: cb
      });
    }
  };
};

// List or generate access_token
app.accessToken = {};

app.accessToken.list = function (callback) {
  talk ({
    path: 'access_token',
    auth: true,
    callback: callback
  });
};

app.accessToken.generate = function (cb) {
  if (auth.username && auth.password) {
    var vars = {
      grant_type: 'password',
      username: auth.username,
      password: auth.password
    };
    talk ({
      method: 'POST',
      path: 'oauth/token',
      body: vars,
      auth: true,
      callback: cb
    });
  } else {
    cb (new Error ('no credentials'));
  }
};

app.accessToken.delete = function (token, cb) {
  talk ({
    method: 'DELETE',
    path: 'access_tokens/'+ token,
    auth: true,
    callback: cb
  });
};

// Communicate
// method      GET POST PUT DELETE    GET
// path        method path            /
// query       query fields           {}
// body        body fields or data
// callback    function( err, data )
// auth        use {username: 'john', password: 'doe'}
// contentType change Content-Type    !GET: application/x-www-form-urlencoded
// userAgent   change User-Agent
// headers     custom headers         {}
// timeout     override timeout ms    10000

function talk (props) {
  // process response
  function doResponse (err, res) {
    var data = null;
    var error = null;

    if (err) {
      error = new Error ('request failed');
      error.error = err;
    }

    if (!err) {
      try {
        data = JSON.parse (res.body);
      }
      catch (e) {
        error = new Error ('invalid response');
        error.error = e;
      }
  
      if (res.statusCode !== 200 && data && data.code) {
        error = new Error ('api error');
        error.code = data.code;
        error.error = data.error;
        error.error_description = data.error_description;
      }
    }

    if (typeof props.callback === 'function') {
      props.callback (error, data);
    }
  }

  // build request
  var url = 'https://api.particle.io/v1/'+ props.path;
  var options = {
    parameters: props.query || {},
    body: props.body || null,
    headers: {
      'User-Agent': props.userAgent || 'spark.js (https://github.com/fvdm/nodejs-spark)'
    },
    timeout: props.timeout || app.timeout
  };

  // http basic auth
  if (props.auth && (!auth.username || !auth.password)) {
    doCallback (new Error ('no credentials'));
    return;
  } else if (props.auth) {
    options.auth = auth.username +':'+ auth.password;
  } else {
    options.headers.Authorization = 'Bearer '+ auth.access_token;
  }

  // override headers
  if (typeof props.headers === 'object' && Object.keys (props.headers) .length >= 1) {
    for (var key in props.headers) {
      options.headers [key] = props.headers [key];
    }
  }

  // run
  switch (props.method) {
    case 'POST': http.post (url, options, doResponse); break;
    case 'PUT': http.put (url, options, doResponse); break;
    case 'DELETE': http.delete (url, options, doResponse); break;
    case 'GET':
    default: http.get (url, options, doResponse); break;
  }
}

// export
// either ( 'access_token_string', [1000] )
// or ( {username: 'john', password: 'doe'}, [1000] )
module.exports = function (access_token, timeout) {
  if (typeof access_token === 'object') {
    auth.username = access_token.username;
    auth.password = access_token.password;

    app.accessToken.generate (function (err, token) {
      if (!err) {
        auth.access_token = token.access_token;
        auth.access_token_expires = token.expires_in;
      }
    });
  } else {
    auth.access_token = access_token;
  }

  app.timeout = timeout || app.timeout;
  return app;
};

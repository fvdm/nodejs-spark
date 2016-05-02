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
var EventSource = require ('eventsource');

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

// process response
function doResponse (err, res, props) {
  var data = null;
  var error = null;

  if (err) {
    error = new Error ('request failed');
    error.error = err;
  }

  if (!err) {
    try {
      data = JSON.parse (res.body);
    } catch (e) {
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


/**
 * Communicate
 *
 * @param props {object}
 * @param [props.method = GET] {string} - HTTP method
 * @param [props.path = /] {string} - Request path
 * @param [props.query] {object}
 * @param [props.body] {mixed}
 * @param [props.callback] {function}
 * @param [props.auth] {object}
 * @param [props.contentType] {string}
 * @param [props.userAgent] {string}
 * @param [props.headers] {object}
 * @param [props.timeout] = 10000] {number}
 * @returns {void}
 */

function talk (props) {
  var key;
  var options = {
    url: 'https://api.particle.io/v1/' + props.path,
    method: props.method || 'GET',
    parameters: props.query || {},
    body: props.body || null,
    headers: {
      'User-Agent': props.userAgent || 'spark.js (https://github.com/fvdm/nodejs-spark)'
    },
    timeout: props.timeout || app.timeout
  };

  // http basic auth
  if (props.callback && props.auth && (!auth.username || !auth.password)) {
    props.callback (new Error ('no credentials'));
    return;
  }

  if (props.auth) {
    options.auth = auth.username + ':' + auth.password;
  } else {
    options.headers.Authorization = 'Bearer ' + auth.access_token;
  }

  // override headers
  if (typeof props.headers === 'object' && Object.keys (props.headers) .length >= 1) {
    for (key in props.headers) {
      options.headers [key] = props.headers [key];
    }
  }

  // run
  http.doRequest (options, function (err, res) {
    doResponse (err, res, props);
  });
}


/**
 * Fix events
 * it is impossible to overwrite ev.data without the for..loop
 *
 * @param ev {object} - Event object
 * @returns {object}
 */

function fixEvent (ev) {
  var ev2 = {};
  var key;

  for (key in ev) {
    ev2 [key] = ev [key];
  }

  try {
    ev2.data = JSON.parse (ev2.data);
  } catch (e) {
    // skip
  }

  try {
    ev2.data.data = JSON.parse (ev2.data.data);
  } catch (e) {
    // skip
  }

  return ev2;
}

// List devices
app.devices = function (cb) {
  talk ({
    path: 'devices',
    callback: cb
  });
};

// One device
app.device = function (device) {
  return {
    info: function (cb) {
      talk ({
        path: 'devices/' + device,
        callback: cb
      });
    },

    variable: function (variable, cb) {
      talk ({
        path: 'devices/' + device + '/' + variable,
        callback: cb
      });
    },

    func: function (func, arg, cb) {
      var vars = null;

      if (typeof arg === 'function') {
        cb = arg;
      } else if (typeof arg === 'string' || typeof arg === 'number') {
        vars = {
          args: arg };
      }

      talk ({
        method: 'POST',
        path: 'devices/' + device + '/' + func,
        query: vars,
        callback: cb
      });
    },

    events: function (cbMessage, cbError, cbOpen) {
      var es = new EventSource (
        'https://api.particle.io/v1/devices/' + device + '/events',
        {
          headers: {
            Authorization: 'Bearer ' + auth.access_token
          }
        }
      );

      if (cbOpen) {
        es.onopen = cbOpen;
      }

      if (cbError) {
        es.onerror = cbError;
      }

      if (cbMessage) {
        es.onmessage = function (ev) {
          cbMessage (fixEvent (ev));
        };
      }
    }
  };
};

// Claim device
app.claimDevice = function (deviceId, cb) {
  talk ({
    method: 'POST',
    path: 'devices',
    query: {
      id: deviceId
    },
    callback: cb
  });
};

// Account events
app.events = function (cbMessage, cbError, cbOpen) {
  var es = new EventSource (
    'https://api.particle.io/v1/devices/events',
    {
      headers: {
        Authorization: 'Bearer ' + auth.access_token
      }
    }
  );

  if (cbOpen) {
    es.onopen = cbOpen;
  }

  if (cbError) {
    es.onerror = cbError;
  }

  if (cbMessage) {
    es.onmessage = function (ev) {
      cbMessage (fixEvent (ev));
    };
  }
};

// Publish event to all devices
app.publishEvent = function (name, data, priv, ttl, cb) {
  talk ({
    method: 'POST',
    path: 'devices/events',
    query: {
      name: name,
      data: data || '',
      private: priv ? 'true' : 'false',
      ttl: ttl || 60,
      callback: cb
    }
  });
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

    return;
  }

  cb (new Error ('no credentials'));
};

app.accessToken.delete = function (token, cb) {
  talk ({
    method: 'DELETE',
    path: 'access_tokens/' + token,
    auth: true,
    callback: cb
  });
};

// export
// either ( 'access_token_string', [1000] )
// or ( {username: 'john', password: 'doe'}, [1000] )
module.exports = function (access_token, timeout) {
  if (typeof accessToken === 'string') {
    auth.access_token = access_token;
    app.timeout = timeout || app.timeout;
    return app;
  }

  app.timeout = access_token.timeout || timeout || app.timeout;
  auth.username = access_token.username;
  auth.password = access_token.password;

  app.accessToken.generate (function (err, token) {
    if (!err) {
      auth.access_token = token.access_token;
      auth.access_token_expires = token.expires_in;
    }
  });

  return app;
};

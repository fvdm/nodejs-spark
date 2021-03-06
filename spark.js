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
var app = {};

// Default settings
var config = {
  timeout: 10000,
  username: null,
  password: null,
  access_token: null,
  access_token_expires: null
};

// process response
function doResponse (err, res, props) {
  var data = null;
  var error = null;

  var callback = props.callback || function () {};

  if (err) {
    error = new Error ('request failed');
    error.error = err;
    callback (error);
    return;
  }

  try {
    data = JSON.parse (res.body);
  } catch (e) {
    error = new Error ('invalid response');
    error.statusCode = res.statusCode;
    error.error = e;
    callback (error);
    return;
  }

  if (data.error) {
    error = new Error ('api error');
    error.statusCode = res.statusCode;
    error.code = data.code || null;
    error.error = data.error;
    error.error_description = data.error_description;
    callback (error);
    return;
  }

  callback (null, data);
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
 * @param [props.auth] {boolean}
 * @param [props.contentType] {string}
 * @param [props.headers] {object}
 * @param [props.timeout] = 10000] {number}
 * @returns {void}
 */

function talk (props) {
  var options = {
    url: 'https://api.particle.io/v1/' + props.path,
    method: props.method || 'GET',
    parameters: props.query,
    body: props.body,
    headers: props.headers || {},
    timeout: props.timeout || config.timeout
  };

  // http basic auth
  if (props.callback && props.auth && (!config.username || !config.password)) {
    props.callback (new Error ('no credentials'));
    return;
  }

  if (props.auth) {
    options.auth = config.username + ':' + config.password;
  } else {
    options.headers.Authorization = 'Bearer ' + config.access_token;
  }

  // override headers
  if (!options.headers ['User-Agent']) {
    options.headers ['User-Agent'] = 'spark.js (https://github.com/fvdm/nodejs-spark)';
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
            Authorization: 'Bearer ' + config.access_token
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
        Authorization: 'Bearer ' + config.access_token
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
  var vars;

  if (config.username && config.password) {
    vars = {
      grant_type: 'password',
      username: config.username,
      password: config.password
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
module.exports = function (conf, timeout) {
  if (typeof conf === 'string') {
    config.access_token = conf;
    config.timeout = timeout || config.timeout;
    return app;
  }

  config.timeout = conf.timeout || timeout || config.timeout;

  if (conf.access_token) {
    config.access_token = conf.access_token;
    return app;
  }

  config.username = conf.username || null;
  config.password = conf.password || null;

  app.accessToken.generate (function (err, token) {
    if (!err) {
      config.access_token = token.access_token;
      config.access_token_expires = token.expires_in;
    }
  });

  return app;
};

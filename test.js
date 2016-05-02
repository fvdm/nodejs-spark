var dotest = require ('dotest');
var app = require ('./');

var config = {
  timeout: process.env.testTimeout || null,
  access_token: process.env.testAccessToken || null,
  username: process.env.testUsername || null,
  password: process.env.testPassword || null
};

var spark = app && app (config);

var deviceId = process.env.testDeviceId || null;
var device = spark && spark.device (deviceId);

dotest.add ('Module', function (test) {
  test ()
    .isFunction ('fail', 'exports', app)
    .isObject ('fail', 'interface', spark)
    .isFunction ('fail', '.devices', spark && spark.devices)
    .isFunction ('fail', '.device', spark && spark.device)
    .isFunction ('fail', '.device.info', device && device.info)
    .isFunction ('fail', '.device.variable', device && device.variable)
    .isFunction ('fail', '.device.func', device && device.func)
    .isFunction ('fail', '.device.events', device && device.events)
    .isFunction ('fail', '.claimDevice', spark && spark.claimDevice)
    .isFunction ('fail', '.events', spark && spark.events)
    .isFunction ('fail', '.publishEvent', spark && spark.publishEvent)
    .isObject ('fail', '.accessToken', spark && spark.accessToken)
    .isFunction ('fail', '.accessToken.list', spark && spark.accessToken && spark.accessToken.list)
    .done ();
});


dotest.add ('Error: invalid_token', function (test) {
  var tmp = new app ('invalid_token', 10000);

  tmp.devices (function (err, data) {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err && err.message)
      .isExactly ('fail', 'err.error', err && err.error, 'invalid_token')
      .isString ('fail', 'err.error_description', err && err.error_description)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.run ();

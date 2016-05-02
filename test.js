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
  var accTkn = spark && spark.accessToken;

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
    .isObject ('fail', '.accessToken', accTkn)
    .isFunction ('fail', '.accessToken.list', accTkn && accTkn.list)
    .isFunction ('fail', '.accessToken.generate', accTkn && accTkn.generate)
    .isFunction ('fail', '.accessToken.delete', accTkn && accTkn.delete)
    .done ();
});


dotest.add ('Method .devices', function (test) {
  spark.devices (function (err, data) {
    test (err)
      .isArray ('fail', 'data', data)
      .isNotEmpty ('fail', 'data', data)
      .isObject ('fail', 'data[0]', data && data [0])
      .done ();
  });
});


dotest.add ('Error: invalid_token', function (test) {
  var tmp = new app ('invalid_token', 10000);

  tmp.devices (function (err, data) {
    test ()
      .isError ('fail', 'err', err)
      .isExactly ('fail', 'err.message', err && err.message, 'api error')
      .isExactly ('fail', 'err.error', err && err.error, 'invalid_token')
      .isString ('fail', 'err.error_description', err && err.error_description)
      .isUndefined ('fail', 'data', data)
      .done ();
  });
});


dotest.run ();

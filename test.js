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


dotest.run ();

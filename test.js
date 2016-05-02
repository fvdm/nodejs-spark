var dotest = require ('dotest');
var app = require ('./');

var config = {
  timeout: process.env.testTimeout || null,
  access_token: process.env.testAccessToken || null,
  username: process.env.testUsername || null,
  password: process.env.testPassword || null
};

var spark = app && app (config);


dotest.add ('Module', function (test) {
  test ()
    .isFunction ('fail', 'exports', app)
    .isObject ('fail', 'interface', spark)
    .done ();
});


dotest.run ();

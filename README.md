sparkcloud
==========

Read and control your Spark Core with node.js using the Particle Cloud API.

* [Particle](https://www.particle.io)
* [API documentation](http://docs.particle.io/photon/api/)
* [node.js](https://nodejs.org)


Installation
------------

Stable: `npm install sparkcloud`

Develop: `npm install fvdm/nodejs-spark#develop`


Configuration
-------------

When you load the module into your script you must provide
the `access_token` from your account settings.

```js
var spark = require ('sparkcloud') ('your_access_token');
```

Optionally you can override the default HTTP request timeout of
10 seconds, in milliseconds:

```js
// set timeout to 30 seconds
var spark = require ('sparkcloud') ('your_access_token', 30000);
```


Callback & errors
-----------------

The last parameter of each method must be the callback _function_.
This is the only way to receive results as the functions themselves
don't return anything.

```js
function myCallback (err, data) {
  if (!err) {
    console.log ('We got data: ', data);
  } else {
    console.log (err);
  }
}
```

The first parameter `err` is _null_ when all went fine, otherwise it
is an `instanceof Error`. Depending on the kind of error it may have
additional properties to further explain the problem.


### Errors

message         | description              | additional
:---------------|:-------------------------|:-------------
request failed  | The request had an error | `err.error`
api error       | API returned an error    | `err.code`, `err.error`, `err.error_description`


devices ( callback )
--------------------

List all cores linked to your account.

```js
spark.devices (console.log);
```

```js
[
  {
    id: '123456789',
    name: 'myCore',
    last_app: null,
    connected: true
  }
]
```


device ( deviceId )
-------------------

Get core specific methods.

```js
var core = spark.device ('123456789');
```

Returns device methods below, no callback.


### Connect multiple cores

```js
var coffee = spark.device ('12345');
var alarm = spark.device ('67890');

// Make delicious coffee and wake me up after 5 min
coffee.makeCoffee ();
alarm.wakeMeUp (5);
```


device.info ( callback )
------------------------

Get basic information about a core including its functions and variables.

```js
core.info (console.log);
```

```js
{
  id: 'abc123',
  name: 'Spark Core',
  connected: true,
  variables:
    {
      ledState: 'int32'
    },
  functions:
    [
      'led'
    ],
  cc3000_patch_version: '1.28',
  product_id: 0,
  last_heard: '2015-06-25T06:19:18.824Z'
}
```


device.variable ( varName, callback )
-------------------------------------

Read a variable from the core.

```js
core.variable ('ledState', console.log);
```

```js
{
  cmd: 'VarReturn',
  name: 'ledState',
  result: 0,
  coreInfo:
    {
      last_app: '',
      last_heard: '2015-06-25T06:17:48.022Z',
      connected: true,
      last_handshake_at: '2015-06-25T06:00:24.099Z',
      deviceID: 'abc123'
    }
}
```


device.func ( functionName, [param], callback )
-----------------------------------------------

Run a function on the core. Optionally include one parameter.

```js
core.func ('led', 'on', console.log);
```

```js
{
  id: 'abc123',
  last_app: '',
  connected: true,
  return_value: 0
}
```


Example
-------

If you send the following code to you Spark core,
the javascript example should work fine.


### Spark code

```arduino
int LED = D7;
int State = 0;

void setup() {
  pinMode (LED, OUTPUT);
  Spark.function ("led", switchLED);
  Spark.variable ("ledState", &State, INT);
}

int switchLED (String args) {
  if (args.length () >= 1) {
    State = args == "on" ? 0 : 1;
  }
  digitalWrite (LED, State == 1 ? LOW : HIGH);
  return State = State == 1 ? 0 : 1;
}
```


### Node javascript

```js
var spark = require ('sparkcloud') ('your_access_token');
var core = spark.device ('123456789');

// just switch on/off
core.func ('led', console.log);

// force on
core.func ('led', 'on', console.log);
```

Each time you run this script the **blue LED** next to the big RGB LED
should switch on or off.


Enjoy!


Unlicense
---------

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org>


Author
------

Franklin van de Meent
| [Website](https://frankl.in)
| [Github](https://github.com/fvdm)

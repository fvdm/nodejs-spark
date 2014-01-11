nodejs-spark
============

Read and control your Spark Core with node.js using the Spark Cloud API.


Beta software
-------------

The Spark Cloud platform is still a work-in-progress and so is this module for Node. Some things are not working smoothly yet.


Installation
------------

The version on npm is the most stable code:

```sh
npm install sparkcloud
```

The code on Github should work fine but can be unstable:

```sh
npm install git+https://github.com/fvdm/nodejs-spark
```


Initial setup
-------------

When you load the module into your script you must provide the `access_token` from your account settings.

```js
var spark = require('sparkcloud')('your_access_token')
```

Optionally you can override the default HTTP request timeout of 10 seconds, in milliseconds:

```js
// set timeout to 30 seconds
var spark = require('sparkcloud')('your_access_token', 30000)
```


Callback & errors
-----------------

The last parameter of each method must be the callback _function_. This is the only way to receive results as the functions themselves don't return anything.

```js
function myCallback( err, data ) {
  if( ! err ) {
    console.log( 'We got data: ', data )
  } else {
    console.log( err, err.stack )
  }
}
```

The first parameter `err` is `null` when all went fine, otherwise it is an `instanceof Error`. Depending on the kind of error it may have additional properties to further explain the problem. In case of an error `data` is usually `null`.


### Errors

```
request failed    The HTTPS request had an error, see err.error.
request timeout   The HTTPS request took too long.
request dropped   The remote host disconnected too early, no data processed.
api invalid       The API returned unreadable data.
api error         The API returned an error, see err.code, err.error and err.error_description.
action failed     A method specific error occured, it returned the code -1.
```


devices ( callback )
--------------------

List all cores linked to your account.

```js
spark.devices( console.log )
```

```js
[ { id: '123456789',
    name: 'myCore',
    last_app: null,
    connected: true } ]
```


device ( deviceId )
-------------------

Get core specific methods.

```js
var core = spark.device('123456789')
```

Returns device methods below, no callback.


device.info ( callback )
------------------------

Get basic information about a core including its functions and variables.

```js
core.info( console.log )
```

```js
{ id: '123456789',
  name: 'myCore',
  variables: { ledState: 'int32' },
  functions: [ 'led' ] }
```


device.variable ( varName, callback )
-------------------------------------

Read a variable from the core.

```js
core.variable( 'light', console.log )
```

```js
{ cmd: 'VarReturn',
  name: 'light',
  TEMPORARY_allTypes: 
   { string: '\u0000\u0000\u0001�',
     uint32: 478,
     number: 478,
     double: null,
     float: 6.6982066594726256e-43,
     raw: '\u0000\u0000\u0001�' },
  result: 478,
  coreInfo: 
   { last_app: '',
     last_heard: '2014-01-11T01:55:15.241Z',
     connected: true,
     deviceID: '123456789' } }
```


device.func ( functionName, [param], callback )
-----------------------------------------------

Run a function on the core. Optionally include one parameter.

```js
core.func( 'switchLight', '1', console.log )
```

```js
{ id: '123456789',
  name: 'myCore',
  last_app: null,
  connected: true,
  return_value: 1 }
```


Example
-------

If you send the following code to you Spark core, the javascript example should work fine.


### Spark code

```arduino
int LED = D7;
int State = 0;

void setup() {
    pinMode(LED, OUTPUT);
    Spark.function("led", switchLED);
    Spark.variable("ledState", &State, INT);
}

void loop() {}

int switchLED(String args) {
    digitalWrite(LED, State == 1 ? LOW : HIGH);
    return State = State == 1 ? 0 : 1;
}
```


### Node javascript

```js
var spark = require('sparkcloud')('your_access_token')
var core = spark.device('123456789')

core.func( 'led', console.log )
```

Each time you run this script the **blue LED** next to the big RGB LED should switch on or off.


Enjoy!


Unlicense (Public Domain)
-------------------------

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

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

var http = require('https').request
var querystring = require('querystring')

var app = {
	access_token: null,
	timeout: 10000
}

app.devices = function( callback ) {
	talk( 'GET', 'devices', {}, callback )
}

app.device = function( device ) {
	return {
		info: function( callback ) {
			talk( 'GET', 'devices/'+ device, {}, callback )
		},
		
		variable: function( variable, callback ) {
			talk( 'GET', 'devices/'+ device +'/'+ variable, {}, callback )
		},
		
		func: function( func, vars, callback ) {
			if( typeof vars === 'function' ) {
				var callback = vars
				var vars = {}
			}
			talk( 'POST', 'devices/'+ device +'/'+ func, vars, callback )
		}
	}
}

// Communicate
function talk( method, path, vars, callback ) {
	// prevent multiple callbacks
	var complete = false
	function doCallback( err, res ) {
		if( !complete ) {
			complete = true
			callback( err || null, res || null )
		}
	}
	
	// build request
	vars.access_token = app.access_token
	var query = querystring.stringify( vars )
	
	var options = {
		hostname: 'api.spark.io',
		path: '/v1/'+ path,
		method: method,
		headers: {
			'User-Agent': 'spark.js/0.2.0 (https://github.com/fvdm/nodejs-spark)'
		}
	}
	
	if( method === 'GET' ) {
		options.path += '?'+ query
	} else {
		options.headers['Content-Type'] = 'application/x-www-form-urlencoded'
		options.headers['Content-Length'] = query.length
	}
	
	var request = http( options )
	
	// set timeout
	request.on( 'socket', function( socket ) {
		socket.setTimeout( app.timeout )
		socket.on( 'timeout', function() {
			request.abort()
		})
	})
	
	// process response
	request.on( 'response', function( response ) {
		var data = ''
		
		response.on( 'data', function( ch ) {
			data += ch
		})
		
		// complete
		response.on( 'end', function() {
			data = data.trim()
			
			try {
				data = JSON.parse( data )
			} catch(e) {
				doCallback( new Error('api invalid') )
				return
			}
			
			if( response.statusCode !== 200 ) {
				var err = new Error('api error')
				err.code = data.code
				err.error = data.error
				err.error_description = data.error_description
				doCallback( err )
				return
			}
			
			if( data.return_value && data.return_value === -1 ) {
				doCallback( new Error('action failed'), data )
				return
			} else {
				doCallback( null, data )
			}
		})
		
		// dropped
		response.on( 'close', function() {
			doCallback( new Error('request dropped') )
		})
	})
	
	// fail
	request.on( 'error', function( error ) {
		if( error.code === 'ECONNRESET' ) {
			var err = new Error('request timeout')
		} else {
			var err = new Error('request failed')
		}
		err.error = error
		doCallback( err )
	})
	
	// do it all
	if( method === 'POST' ) {
		request.end( query )
	} else {
		request.end()
	}
}

// export
module.exports = function( setAccess_token, setTimeout ) {
	app.access_token = setAccess_token
	app.timeout = setTimeout || app.timeout
	return app
}

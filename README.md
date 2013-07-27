digger-supplychain
==================

The supply chain wrapper for digger.io transport layers

## example

```js

var SupplyChain = require('digger-supplychain');

// this is the adaptor function - it can plug into a XHR or socket if in the browser
// or a backend socket if on the server

var handle = function(req, reply){
	// pipe the request to a backend warehouse that will serve the request
	warehouse(req, reply);
}

// create the supplychain from the handler function
var supplychain = SupplyChain(handle);

// now we can 'connect' to different backend warehouses via their routes
var database_container = supplychain.connect('/db1');

// this means we can run contracts now

database_container('some.selector').ship(function(results){

	// results is a digger-container
	console.log('loaded ' + results.count() + ' results');
})

```

## licence
MIT
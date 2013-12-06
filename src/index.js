/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/*

	supply chain

  the link between a client side container and a back end digger.io database server

  the supplychain is a function that accepts a request object (a pure javascript obj)
  and returns a promise for it to be fulfilled

  you create a supplychain by passing the function that will actualy deal with the request

	
*/

var utils = require('digger-utils');
var Container = require('digger-container');
var Contract = require('./contract');
var EventEmitter = require('events').EventEmitter;

module.exports = SupplyChain;

/*

  create a new supply chain that will pipe a req and res object into the
  provided fn

  
*/

function SupplyChain(handler, container_factory){
  if(arguments.length<=1){
    container_factory = handler;
    handler = null;
  }
  this.create = container_factory || Container;

  if(handler){
    this.on('request', handler);
  }
}

utils.inherits(SupplyChain, EventEmitter);

/*

  the handler function accepts a pure JS req object to be sent to the server as HTTP or socket (but it's basically a HTTP)

  it returns a promise that will resolve once the callback based handle function passed in to the supplychain has returned
  
*/
SupplyChain.prototype.contract = function(req, container){

  var self = this;

  var contract = new Contract(req, container);

  contract.on('ship', function(callback){
    self.emit('request', {
      method:req.method,
      url:req.url,
      headers:req.headers,
      body:req.body
    }, callback);
  })

  return contract;
}

function processurl(url){
  if(!url || url.length<=0){
    url = '/';
  }
  if(url.charAt(0)!='/'){
    url = '/' + url;
  }
  return url;
}

/*

  return a container that uses this supplychain - this means contracts can be run via the container
  and they will travel down the supply chain

  if a diggerid is given then the returned container will not be a _supplychain - this means it's skeleton will
  be sent for selects

  otherwise we are assuming the connect is for a top level warehouse and the tag becomes _supplychain which
  is filtered out from the skeleton in contracts
  
*/
SupplyChain.prototype.connect = function(diggerwarehouse, diggerid){
  var self = this;
  if(!utils.isArray(diggerwarehouse)){
    if(!diggerid){
      diggerwarehouse = [diggerwarehouse];  
    }
  }
  else{
    diggerid = null;
  }

  var models = [];
  if(!utils.isArray(diggerwarehouse)){
    diggerwarehouse = processurl(diggerwarehouse);
    models = [{
      _digger:{
        tag:diggerid ? 'item' : '_supplychain',
        diggerwarehouse:diggerwarehouse,
        diggerid:diggerid
      }
    }]
  }
  else{
    models = diggerwarehouse.map(function(warehouseurl){
      warehouseurl = processurl(warehouseurl);
      return {
        _digger:{
          diggerwarehouse:warehouseurl,
          tag:'_supplychain'
        }
      }
    })
  }
  
  var container = this.create(models);
  container.supplychain = this;
  return container;
}

SupplyChain.prototype.contract_group = function(type, contracts){
  var raw = {
    method:'post',
    url:'/reception',
    headers:{
      'content-type':'digger/contract',
      'x-contract-type':type
    },
    body:contracts || []
  }

  // we use this to generate hooked up containers as results
  var stub = Container();
  stub.supplychain = this;

  return this.contract(raw, stub);
}

/*

  create a merge contract from an array of existing contracts
  
*/
SupplyChain.prototype.merge = function(contracts){
  return this.contract_group('merge', contracts);
}

/*

  create a pipe contract from an array of existing contracts
  
*/
SupplyChain.prototype.pipe = function(contracts){
  return this.contract_group('pipe', contracts);
}
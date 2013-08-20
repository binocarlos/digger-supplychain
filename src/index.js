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

var Container = require('digger-container');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utils = require('digger-utils');


module.exports = factory;

function factory(handle, use_container){

  var supplychain = new SupplyChain(handle, use_container);

  return supplychain;
}

/*

  create a new supply chain that will pipe a req and res object into the
  provided fn

  
*/

function SupplyChain(handle, use_container){

  // force the request into new references so we are not messing with client
  // data if this is an entirely local setup
  this.handle = handle;
  this.container = use_container || Container;
}


util.inherits(SupplyChain, EventEmitter);

/*

  the handler function accepts a pure JS req object to be sent to the server as HTTP or socket (but it's basically a HTTP)

  it returns a promise that will resolve once the callback based handle function passed in to the supplychain has returned
  
*/
SupplyChain.prototype.contract = function(req, container){

  var self = this;

  if(!req.headers){
    req.headers = {};
  }
  
  function trigger_request(callback){
    if(!self.handle || typeof(self.handle)!='function'){
      setTimeout(function(){
        loadresults.reject('There is no handle method attached to this supplychain')
      }, 0)
    }
    else{

      /*
      
        here we serialize the request because we are transporting it
        
      */
      self.handle({
        method:req.method,
        url:req.url,
        headers:req.headers,
        body:req.body
      }, function(error, result){

        if(error){
          callback(error);
          return;
        }
        else{
          if(!result){
            result = [];
          }
          if(!utils.isArray(result)){
            result = [result];
          }

          if(req.results_processor){
            result = req.results_processor(result);
          }

          callback(null, result);
        }
      })
    }
  }

  req.ship = function(fn){

    process.nextTick(function(){
      trigger_request(function(error, answer){
        if(error){
          if(req._fail){
            req._fail(error);  
          }
          else{
            console.log('a request has an error but the contract has no fail handler');
            console.dir(req.method + ' ' + req.url);
            console.log(error);
          }
        }
        else{
          fn(answer);
          if(req._after){
            req._after(answer);
          }
        }
      })
    })

    return this;
  }
  req.fail = function(fn){
    req._fail = fn;
    return this;
  }
  req.expect = function(type){
    if(type=='containers'){
      req.results_processor = function(results){
        return container.spawn(results);
      }
    }
    return this;
  }
  req.after = function(fn){
    req._after = fn;
    return this;
  }
  req.debug = function(){
    req.headers['x-debug'] = true;
    return this;
  }

  return req;

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
  var container = self.container(arguments.length>1 ? 'item' : '_supplychain');
  container.diggerwarehouse(diggerwarehouse || '/');
  if(arguments.length>1){
    container.diggerid(diggerid);
  }
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
  var stub = self.container();
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
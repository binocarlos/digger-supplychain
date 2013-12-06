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
var EventEmitter = require('events').EventEmitter;

module.exports = Contract;

function Contract(req, container){
  EventEmitter.call(this);
  if(!req.headers){
    req.headers = {};
  }

  this.req = req;
  this.container = container;
  this.processors = [];
}

utils.inherits(Contract, EventEmitter);

Contract.prototype.expect = function(type){
  var self = this;
  type = (type || '').toLowerCase();
  if(type.indexOf('container')==0){
    this.processors.push(function(results){
      results = results || [];
      if(!utils.isArray(results)){
        if(typeof(results)=='object'){
          results = [results];
        }
        else{
          results = [{
            data:results
          }]
        }
      }
      return self.container.spawn(results);
    })  
  }
  return this;
}

Contract.prototype.ship = function(fn, errorfn){
  var self = this;
  this.emit('ship', function(error, results){
    if(error){
      errorfn && errorfn(error);
      self.emit('error', error);
      return;
    }
    self.processors.forEach(function(processor){
      results = processor(results);
    })
    self.emit('results', results);
    fn && fn(results);
  });
  return this;
}
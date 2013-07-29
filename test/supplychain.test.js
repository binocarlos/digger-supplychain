var Container = require('digger-container');
var Contracts = require('digger-contracts');
var SupplyChain = require('../src');

Container.augment_prototype(Contracts);

describe('supplychain', function(){

  it('should emit events', function(done) {

    var supplychain = SupplyChain(function(req, reply){

    })

    supplychain.on('test', done);
    supplychain.emit('test');
  })

  it('should connect a container', function() {

    var supplychain = SupplyChain(function(req, done){

    })

    var container = supplychain.connect('/');

    container.tag().should.equal('_supplychain');
  })

  it('should run the function with a request containing the contract', function(done){

    var supplychain = SupplyChain(function(req, reply){
      req.method.should.equal('post');
      req.url.should.equal('/reception');
      req.body.length.should.equal(1);
      req.body[0].method.should.equal('post');
      req.body[0].url.should.equal('/resolve');
      reply(null, []);
    })

    var container = supplychain.connect();

    container.diggerurl().should.equal('/');
    
    container('hello').ship(function(){
      done();
    })

  })

  it('should assign a string URL to the container produced', function(){

    var supplychain = SupplyChain(function(req, done){

    })

    var container = supplychain.connect('/app/database');

    container.diggerurl().should.equal('/app/database');

  })


})

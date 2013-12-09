var Container = require('digger-bundle');
var SupplyChain = require('../src');

describe('supplychain', function(){

  it('should emit events', function(done) {

    var supplychain = new SupplyChain();

    supplychain.on('test', done);
    supplychain.emit('test');
  })

  it('should connect a container', function() {

    var supplychain = new SupplyChain();

    var container = supplychain.connect('/');

    container.tag().should.equal('_supplychain');
  })

  it('should run the function with a request containing the contract', function(done){

    var supplychain = new SupplyChain();

    supplychain.on('request', function(req, reply){
      req.method.should.equal('post');
      req.url.should.equal('/myapi/select');
      req.headers['x-json-selector'].tag.should.equal('hello');
      reply(null, [{
        _digger:{
          tag:'fruit',
          class:['citrus']
        }
      }]);
    })

    var container = supplychain.connect('/myapi');
    container.diggerurl().should.equal('/myapi');
    
    var contract = container('hello');

    contract.ship(function(results){
      results.tag().should.equal('fruit');
      results.hasClass('citrus').should.equal(true);
      done();
    })

  })

  it('should assign a string URL to the container produced', function(){

    var supplychain = new SupplyChain();

    var container = supplychain.connect('/app/database');

    container.diggerurl().should.equal('/app/database');

  })

  it('should cope with an error via a callback', function(done){

    var supplychain = new SupplyChain();

    supplychain.on('request', function(req, reply){
      reply('this is an error');
    })

    var container = supplychain.connect();
    
    var contract = container('hello');
    contract.on('error', function(){})
    contract.ship(null, function(error){
      error.should.equal('this is an error');
      done();
    })

  })

  it('should cope with an error via a fail handler', function(done){

    var supplychain = new SupplyChain();

    supplychain.on('request', function(req, reply){
      reply('this is an error');
    })

    var container = supplychain.connect();
    
    var contract = container('hello');
    contract
    .fail(function(error){
      error.should.equal('this is an error');
      done();
    })
    .ship()

  })

  it('should cope with an error via events', function(done){

    var supplychain = new SupplyChain();

    supplychain.on('request', function(req, reply){
      reply('this is an error');
    })

    var container = supplychain.connect();
    
    var contract = container('hello');

    contract.on('error', function(error){
      error.should.equal('this is an error');
      done();
    });

    contract.ship();


  })

  it('should cope with results via events', function(done){

    var supplychain = new SupplyChain();

    supplychain.on('request', function(req, reply){
      reply(null, [{
        value:10
      }])
    })

    var container = supplychain.connect();
    var contract = container('hello');

    contract.on('results', function(results){
      results.attr('value').should.equal(10);
      done();
    });

    contract.ship();

  })

})

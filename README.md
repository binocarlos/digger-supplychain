digger-supplychain
==================

![Build status](https://api.travis-ci.org/binocarlos/digger-supplychain.png)

Interface for [digger-contracts](https://github.com/binocarlos/digger-contracts) to be sent to the server and respond with a [digger-container](https://github.com/binocarlos/digger-container)

# install

as a node module:

	$ npm install digger-contracts

or in the browser using [browserify](https://github.com/substack/node-browserify)

## example

```js
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
```

## licence
MIT
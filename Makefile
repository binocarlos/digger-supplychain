install:
	@npm install

build: install
	@echo build ...
	@mkdir -p build
	@./node_modules/.bin/browserify \
		src/index.js > build/build.js
	@./node_modules/.bin/browserify \
		test/test.js > build/test.js		

browser-test: build
	@echo browser test ...
	@./node_modules/mocha-phantomjs/bin/mocha-phantomjs test/test-runner.html

server-test:
	@echo server test
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter spec \
		--timeout 300 \
		--require should \
		--growl \
		test/test.js

test: browser-test server-test

.PHONY: test build
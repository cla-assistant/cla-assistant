// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;

// service under test
var cla = require('../../../server/services/cla');

describe('cla:check', function(done) {
	afterEach(function(){
		CLA.findOne.restore();
	});

	it('should check cla entry for equal repo, user and gist url', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', href: 'gistUrl'});
			done(null, true);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist: 'gistUrl'};
		cla.check(args, function(){
			done();
		});
	});
});

describe('cla:create', function(done) {
	afterEach(function(){
		// CLA.restore();
	});

	xit('should create cla entry for equal repo, user and gist url', function(done){
		// var claStub = sinon.createStubInstance(CLA);
		// claStub.new = function(args){
		// 	assert.deepEqual(args, {repo: 'myRepo', user: 'login', href: 'gistUrl'});
		// };
        sinon.stub(CLA, 'create', function(args, done){
			console.log('create');
			assert.deepEqual(args, {repo: 'myRepo', user: 'login', href: 'gistUrl'});
			done(null, true);
        });

        var args = {repo: 'myRepo', user: 'login', gist: 'gistUrl'};
		cla.create(args, function(){
			console.log('create');
			done();
		});
	});
});

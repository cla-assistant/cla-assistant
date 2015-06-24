/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var repo = require('../../../server/services/repo');

//model
var Repo = require('../../../server/documents/repo').Repo;


// api
var repo_api = require('../../../server/api/repo');


describe('repo', function() {
	it('should create repo via service', function(it_done){
		var repoCreateStub = sinon.stub(repo, 'create', function(args, done) {
			assert.deepEqual(args, {repo: 'myRepo', owner: 'login', gist: 1234, token: 'abc'});
			done();
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 1234}, user: {token: 'abc'}};

		repo_api.create(req, function() {
            repoCreateStub.restore();
            it_done();
        });
	});

	it('should check via repo service', function(it_done){
        var repoStub = sinon.stub(repo, 'check', function(args, done) {
			assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
			done();
		});

		var req = {args: {repo: 'myRepo', owner: 'login'}};

		repo_api.check(req, function() {
            repoStub.restore();
            it_done();
        });
	});

	it('should update via repo service', function(it_done){
        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
			var r = {owner: 'login', gist: 1234, save: function(cb){
				assert.equal(this.gist, 'url');
				cb(null, this);
			}};
			done(null, r);
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 'url'}};

		repo_api.update(req, function() {
            repoStub.restore();
            it_done();
        });
	});

	it('should remove via repo service', function(it_done){
		var repoStub = sinon.stub(Repo, 'remove', function(){
			var r = {exec: function(cb){
				cb(null);
			}};
			return r;
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 'url'}};

		repo_api.remove(req, function() {
            assert.equal(repoStub.called, 1);
            repoStub.restore();

            it_done();
        });
	});

	it('should send repo data if requester is the repo owner', function(){
		var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
			if (args.owner === 'login' && args.repo === 'myRepo') {
				var r = {owner: 'login', gist: 1234};
				done(null, r);
				return;
			}
			done('repo not found');
		});

		var req = {user: {login: 'login'}, args: {repo: 'myRepo', owner: 'login'}};

		repo_api.get(req, function(error, res) {
            assert.equal(res.gist, 1234);
        });

		req = {user: {login: 'login2'}, args: {repo: 'myRepo', owner: 'login'}};

		repo_api.get(req, function(error, res) {
            repoStub.restore();
            assert.equal(!!res, false);
        });
	});

	it('should get all repos for user', function(){
		sinon.stub(Repo, 'find', function(args, cb){
			if (args.$or && args.$or[0].owner === 'login') {
				var r = {owner: 'login', gist: 1234};
				cb(null, [r]);
				return;
			}
			cb('no repo found');
		});

		var req = {user: {login: 'login'}, args: {set: [{owner: 'login', repo: 'repo'} ] }};

		repo_api.getAll(req, function(error, res) {
			Repo.find.restore();
            assert.equal(res.length, 1);
        });
	});
});

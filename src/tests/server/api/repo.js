// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var repo = require('../../../server/services/repo');

//model
var Repo = require('../../../server/documents/repo').Repo;


// api
var repo_api = require('../../../server/api/repo');


describe('repo', function(done) {
	it('should create repo via service', function(done){
		var repoCreateStub = sinon.stub(repo, 'create', function(args, done) {
			assert.deepEqual(args, {repo: 'myRepo', owner: 'login', gist: 1234, token: 'abc'});
			done();
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 1234}, user: {token: 'abc'}};

		repo_api.create(req,function(error, res) {
            repoCreateStub.restore();
            done();
        });
	});

	it('should check via repo service', function(done){
        var repoStub = sinon.stub(repo, 'check', function(args, done) {
			assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
			done();
		});

		var req = {args: {repo: 'myRepo', owner: 'login'}};

		repo_api.check(req,function(error, res) {
            repoStub.restore();
            done();
        });
	});

	it('should update via repo service', function(done){
        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
			var r = {owner: 'login', gist: 1234, save: function(done){
				assert.equal(this.gist, 'url');
				done(null, this);
			}};
			done(null, r);
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 'url'}};

		repo_api.update(req,function(error, res) {
            repoStub.restore();
            done();
        });
	});

	it('should remove via repo service', function(done){
		var repoStub = sinon.stub(Repo, 'remove', function(args, done){
			var r = {exec: function(done){
				done(null);
			}};
			return r;
		});

		var req = {args: {repo: 'myRepo', owner: 'login', gist: 'url'}};

		repo_api.remove(req, function(error, res) {
            assert.equal(repoStub.called, 1);
            repoStub.restore();

            done();
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
});

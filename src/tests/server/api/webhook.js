
// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;

// api
var webhook_api = require('../../../server/api/webhook');


describe('webhook:call', function(done) {
    it('should call github service with user token', function(done){
        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
            var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId'};
            done(null, repo);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            assert.deepEqual(args,
                {obj: 'repos',
                fun: 'createHook',
                arg: {
                    user: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: { url: url.webhook('myRepo'), content_type: 'json' },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            });
            done();
        });

        var req = {user: { id: 1, login: 'login', token: 'abc'}, args: {repo: 'myRepo', owner: 'login'}};

        webhook_api.create(req,function(error, res) {
            githubStub.restore();
            repoStub.restore();
            done();
        });
    });
});

describe('webhook:remove', function(done) {
	it('should call github service with user token', function(done){
		var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
            var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId'};
            done(null, repo);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
			if(args.fun === 'getHooks'){
                done(null, [{id: 123, config: {url: url.baseWebhook} }]);
                return;
            }

            assert.deepEqual(args,
				{obj: 'repos',
				fun: 'deleteHook',
				arg: {
                    user: 'login',
                    repo: 'myRepo',
                    id: 123
                },
				token: 'abc'
            });
			done();
		});

		var req = {user: { id: 1, login: 'login', token: 'abc'}, args: {repo: 'myRepo', user: 'login'}};

		webhook_api.remove(req,function(error, res) {
            githubStub.restore();
            repoStub.restore();
            done();
        });
	});
});

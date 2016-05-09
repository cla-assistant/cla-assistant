/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;
var Org = require('../../../server/documents/org').Org;

// api
var webhook_api = require('../../../server/api/webhook');

var testData = require('../testData').data;

describe('webhook:create', function() {
    it('should call github service with user token', function(it_done){
        sinon.stub(Repo, 'findOne', function(args, done){
            var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId'};
            done(null, repo);
        });

        sinon.stub(github, 'call', function(args, done) {
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

        webhook_api.create(req, function() {
            github.call.restore();
            Repo.findOne.restore();
            it_done();
        });
    });

    it('should create a webhook for an organisation', function(it_done) {
        sinon.stub(Org, 'findOne', function(args, done){
            var org = {org: 'myOrg', orgId: 1, gist: 'https://gist.github.com/myOrg/gistId'};
            done(null, org);
        });

        sinon.stub(github, 'direct_call', function(args, done) {
            assert.deepEqual(args,
                {url: testData.orgs[0].hooks_url,
                arg: {
                    name: 'web',
                    config: { url: url.webhook(testData.orgs[0].login), content_type: 'json' },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            });
            done();
        });

        var req = {user: { id: 1, login: 'login', token: 'abc'}, args: {org: testData.orgs[0].login, orgId: testData.orgs[0].id}};

        webhook_api.create(req, function() {
            assert(github.direct_call.called);
            assert(Org.findOne.called);

            github.direct_call.restore();
            Org.findOne.restore();
            it_done();
        });
    });
});

describe('webhook:remove', function() {
	it('should call github service with user token', function(it_done){
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

		webhook_api.remove(req, function() {
            githubStub.restore();
            repoStub.restore();
            it_done();
        });
	});

    it('should report error if could not delete hook', function(it_done){
        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
            var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId'};
            done(null, repo);
        });

        var githubStub = sinon.stub(github, 'call', function(args_act, done) {
            if(args_act.fun === 'getHooks'){
                done(null, [{id: 123, config: {url: 'any other url'} }]);
                return;
            }

            assert(args_act.fun);
            done();
        });

        var req = {user: { id: 1, login: 'login', token: 'abc'}, args: {repo: 'myRepo', user: 'login'}};

        webhook_api.remove(req, function(error) {
            assert.equal(error, 'No webhook found with base url ' + url.baseWebhook);
            githubStub.restore();
            repoStub.restore();
            it_done();
        });
    });
});

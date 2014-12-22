// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;
var User = require('../../../server/documents/user').User;
var Repo = require('../../../server/documents/repo').Repo;

var https = require('https');

//services
var github = require('../../../server/services/github');
var repo_service = require('../../../server/services/repo');
var status = require('../../../server/services/status');

// service under test
var cla = require('../../../server/services/cla');


var config = {server: {github: {api: 'api.github.com'}}};
var callbacks = {};
var req = {
    end: function(){},
    error: function(err){
        callbacks.error(err);
    },
    on: function(fun, cb){
        callbacks[fun] = cb;
    }
};
var res = {
    on: function(fun, callback){
        callbacks[fun] = callback;
    }
};
describe('cla:get', function(done) {
    afterEach(function(){
        CLA.findOne.restore();
    });

    it('should get cla entry for equal repo, user and gist url', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'gistUrl', gist_version: 'xyz'});
            done(null, true);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist: 'gistUrl', gist_version: 'xyz'};
        cla.get(args, function(){
            done();
        });
    });
});

describe('cla:check', function(done) {
    beforeEach(function(){
        sinon.stub(repo_service, 'get', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login'});
            done('', {gist: 'url/gistId', token: 'abc'});
        });
        sinon.stub(https, 'request', function(options, done) {
            assert.deepEqual(options, {
                hostname: 'api.github.com',
                port: 443,
                path: '/gists/gistId',
                method: 'GET',
                headers: {
                    'Authorization': 'token abc',
                    'User-Agent': 'cla-assistant'
                }
            });
            done(res);
            return req;
        });
	});

	afterEach(function(){
		CLA.findOne.restore();
		repo_service.get.restore();
        https.request.restore();
	});

	it('should positive check whether user has already signed', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
			done(null, {id: 123, gist_url: 'url/gistId', created_at: '2012-06-20T11:34:15Z', gist_version: 'xyz'});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(result);
			done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});

	it('should negative check whether user has already signed', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
			done(null, null);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(!result);
			done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});
});

describe('cla:sign', function(done) {
    var test_args;

    beforeEach(function(){
		test_args = { repo: 'myRepo', owner: 'owner', user: 'login', user_id: 3};

        sinon.stub(cla, 'get', function(args, done){
            if (args.user !== 'login') {
                done(null, {id: 123, gist_url: 'url/gistId', created_at: '2011-06-20T11:34:15Z', gist_version: 'xyz'});
            } else {
                done(null, undefined);
            }
        });
        sinon.stub(CLA, 'create', function(args, done){
            console.log('stub create -> ');
            
            assert(args);
            assert(args.gist_url);
            assert(args.gist_version);
            done();
        });
        sinon.stub(repo_service, 'get', function(args, done){
            assert(args);
            done(null, {gist: 'url/gistId', token: 'abc'});
        });

        sinon.stub(https, 'request', function(options, done) {
            assert.deepEqual(options, {
                hostname: 'api.github.com',
                port: 443,
                path: '/gists/gistId',
                method: 'GET',
                headers: {
                    'Authorization': 'token abc',
                    'User-Agent': 'cla-assistant'
                }
            });
            done(res);
            return req;
        });
        sinon.stub(status, 'update', function(args, done){});
    });

    afterEach(function(){
        cla.get.restore();
        CLA.create.restore();
        repo_service.get.restore();
        status.update.restore();
        https.request.restore();
    });

    it('should store signed cla data if not signed yet', function(done) {
        sinon.stub(CLA, 'findOne', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
            done(null, true);
        });
        var user_find = sinon.stub(User, 'findOne', function(args, done){
            assert.deepEqual(args, {uuid: test_args.user_id});
            done('', {requests: [{number: 1, sha: 123, repo: {id: 123, name: 'myRepo', owner: {login: 'owner'}} }], save: function(){}});
        });

        cla.sign(test_args, function(error, res) {
            assert(res.pullRequest);
            assert(CLA.create.called);

            user_find.restore();
            CLA.findOne.restore();
            done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should do nothing if user has allready signed', function(done){

        test_args.user = 'signedUser';

        cla.sign(test_args, function(error, res) {
            assert.equal(CLA.create.called, false);
            done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should update status of pull request created by user, who signed', function(done){
        var user_find = sinon.stub(User, 'findOne', function(args, done){
			var user = {
				requests: [{repo: {id: 123, name: 'xy_repo'}, sha: 'guid'}],
				save: function(){}
			};
            done('', user);
        });

        cla.sign(test_args, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            User.findOne.restore();
            done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should update status of pull request for the appropriate repo', function(done){
        var user_find = sinon.stub(User, 'findOne', function(args, done){
			var user = {
				requests: [
					{repo: {id: 123, name: 'xy_repo', owner: {login: 'owner'}}, sha: 'guid'},
					{repo: {id: 234, name: 'myRepo', owner: {login: 'owner'}}, sha: 'guid2'}],
				save: function(){
                    assert.equal(this.requests.length, 1);
                }
			};
			done('', user);
        });

        cla.sign(test_args, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            assert.equal(status.update.callCount, 1);
            user_find.restore();
            done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should report error if error occours on DB', function(done){
        
        sinon.stub(User, 'findOne', function(args, done){
            done('any DB error', null);
        });

        cla.sign(test_args, function(err, res){
            assert(err);
            assert(!res);

            User.findOne.restore();
            done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

});

describe('cla:create', function(done) {
    afterEach(function(){
        CLA.create.restore();
    });

    it('should create cla entry for equal repo, user and gist url', function(done){
        sinon.stub(CLA, 'create', function(args, done){
            assert(args);
            assert(args.gist_url);
            assert(args.gist_version);
            done(null, {uuid: args.uuid});
        });

        var args = {repo: 'myRepo', user: 'login', gist: 'url/gistId', gist_version: 'xyz'};
        cla.create(args, function(err, obj){
            assert.ifError(err);
            assert.equal(obj.uuid.length, 13);
            done();
        });
    });
});

describe('cla:getAll', function(done) {
    beforeEach(function(){
        sinon.stub(repo_service, 'get', function(args, done){
            assert.equal(args.repo, 'myRepo');
            assert.equal(args.owner, 'owner');
            done('', {gist: 'url/gistId', token: 'abc'});
        });

        sinon.stub(https, 'request', function(options, done) {
            assert.deepEqual(options, {
                hostname: 'api.github.com',
                port: 443,
                path: '/gists/gistId',
                method: 'GET',
                headers: {
                    'Authorization': 'token abc',
                    'User-Agent': 'cla-assistant'
                }
            });
            done(res);
            return req;
        });
    });

	afterEach(function(){
		CLA.find.restore();
        repo_service.get.restore();
        https.request.restore();
    });

    it('should get all signed and valid cla', function(done){
        sinon.stub(CLA, 'find', function(args, done){
            assert(args);
            done(null, [{id: 2, created_at: '2011-06-20T11:34:15Z', gist_version: 'xyz'}, {id: 1, created_at: '2010-06-20T11:34:15Z', gist_version: 'abc'}]);
        });

        var args = {repo: 'myRepo', owner: 'owner', gist: 'gistUrl'};

        cla.getAll(args, function(err, arr){
            assert.ifError(err);
            assert.equal(arr.length, 1);
            assert.equal(arr[0].id, 2);
            assert(repo_service.get.called);
            assert(https.request.called);

            done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});

    it('should handle undefined gist', function(done){
        sinon.stub(CLA, 'find', function(args, done){
            assert(args);
            done(null, [{id: 2, created_at: '2011-06-20T11:34:15Z', gist_version: 'xyz'}, {id: 1, created_at: '2010-06-20T11:34:15Z', gist_version: 'abc'}]);
        });

        var args = {repo: 'myRepo', owner: 'owner', gist: 'gistUrl'};

        cla.getAll(args, function(err, arr){
            assert(err);

            done();
        });
        req.error('Error!');
    });

    it('should handle undefined clas', function(done){
        sinon.stub(CLA, 'find', function(args, done){
            assert(args);
            done('Error!', undefined);
        });

        var args = {repo: 'myRepo', owner: 'owner', gist: 'gistUrl'};

        cla.getAll(args, function(err, arr){
            assert(err);

            done();
        });
    });
});

describe('cla:getGist', function(done) {
    it('should extract valid gist ID', function(done){
        sinon.stub(https, 'request', function(options, done) {
            assert.equal(options.path, '/gists/gistId/versionId');
            done(res);
            return req;
        });

        var repo = {gist: {gist_url: 'url/gists/gistId', gist_version: 'versionId'}};

        cla.getGist(repo, function(err, obj){
            https.request.restore();
            done();
        });
        callbacks.data('{}');
        callbacks.end();
    });

    it('should handle repo without gist', function(done){
        // var repo = {gist: 'wronGistUrl'};
        var repo = {};

        cla.getGist(repo, function(err, obj){
            assert.equal(err, 'The gist url "undefined" seems to be invalid');
            done();
        });
    });
});

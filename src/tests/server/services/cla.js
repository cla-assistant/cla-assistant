/*global describe, it, beforeEach, afterEach*/
// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;
var User = require('../../../server/documents/user').User;

var https = require('https');

//services
var github = require('../../../server/services/github');
var repo_service = require('../../../server/services/repo');
var statusService = require('../../../server/services/status');
var url = require('../../../server/services/url');

// service under test
var cla = require('../../../server/services/cla');

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

describe('cla:get', function() {
    afterEach(function(){
        CLA.findOne.restore();
    });

    it('should get cla entry for equal repo, user and gist url', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'gistUrl', gist_version: 'xyz'});
            done(null, true);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist: 'gistUrl', gist_version: 'xyz'};
        cla.get(args, function(){
            it_done();
        });
    });
});

describe('cla:getLastSignature', function() {
    afterEach(function(){
        CLA.findOne.restore();
    });

    it('should get cla entry for equal repo, user and gist url', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, projection, sort, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'gistUrl'});
            done(null, {});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'gistUrl'};
        cla.getLastSignature(args, function(){
            it_done();
        });
    });
});

describe('cla:check', function() {
    beforeEach(function(){
        sinon.stub(repo_service, 'get', function(args, done){
            // assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login'});
            done('', {gist: 'url/gistId', token: 'abc'});
        });
        sinon.stub(repo_service, 'getPRCommitters', function(args, done){
            done('', [{name: 'login2'}, {name: 'login'}]);
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
        repo_service.getPRCommitters.restore();
        https.request.restore();
	});

    it('should negative check if repo has no gist', function(it_done){
        sinon.stub(CLA, 'findOne', function(){});

        repo_service.get.restore();
        sinon.stub(repo_service, 'get', function(args, done){
            done('', {token: 'abc'});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

        cla.check(args, function(err, result){
            assert.ifError(err);
            assert(!result);

            it_done();
        });
    });

    it('should send error if getGist has an error', function(it_done){
        sinon.stub(CLA, 'findOne', function(){});

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

        cla.check(args, function(err, result){
            assert(err);
            assert(!result);

            it_done();
        });

        callbacks.error('Error');
    });

	it('should positive check whether user has already signed', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
			done(null, {id: 123, gist_url: 'url/gistId', created_at: '2012-06-20T11:34:15Z', gist_version: 'xyz'});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(result);
			it_done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});

	it('should negative check whether user has already signed', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
			done(null, null);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(!result);
			it_done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});

    it('should positive check for pull request if pull request number given', function(it_done){
       sinon.stub(CLA, 'findOne', function(args, done){
            done(null, {id: 123, gist_url: 'url/gistId', created_at: '2012-06-20T11:34:15Z', gist_version: 'xyz'});
        });

        var args = {repo: 'myRepo', owner: 'owner', number: 1};

        cla.check(args, function(err, result){
            assert.ifError(err);
            assert(CLA.findOne.calledTwice);
            assert(result);
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should negative check for pull request if pull request number given', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, done){
            if(args.user === 'login'){
                done(null, {id: 123, gist_url: 'url/gistId', created_at: '2012-06-20T11:34:15Z', gist_version: 'xyz'});
            } else {
                done(null, null);
            }
        });

        var args = {repo: 'myRepo', owner: 'owner', number: 1};

        cla.check(args, function(err, result){
            assert.ifError(err);
            assert(!result);
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should return map of committers who has signed and who has not signed cla', function(it_done){
        sinon.stub(CLA, 'findOne', function(args, done){
            if(args.user === 'login'){
                done(null, {id: 123, user: 'login', gist_url: 'url/gistId', created_at: '2012-06-20T11:34:15Z', gist_version: 'xyz'});
            } else {
                done(null, null);
            }
        });

        var args = {repo: 'myRepo', owner: 'owner', number: 1};

        cla.check(args, function(err, signed, map){
            assert.ifError(err);
            assert(!signed);
            assert.equal(map.not_signed[0], 'login2');
            assert.equal(map.signed[0], 'login');
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });
});

describe('cla:sign', function() {
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

        sinon.stub(github, 'direct_call', function(args, done){
            assert(args.url);
            assert(args.token);
            assert.equal(args.url, url.githubPullRequests('owner', 'myRepo', 'open'));

            done(null, {data: [{number: 1}, {number: 2}]});
        });
        sinon.stub(statusService, 'update', function(args){
            assert(args.signed);
        });
    });

    afterEach(function(){
        cla.get.restore();
        CLA.create.restore();
        repo_service.get.restore();
        github.direct_call.restore();
        statusService.update.restore();
        https.request.restore();
    });

    it('should store signed cla data if not signed yet', function(it_done) {
        sinon.stub(CLA, 'findOne', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url/gistId', gist_version: 'xyz'});
            done(null, true);
        });
        var user_find = sinon.stub(User, 'findOne', function(args, done){
            assert.deepEqual(args, {uuid: test_args.user_id});
            done('', {requests: [{number: 1, sha: 123, repo: {id: 123, name: 'myRepo', owner: {login: 'owner'}} }], save: function(){}});
        });

        cla.sign(test_args, function() {
            // assert(res.pullRequest);
            assert(CLA.create.called);

            user_find.restore();
            CLA.findOne.restore();
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

<<<<<<< HEAD
    it('should do nothing if user has already signed', function(done){

=======
    it('should do nothing if user has allready signed', function(it_done){
>>>>>>> origin/master
        test_args.user = 'signedUser';

        cla.sign(test_args, function() {
            assert.equal(CLA.create.called, false);
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });

    it('should report error if error occours on DB', function(it_done){
        CLA.create.restore();
        sinon.stub(CLA, 'create', function(args, done){
            done('any DB error', null);
        });

        cla.sign(test_args, function(err, result){
            assert(err);
            assert(!result);
            it_done();
        });

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
    });
});

describe('cla:create', function() {
    afterEach(function(){
        CLA.create.restore();
    });

    it('should create cla entry for equal repo, user and gist url', function(it_done){
        sinon.stub(CLA, 'create', function(args, done){
            assert(args);
            assert(args.gist_url);
            assert(args.gist_version);
            assert(args.repo);
            assert(args.owner);
            assert(args.created_at);
            done(null, {repo: args.repo, owner: args.owner});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist: 'url/gistId', gist_version: 'xyz'};
        cla.create(args, function(err){
            assert.ifError(err);
            it_done();
        });
    });
});

<<<<<<< HEAD
describe('cla:getSignedCLA', function(done) {
      it('should get all clas signed by the user but only one per repo (linked or not)', function(done){
        sinon.stub(repo_service, 'all', function(done){
          done(null, [{repo: 'repo1', gist_url: 'gist_url'}, {repo: 'repo2', gist_url: 'gist_url'}]);
        });
=======
describe('cla:getSignedCLA', function() {
      it('should get all clas signed by the user', function(it_done){
>>>>>>> origin/master
        sinon.stub(CLA, 'find', function(args, selectionCriteria, sortCriteria, done){
          var listOfAllCla = [
            {repo: 'repo1', user: 'login', gist_url: 'gist_url', gist_version: '1'},
            {repo: 'repo2', user: 'login', gist_url: 'gist_url', gist_version: '1'},
            {repo: 'repo2', user: 'login', gist_url: 'gist_url', gist_version: '2'},
            {repo: 'repo3', user: 'login', gist_url: 'gist_url', gist_version: '1'}
          ];
          done(null, listOfAllCla);
        });

<<<<<<< HEAD
        var args = {user: 'login'};
        cla.getSignedCLA(args, function(err, clas){
            assert.ifError(err);
            assert.equal(clas.length, 3);
            assert.equal(clas[2].repo, 'repo3');
            CLA.find.restore();
            repo_service.all.restore();
            done();
        });
      });

      it('should select cla for the actual linked gist per repo even if it is signed earlier than others', function(done){
        sinon.stub(repo_service, 'all', function(done){
          done(null, [{repo: 'repo1', gist_url: 'gist_url2'}, {repo: 'repo2', gist_url: 'gist_url'}, {repo: 'repo3', gist_url: 'gist_url'}]);
        });
        sinon.stub(CLA, 'find', function(args, selectionCriteria, sortCriteria, done){
          var listOfAllCla = [
            {repo: 'repo1', user: 'login', gist_url: 'gist_url1', created_at: '2011-06-20T11:34:15Z'},
            {repo: 'repo1', user: 'login', gist_url: 'gist_url2', created_at: '2011-06-15T11:34:15Z'},
            {repo: 'repo2', user: 'login', gist_url: 'gist_url', created_at: '2011-06-15T11:34:15Z'}
          ];
          if (args.$or) {
            done(null, [{repo: 'repo1', user: 'login', gist_url: 'gist_url2', created_at: '2011-06-15T11:34:15Z'},
                        {repo: 'repo2', user: 'login', gist_url: 'gist_url', created_at: '2011-06-15T11:34:15Z'}]);
          }else{
            done(null, listOfAllCla);
          }
        });

        var args = {user: 'login'};
        cla.getSignedCLA(args, function(err, clas){
            assert.ifError(err);
            assert.equal(clas[0].gist_url, 'gist_url2');
            assert.equal(CLA.find.callCount, 2);
            CLA.find.restore();
            repo_service.all.restore();
            done();
        });
=======
      var args = {user: 'login'};
      cla.getSignedCLA(args, function(){
          CLA.find.restore();
          it_done();
      });
    });

    it('should select last cla per Repo', function(it_done){
      sinon.stub(CLA, 'find', function(args, selectionCriteria, sortCriteria, done){
        assert.deepEqual(args, {user: 'login'});
        var listOfAllCla = [
          {repo: 'repo1', user: 'login', gist_url: 'gist_url', gist_version: '1'},
          {repo: 'repo2', user: 'login', gist_url: 'gist_url', gist_version: '1'},
          {repo: 'repo2', user: 'login', gist_url: 'gist_url', gist_version: '2'},
          {repo: 'repo3', user: 'login', gist_url: 'gist_url', gist_version: '1'}
        ];

        done(null, listOfAllCla);
      });

      var args = {user: 'login'};
      cla.getSignedCLA(args, function(err, clas){
          assert.ifError(err);
          assert.equal(clas.length, 3);
          CLA.find.restore();
          it_done();
>>>>>>> origin/master
      });
});

describe('cla:getAll', function() {
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

    it('should get all signed and valid cla', function(it_done){
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

            it_done();
		});

        callbacks.data('{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}');
        callbacks.end();
	});

    it('should handle undefined gist', function(it_done){
        sinon.stub(CLA, 'find', function(args, done){
            assert(args);
            done(null, [{id: 2, created_at: '2011-06-20T11:34:15Z', gist_version: 'xyz'}, {id: 1, created_at: '2010-06-20T11:34:15Z', gist_version: 'abc'}]);
        });

        var args = {repo: 'myRepo', owner: 'owner', gist: 'gistUrl'};

        cla.getAll(args, function(err){
            assert(err);

            it_done();
        });
        req.error('Error!');
    });

    it('should handle undefined clas', function(it_done){
        sinon.stub(CLA, 'find', function(args, done){
            assert(args);
            done('Error!', undefined);
        });

        var args = {repo: 'myRepo', owner: 'owner', gist: 'gistUrl'};

        cla.getAll(args, function(err){
            assert(err);

            it_done();
        });
    });
});




describe('cla:getGist', function() {
    it('should extract valid gist ID', function(it_done){
        sinon.stub(https, 'request', function(options, done) {
            assert.equal(options.path, '/gists/gistId/versionId');
            done(res);
            return req;
        });

        var repo = {gist: {gist_url: 'url/gists/gistId', gist_version: 'versionId'}};

        cla.getGist(repo, function(){
            https.request.restore();
            it_done();
        });
        callbacks.data('{}');
        callbacks.end();
    });

    it('should handle repo without gist', function(it_done){
        // var repo = {gist: 'wronGistUrl'};
        var repo = {};

        cla.getGist(repo, function(err){
            assert.equal(err, 'The gist url "undefined" seems to be invalid');
            it_done();
        });
    });
});

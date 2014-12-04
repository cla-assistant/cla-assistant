// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;
var User = require('../../../server/documents/user').User;
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var repo_service = require('../../../server/services/repo');
var status = require('../../../server/services/status');

// service under test
var cla = require('../../../server/services/cla');

describe('cla:get', function(done) {
	afterEach(function(){
		CLA.findOne.restore();
	});

	it('should get cla entry for equal repo, user and gist url', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', href: 'gistUrl'});
			done(null, true);
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login', gist: 'gistUrl'};
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
        sinon.stub(github, 'call', function(args, done) {
            var res;
            if (args.obj === 'gists') {
                assert.deepEqual(args, {obj: 'gists', fun: 'get', arg: { id: 'gistId'}, token: 'abc'});
                res = {url: 'url', files: {xyFile: {content: 'some content'}}, updated_at: '2011-06-20T11:34:15Z'};
            }
            done(null, res);
        });
	});

	afterEach(function(){
		CLA.findOne.restore();
		repo_service.get.restore();
		github.call.restore();
	});

	it('should positive check whether user has already signed', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', href: 'url/gistId'});
			done(null, {id: 123, href: 'url/gistId', created_at: '2012-06-20T11:34:15Z'});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(result);
			done();
		});
	});

	it('should negative check whether user has already signed', function(done){
        sinon.stub(CLA, 'findOne', function(args, done){
			assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', href: 'url/gistId'});
			done(null, {id: 123, href: 'url/gistId', created_at: '2010-06-20T11:34:15Z'});
        });

        var args = {repo: 'myRepo', owner: 'owner', user: 'login'};

		cla.check(args, function(err, result){
			assert.ifError(err);
			assert(!result);
			done();
		});
	});
});

describe('cla:sign', function(done) {
    var args;

    beforeEach(function(){
		args = { repo: 123, owner: 'owner', user: 'login'};

        sinon.stub(cla, 'get', function(args, done){
            console.log(args.user);
            if (args.user !== 'login') {
                done(null, {id: 123, href: 'url/gistId', created_at: '2011-06-20T11:34:15Z'});
            } else {
                done(null, undefined);
            }
        });
        sinon.stub(cla, 'create', function(args, done){
            assert(args);
            done();
        });
        sinon.stub(repo_service, 'get', function(args, done){
            assert(args);
            done('', {gist: 'url/gistId', token: 'abc'});
        });
        sinon.stub(github, 'call', function(args, done) {
            var res;
            if (args.obj === 'gists') {
                assert.deepEqual(args, {obj: 'gists', fun: 'get', arg: { id: 'gistId'}, token: 'abc'});
                res = {url: 'url', files: {xyFile: {content: 'some content'}}, updated_at: '2011-06-20T11:34:15Z'};
            }
            done(null, res);
        });
        sinon.stub(status, 'update', function(args, done){});
    });

    afterEach(function(){
        cla.get.restore();
        cla.create.restore();
        repo_service.get.restore();
        github.call.restore();
        status.update.restore();
    });

    it('should store signed cla data if not signed yet', function(done) {

        var user_find = sinon.stub(User, 'findOne', function(args, done){
            done('', {requests: [{number: 1, sha: 123, repo: {id: 123, name: 'myRepo'} }], save: function(){}});
        });

        cla.sign(args, function(error, res) {
            assert(res.pullRequest);
            assert(cla.create.called);
            user_find.restore();
            done();
        });

    });

    it('should do nothing if user has allready signed', function(done){

        args.user = 'signedUser';

        cla.sign(args, function(error, res) {
            assert.equal(cla.create.called, false);
            done();
        });
    });

    it('should update status of pull request created by user, who signed', function(done){
        var user_find = sinon.stub(User, 'findOne', function(args, done){
			var user = {
				requests: [{repo: {id: 123, name: 'xy_repo'}, sha: 'guid'}],
				save: function(){}
			};
            done('', user);
        });

        cla.sign(args, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            User.findOne.restore();
            done();
        });
    });

    it('should update status of each users pull request', function(done){
        var user_find = sinon.stub(User, 'findOne', function(args, done){
			var user = {
				requests: [
					{repo: {id: 123, name: 'xy_repo'}, sha: 'guid'},
					{repo: {id: 234, name: 'ab_repo'}, sha: 'guid2'}],
				save: function(){}
			};
			done('', user);
        });

        cla.sign(args, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            assert.equal(status.update.callCount, 2);
            user_find.restore();
            done();
        });
    });

});


describe('cla:create', function(done) {
	afterEach(function(){
		CLA.create.restore();
	});

	it('should create cla entry for equal repo, user and gist url', function(done){
        sinon.stub(CLA, 'create', function(args, done){
			assert(args);
			// assert.deepEqual(args, {repo: 'myRepo', user: 'login', href: 'gistUrl'});
			done(null, {uuid: args.uuid});
        });

        var args = {repo: 'myRepo', user: 'login', gist: 'gistUrl'};
		cla.create(args, function(err, obj){
			assert.ifError(err);
			assert.equal(obj.uuid.length, 13);
			done();
		});
	});
});

// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// models
var User = require('../../../server/documents/user').User;
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');
var cla = require('../../../server/services/cla');
var repo_service = require('../../../server/services/repo');
var status = require('../../../server/services/status');
var prService = require('../../../server/services/pullRequest');

// api
var cla_api = require('../../../server/api/cla');

describe('cla:get', function(done) {
    it('should get gist and render it with user token', function(it_done) {
        sinon.stub(cla, 'getRepo', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
            cb(null, {gist: 'url', token: 'abc'});
        });
        sinon.stub(cla, 'getGist', function(repo, cb){
            assert.equal(repo.gist.gist_url, 'url');
            var res = {url: 'url', files: {xyFile: {content: 'some content'}}, updated_at: '2011-06-20T11:34:15Z', history: [{version: 'xyz'}]};
            cb(null, res);
        });
        var githubStub = sinon.stub(github, 'call', function(args, cb) {
            var res;
            assert.equal(args.obj, 'markdown');
            assert.equal(args.fun, 'render');
            assert.equal(args.token, 'abc');
            res = {status: 200};
            cb(null, res);
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}, user: {token: 'abc'}};

        cla_api.get(req, function(error, res) {
            assert(cla.getRepo.called);

            githubStub.restore();
            cla.getRepo.restore();
            cla.getGist.restore();
            it_done();
        });
    });

    it('should get gist and render it without user token', function(it_done) {
        sinon.stub(cla, 'getRepo', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
            cb(null, {gist: 'url', token: 'abc'});
        });
        sinon.stub(cla, 'getGist', function(repo, cb){
            assert.equal(repo.gist.gist_url, 'url');
            var res = {url: 'url', files: {xyFile: {content: 'some content'}}, updated_at: '2011-06-20T11:34:15Z', history: [{version: 'xyz'}]};
            cb(null, res);
        });
        var githubStub = sinon.stub(github, 'call', function(args, cb) {
            var res;
            assert.equal(args.obj, 'markdown');
            assert.equal(args.fun, 'render');
            assert.ifError(args.token);
            res = {status: 200};
            cb(null, res);
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}};

        cla_api.get(req, function(error, res) {
            assert(cla.getRepo.called);

            githubStub.restore();
            cla.getRepo.restore();
            cla.getGist.restore();
            it_done();
        });
    });

    it('should handle wrong gist url', function(it_done) {

        var repoStub = sinon.stub(Repo, 'findOne', function(args, cb){
            var repo = {repo: 'myRepo', owner: 'login', gist: '123', token: 'abc'};
            cb(null, repo);
        });
        sinon.stub(cla, 'getGist', function(repo, cb){
            cb('error');
        });

        var githubStub = sinon.stub(github, 'call', function(args, cb) {
            assert();
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}};

        cla_api.get(req, function(error, res) {
            assert.equal(!!error, true);
            githubStub.restore();
            repoStub.restore();
            cla.getGist.restore();
            it_done();
        });

    });

    it('should handle result with no files', function(it_done) {
        sinon.stub(cla, 'getRepo', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
            cb(null, {gist: 'url', token: 'abc'});
        });
        sinon.stub(cla, 'getGist', function(repo, cb){
            assert.equal(repo.gist.gist_url, 'url');
            var res = {url: 'url', updated_at: '2011-06-20T11:34:15Z', history: [{version: 'xyz'}]};
            cb(null, res);
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}};

        cla_api.get(req, function(error, res) {
            assert(cla.getRepo.called);

            cla.getRepo.restore();
            cla.getGist.restore();
            it_done();
        });

    });
});

describe('cla api', function(done) {
    var req;
    beforeEach(function(){
        req = {
            user: {id: 3, login: 'login'},
            args: {
                repo: 'myRepo',
                owner: 'owner',
                gist: 'url/gistId'
            }
        };

        sinon.stub(repo_service, 'get', function(args, cb){
            assert(args);
            cb(null, {gist: 'url/gistId', token: 'abc'});
        });
        sinon.stub(github, 'direct_call', function(args, cb){
            assert(args.url);
            assert(args.token);
            assert.equal(args.url, url.githubPullRequests('owner', 'myRepo', 'open'));

            cb(null, {data: [{number: 1}, {number: 2}]});
        });

        sinon.stub(status, 'update', function(args, cb){
            assert(args.signed);
        });
        sinon.stub(cla, 'sign', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', user_id: 3});
            cb(null, 'done');
        });
        sinon.stub(cla, 'check', function(args, cb){
            cb(null, true);
        });
        sinon.stub(prService, 'editComment', function(){});
    });

    afterEach(function(){
        status.update.restore();
        repo_service.get.restore();
        github.direct_call.restore();
        cla.check.restore();
        cla.sign.restore();
        prService.editComment.restore();
    });

    it('should call cla service on sign', function(done){

        cla_api.sign(req, function(err){
            assert.ifError(err);
            assert(cla.sign.called);

            done();
        });
    });

    it('should update status of pull request created by user, who signed', function(done){
        cla_api.sign(req, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            assert(status.update.called);

            done();
        });
    });

    it('should update status of all open pull requests for the repo', function(done){
        cla_api.sign(req, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            assert.equal(status.update.callCount, 2);
            assert(github.direct_call.called);
            assert(prService.editComment.called);

            done();
        });
    });

    it('should handle repos without open pull requests', function(done){
        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function(args, cb){
            cb(null, {});
        });

        cla_api.sign(req, function(error, res) {
            assert.ifError(error);
            assert.ok(res);
            assert(github.direct_call.called);
            assert(!status.update.called);

            done();
        });
    });
});

describe('cla api', function(done) {
    var req;
    beforeEach(function(){
        req = {
            user: {id: 3, login: 'login'},
            args: {
                repo: 'myRepo',
                owner: 'owner',
                gist: 'url/gistId'
            }
        };
    });

    it('should call cla service on getLastSignature', function(done) {
        sinon.stub(cla, 'getRepo', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner'});
            cb(null, {gist: 'url', token: 'abc'});
        });
        sinon.stub(cla, 'getLastSignature', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login', gist_url: 'url'});
            console.log('getLastSignature stub called');
            cb(null, {});
        });

        req.args = {repo: 'myRepo', owner: 'owner'};

        cla_api.getLastSignature(req, function(err, obj){
            assert.ifError(err);
            assert(cla.getLastSignature.called);

            cla.getLastSignature.restore();
            cla.getRepo.restore();
            done();
        });
    });

    it('should call cla service on check', function(done){
        sinon.stub(cla, 'check', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login'});
            cb(null, true);
        });

        cla_api.check(req, function(err, signed){
            assert.ifError(err);
            assert(cla.check.called);

            cla.check.restore();
            done();
        });
    });

    it('should call cla service on getAll', function(done){
        req.args.gist = 'url/gistId/version2';
        sinon.stub(cla, 'getAll', function(args, cb){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', gist: 'url/gistId/version2'});
            cb(null, []);
        });

        cla_api.getAll(req, function(err, all){
            assert.ifError(err);
            assert(cla.getAll.called);

            cla.getAll.restore();
            done();
        });
    });

    it('should call cla service on getGist', function(done){
        req.args.gist = 'url/gistId/version2';
        sinon.stub(cla, 'getRepo', function(args, cb){
            cb(null, {token: 123, gist: 'url/gistId'});
        });
        sinon.stub(cla, 'getGist', function(args, cb){
            assert.deepEqual(args, {token: 123, gist: 'url/gistId/version2'});
            cb(null, {});
        });

        cla_api.getGist(req, function(err, all){
            assert.ifError(err);
            assert(cla.getGist.called);

            cla.getRepo.restore();
            cla.getGist.restore();
            done();
        });
    });

});

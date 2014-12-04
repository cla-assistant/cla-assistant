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

// api
var cla_api = require('../../../server/api/cla');

describe('cla:get', function(done) {
    it('should get gist and render it', function(done) {
        sinon.stub(cla, 'getRepo', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'login'});
            done(null, {gist: 'url'});
        });
        sinon.stub(cla, 'getGist', function(repo, done){
            assert.equal(repo.gist, 'url');
            var res = {url: 'url', files: {xyFile: {content: 'some content'}}, updated_at: '2011-06-20T11:34:15Z'};
            done(null, res);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            var res;
            if (args.obj === 'gists') {
                assert.deepEqual(args, {obj: 'gists', fun: 'get', arg: { id: 'gistId'}, token: 'abc'});
                res = {files: {xyFile: {content: 'some content'}}};
            } else {
                assert.equal(args.obj, 'markdown');
                assert.equal(args.fun, 'render');
                res = {status: 200};
            }
            done(null, res);
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}};

        cla_api.get(req, function(error, res) {
            assert(cla.getRepo.called);

            githubStub.restore();
            cla.getRepo.restore();
            cla.getGist.restore();
            done();
        });

    });

    it('should handle wrong gist url', function(done) {

        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
            var repo = {repo: 'myRepo', owner: 'login', gist: '123'};
            done(null, repo);
        });

        var githubStub = sinon.stub(github, 'call', function(args, done) {
            var res;
            var err;
            if (args.obj === 'gists') {
                err = 'error';
            } else if (args.obj === 'markdown') {
                assert();
            }
            done(err, res);
        });

        var req = {args: {repo: 'myRepo', owner: 'login'}};

        cla_api.get(req, function(error, res) {
            assert.equal(!!error, true);
            githubStub.restore();
            repoStub.restore();
            done();
        });

    });
});

describe('cla api', function(done) {
    var req = {
        user: {id: 3, login: 'login'},
        args: {
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId'
        }
    };

    it('should call cla service on sign', function(done){
        sinon.stub(cla, 'sign', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login'});
            done(null);
        });

        cla_api.sign(req, function(err){
            assert.ifError(err);
            assert(cla.sign.called);

            cla.sign.restore();
            done();
        });
    });

    it('should call cla service on check', function(done){
        sinon.stub(cla, 'check', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', user: 'login'});
            done(null, true);
        });

        cla_api.check(req, function(err, signed){
            assert.ifError(err);
            assert(cla.check.called);

            cla.check.restore();
            done();
        });
    });

    it('should call cla service on getAll', function(done){
        sinon.stub(cla, 'getAll', function(args, done){
            assert.deepEqual(args, {repo: 'myRepo', owner: 'owner', gist: 'url/gistId'});
            done(null, []);
        });

        cla_api.getAll(req, function(err, all){
            assert.ifError(err);
            assert(cla.getAll.called);

            cla.getAll.restore();
            done();
        });
    });

});

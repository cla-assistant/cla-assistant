/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// api
var github_api = require('../../../server/api/github');

// module
var github = require('../../../server/services/github');

describe('github:call', function () {
    beforeEach(function () {
        sinon.stub(github, 'call').callsFake(function (args, cb) {
            assert.deepEqual(args, { obj: 'gists', fun: 'get', token: 'abc' });
            cb();
        });
    });

    afterEach(function () {
        github.call.restore();
    });

    it('should call github service with user token', function (it_done) {


        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { obj: 'gists', fun: 'get' } };

        github_api.call(req, function () {
            it_done();
        });
    });
});

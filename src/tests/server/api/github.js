/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

// api
let github_api = require('../../../server/api/github');

// module
let github = require('../../../server/services/github');

describe('github:call', function () {
    beforeEach(function () {
        sinon.stub(github, 'call').callsFake(async args => {
            assert.deepEqual(args, { obj: 'gists', fun: 'list', token: 'abc' });
            return { data: '', headers: '' }
        });
    });

    afterEach(function () {
        github.call.restore();
    });

    it('should call github service with user token', async () => {
        let req = { user: { id: 1, login: 'login', token: 'abc' }, args: { obj: 'gists', fun: 'list' } };

        await github_api.call(req)
    });
});

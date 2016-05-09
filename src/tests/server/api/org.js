/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// service
var org = require('../../../server/services/org');
//model
// var Org = require('../../../server/documents/org').Org;
// api
var org_api = require('../../../server/api/org');


describe('org api', function() {
    it('should create new org via org service', function(it_done) {
        sinon.stub(org, 'create', function(args, done) {
            assert.deepEqual(args, {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl',
                token: 'abc'
            });
            done();
        });

        var req = {
            args: {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            },
            user: {
                token: 'abc'
            }
        };

        org_api.create(req, function() {
            org.create.restore();
            it_done();
        });
    });
});

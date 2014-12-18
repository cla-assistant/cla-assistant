// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// service
var url = require('../../../server/services/url');

describe('url:baseUrl', function(done) {
    it('should by default be http://cla-assistant.io', function(done) {
        assert.equal(url.baseUrl, 'http://cla-assistant.io');
        done();
    });
});

describe('url:githubBase', function(done) {
    it('should by default be https://github.com', function(done) {
        assert.equal(url.githubBase, 'https://github.com');
        done();
    });
});

describe('url:githubApiBase', function(done) {
    it('should by default be https://api.github.com', function(done) {
        assert.equal(url.githubApiBase, 'https://api.github.com');
        done();
    });
});

describe('url:githubProfile', function(done) {
    it('should by default be /user', function(done) {
        assert.equal(url.githubProfile(), 'https://api.github.com/user');
        done();
    });
});

describe('url:githubProfile', function(done) {
    it('should be /api/v3/user in enterprise mode', function(done) {
        config.server.github.enterprise = true;
        assert.equal(url.githubProfile(), 'https://api.github.com/api/v3/user');
        done();
    });
});

describe('url:githubFileReference', function(done) {
    it('should by default be https://api.github.com/user/repo/blob/fileref', function(done) {
        assert.equal(url.githubFileReference('user', 'repo', 'fileref'),
                    'https://github.com/user/repo/blob/fileref');
        done();
    });
});

describe('url:githubPullRequest', function(done) {
    it('should by default be http://cla-assistant.io/user/repo/pull/1', function(done) {
        assert.equal(url.githubPullRequest('user', 'repo', 1),
                    'https://github.com/user/repo/pull/1');
        done();
    });
});

describe('url:pullRequestBadge', function(done) {
    it('should by default be http://cla-assistant.io/:repoId/pull/:number/badge', function(done) {
        assert.equal(url.pullRequestBadge(123, 456),
                    'http://cla-assistant.io/123/pull/456/badge');
        done();
    });
});

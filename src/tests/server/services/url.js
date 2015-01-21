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

describe('url:githubPullRequests', function(done) {
    it('should by default be https://api.github.com/repos/:owner/:repo/pulls', function(done) {
        assert.equal(url.githubPullRequests('owner', 'repo'),
                    'https://api.github.com/repos/owner/repo/pulls');
        done();
    });
    it('should set state parameter if provided', function(done) {
        assert.equal(url.githubPullRequests('owner', 'repo', 'open'),
                    'https://api.github.com/repos/owner/repo/pulls?state=open');
        done();
    });
});

describe('url:githubPullRequest', function(done) {
    it('should by default be https://api.github.com/repos/:owner/:repo/pulls/:number', function(done) {
        assert.equal(url.githubPullRequest('owner', 'repo', 1),
                    'https://api.github.com/repos/owner/repo/pulls/1');
        done();
    });
});

describe('url:githubPullRequestCommits', function(done) {
    it('should by default be https://api.github.com/repos/:owner/:repo/pulls/:number', function(done) {
        assert.equal(url.githubPullRequestCommits('owner', 'repo', 1),
                    'https://api.github.com/repos/owner/repo/pulls/1/commits');
        done();
    });
});

describe('url:pullRequestBadge', function(done) {
    it('should by default be http://cla-assistant.io/pull/badge/signed', function(done) {
        assert.equal(url.pullRequestBadge(true),
                    'http://cla-assistant.io/pull/badge/signed');
        done();
    });
});

describe('url:githubPullRequestComments', function(done) {
    it('should by default be http://api.github.com/repos/:owner/:repo/issues/:number/comments', function(done) {
        assert.equal(url.githubPullRequestComments('owner', 'repo', 1),
                    'https://api.github.com/repos/owner/repo/issues/1/comments');
        done();
    });
});

describe('url:claURL', function(done) {
    it('should by default be http://cla-assistant.io/:owner/:repo', function(done) {
        assert.equal(url.claURL('owner', 'repo'),
                    'http://cla-assistant.io/owner/repo');
        done();
    });

    it('should by be http://cla-assistant.io/:owner/:repo?pullRequest=:number if number provided', function(done) {
        assert.equal(url.claURL('owner', 'repo', 1),
                    'http://cla-assistant.io/owner/repo?pullRequest=1');
        done();
    });
});

/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')

// config
global.config = require('../../../config')

// service
const url = require('../../../server/services/url')

describe('url:baseUrl', () => it('should by default be http://cla-assistant.io', async () => {
    assert.equal(url.baseUrl, 'http://cla-assistant.io')
    // done();
}))

describe('url:githubBase', () => it('should by default be https://github.com', async () => {
    assert.equal(url.githubBase, 'https://github.com')
}))

describe('url:githubApiBase', () => it('should by default be https://api.github.com', async () => {
    assert.equal(url.githubApiBase, 'https://api.github.com')
}))

describe('url:githubProfile', () => it('should by default be /user', async () => {
    assert.equal(url.githubProfile(), 'https://api.github.com/user')
}))

describe('url:githubProfile', () => it('should be /api/v3/user in enterprise mode', async () => {
    config.server.github.enterprise = true;
    assert.equal(url.githubProfile(), 'https://api.github.com/api/v3/user');
}))

describe('url:githubFileReference', () => it('should by default be https://api.github.com/user/repo/blob/fileref', async () => {
    assert.equal(url.githubFileReference('user', 'repo', 'fileref'),
        'https://github.com/user/repo/blob/fileref')
}))

describe('url:githubPullRequests', async () => {
    it('should by default be https://api.github.com/repos/:owner/:repo/pulls', async () => {
        assert.equal(url.githubPullRequests('owner', 'repo'),
            'https://api.github.com/repos/owner/repo/pulls')
    })
    it('should set state parameter if provided', async () => {
        assert.equal(url.githubPullRequests('owner', 'repo', 'open'),
            'https://api.github.com/repos/owner/repo/pulls?state=open')
    })
})

describe('url:githubPullRequest', () => it('should by default be https://api.github.com/repos/:owner/:repo/pulls/:number', async () => {
    assert.equal(url.githubPullRequest('owner', 'repo', 1),
        'https://api.github.com/repos/owner/repo/pulls/1')
}))

describe('url:githubPullRequestCommits', () => it('should by default be https://api.github.com/repos/:owner/:repo/pulls/:number', async () => {
    assert.equal(url.githubPullRequestCommits('owner', 'repo', 1),
        'https://api.github.com/repos/owner/repo/pulls/1/commits')
}))

describe('url:pullRequestBadge', () => it('should by default be http://cla-assistant.io/pull/badge/signed', async () => {
    assert.equal(url.pullRequestBadge(true),
        'http://cla-assistant.io/pull/badge/signed')
}))

describe('url:githubPullRequestComments', () => it('should by default be http://api.github.com/repos/:owner/:repo/issues/:number/comments', async () => {
    assert.equal(url.githubPullRequestComments('owner', 'repo', 1),
        'https://api.github.com/repos/owner/repo/issues/1/comments')
}))

describe('url:claURL', () => {
    it('should by default be http://cla-assistant.io/:owner/:repo', async () => {
        assert.equal(url.claURL('owner', 'repo'),
            'http://cla-assistant.io/owner/repo')
    })

    it('should be http://cla-assistant.io/:owner/:repo?pullRequest=:number if number provided', async () => {
        assert.equal(url.claURL('owner', 'repo', 1),
            'http://cla-assistant.io/owner/repo?pullRequest=1')
    })
})

describe('url:githubCommits', () => {
    it('should by default be http://api.github.com/repos/:owner/:repo/commits', async () => {
        assert.equal(url.githubCommits('owner', 'repo'),
            'https://api.github.com/repos/owner/repo/commits')
    })

    it('should be http://api.github.com/repos/:owner/:repo?sha=:branch if branch provided', async () => {
        assert.equal(url.githubCommits('owner', 'repo', 'featureBranch'),
            'https://api.github.com/repos/owner/repo/commits?sha=featureBranch')
    })

    it('should be http://api.github.com/repos/:owner/:repo?sha=:branch&since=:timestamp if branch and timestamp provided', async () => {
        assert.equal(url.githubCommits('owner', 'repo', 'featureBranch', 'anyTimestamp'),
            'https://api.github.com/repos/owner/repo/commits?sha=featureBranch&since=anyTimestamp')
    })

    it('should be http://api.github.com/repos/:owner/:repo?since=:timestamp if only timestamp provided', async () => {
        assert.equal(url.githubCommits('owner', 'repo', null, 'anyTimestamp'),
            'https://api.github.com/repos/owner/repo/commits?since=anyTimestamp')
    })
})

describe('url:githubOrgWebhook', () => it('should be /orgs/:org/hooks', async () => {
    assert.equal(url.githubOrgWebhook('orgName'),
        'https://api.github.com/orgs/orgName/hooks')
}))
/*eslint no-empty-function: "off"*/
// unit test
const assert = require('assert')
const sinon = require('sinon')

// services
const pullRequest = require('../../../server/services/pullRequest')
const status = require('../../../server/services/status')
const cla = require('../../../server/services/cla')
const repoService = require('../../../server/services/repo')
const orgService = require('../../../server/services/org')
const logger = require('../../../server/services/logger')

const config = require('../../../config')

const User = require('../../../server/documents/user').User

// webhook under test
const pull_request = require('../../../server/webhooks/pull_request')

const testData = {
    'id': 1,
    'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
    'html_url': 'https://github.com/octocat/Hello-World/pull/1347',
    'diff_url': 'https://github.com/octocat/Hello-World/pull/1347.diff',
    'patch_url': 'https://github.com/octocat/Hello-World/pull/1347.patch',
    'issue_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347',
    'commits_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
    'review_comments_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments',
    'review_comment_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/{number}',
    'comments_url': 'https://api.github.com/repos/octocat/Hello-World/issues/1347/comments',
    'statuses_url': 'https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'number': 1347,
    'state': 'open',
    'title': 'new-feature',
    'body': 'Please pull these awesome changes',
    'created_at': '2011-01-26T19:01:12Z',
    'updated_at': '2011-01-26T19:01:12Z',
    'closed_at': '2011-01-26T19:01:12Z',
    'merged_at': '2011-01-26T19:01:12Z',
    'head': {
        'label': 'new-topic',
        'ref': 'new-topic',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'user': {
            'login': 'octocat',
            'id': 1,
            'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
            'gravatar_id': '',
            'url': 'https://api.github.com/users/octocat',
            'html_url': 'https://github.com/octocat',
            'followers_url': 'https://api.github.com/users/octocat/followers',
            'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
            'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
            'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
            'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
            'organizations_url': 'https://api.github.com/users/octocat/orgs',
            'repos_url': 'https://api.github.com/users/octocat/repos',
            'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
            'received_events_url': 'https://api.github.com/users/octocat/received_events',
            'type': 'User',
            'site_admin': false
        },
        'repo': {
            'id': 1296269,
            'owner': {
                'login': 'octocat',
                'id': 1,
                'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
                'gravatar_id': '',
                'url': 'https://api.github.com/users/octocat',
                'html_url': 'https://github.com/octocat',
                'followers_url': 'https://api.github.com/users/octocat/followers',
                'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
                'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
                'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
                'organizations_url': 'https://api.github.com/users/octocat/orgs',
                'repos_url': 'https://api.github.com/users/octocat/repos',
                'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
                'received_events_url': 'https://api.github.com/users/octocat/received_events',
                'type': 'User',
                'site_admin': false
            },
            'name': 'Hello-World',
            'full_name': 'octocat/Hello-World',
            'description': 'This your first repo!',
            'private': false,
            'fork': true,
            'url': 'https://api.github.com/repos/octocat/Hello-World',
            'html_url': 'https://github.com/octocat/Hello-World',
            'clone_url': 'https://github.com/octocat/Hello-World.git',
            'git_url': 'git://github.com/octocat/Hello-World.git',
            'ssh_url': 'git@github.com:octocat/Hello-World.git',
            'svn_url': 'https://svn.github.com/octocat/Hello-World',
            'mirror_url': 'git://git.example.com/octocat/Hello-World',
            'homepage': 'https://github.com',
            'language': null,
            'forks_count': 9,
            'stargazers_count': 80,
            'watchers_count': 80,
            'size': 108,
            'default_branch': 'master',
            'open_issues_count': 0,
            'has_issues': true,
            'has_wiki': true,
            'has_pages': false,
            'has_downloads': true,
            'pushed_at': '2011-01-26T19:06:43Z',
            'created_at': '2011-01-26T19:01:12Z',
            'updated_at': '2011-01-26T19:14:43Z',
            'permissions': {
                'admin': false,
                'push': false,
                'pull': true
            }
        }
    },
    'base': {
        'label': 'master',
        'ref': 'master',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'user': {
            'login': 'octocat',
            'id': 1,
            'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
            'gravatar_id': '',
            'url': 'https://api.github.com/users/octocat',
            'html_url': 'https://github.com/octocat',
            'followers_url': 'https://api.github.com/users/octocat/followers',
            'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
            'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
            'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
            'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
            'organizations_url': 'https://api.github.com/users/octocat/orgs',
            'repos_url': 'https://api.github.com/users/octocat/repos',
            'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
            'received_events_url': 'https://api.github.com/users/octocat/received_events',
            'type': 'User',
            'site_admin': false
        },
        'repo': {
            'id': 1296269,
            'owner': {
                'login': 'octocat',
                'id': 1,
                'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
                'gravatar_id': '',
                'url': 'https://api.github.com/users/octocat',
                'html_url': 'https://github.com/octocat',
                'followers_url': 'https://api.github.com/users/octocat/followers',
                'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
                'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
                'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
                'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
                'organizations_url': 'https://api.github.com/users/octocat/orgs',
                'repos_url': 'https://api.github.com/users/octocat/repos',
                'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
                'received_events_url': 'https://api.github.com/users/octocat/received_events',
                'type': 'User',
                'site_admin': false
            },
            'name': 'Hello-World',
            'full_name': 'octocat/Hello-World',
            'description': 'This your first repo!',
            'private': false,
            'fork': true,
            'url': 'https://api.github.com/repos/octocat/Hello-World',
            'html_url': 'https://github.com/octocat/Hello-World',
            'clone_url': 'https://github.com/octocat/Hello-World.git',
            'git_url': 'git://github.com/octocat/Hello-World.git',
            'ssh_url': 'git@github.com:octocat/Hello-World.git',
            'svn_url': 'https://svn.github.com/octocat/Hello-World',
            'mirror_url': 'git://git.example.com/octocat/Hello-World',
            'homepage': 'https://github.com',
            'language': null,
            'forks_count': 9,
            'stargazers_count': 80,
            'watchers_count': 80,
            'size': 108,
            'default_branch': 'master',
            'open_issues_count': 0,
            'has_issues': true,
            'has_wiki': true,
            'has_pages': false,
            'has_downloads': true,
            'pushed_at': '2011-01-26T19:06:43Z',
            'created_at': '2011-01-26T19:01:12Z',
            'updated_at': '2011-01-26T19:14:43Z',
            'permissions': {
                'admin': false,
                'push': false,
                'pull': true
            }
        }
    },
    'user': {
        'login': 'octocat',
        'id': 1,
        'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
        'gravatar_id': '',
        'url': 'https://api.github.com/users/octocat',
        'html_url': 'https://github.com/octocat',
        'followers_url': 'https://api.github.com/users/octocat/followers',
        'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
        'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
        'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
        'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
        'organizations_url': 'https://api.github.com/users/octocat/orgs',
        'repos_url': 'https://api.github.com/users/octocat/repos',
        'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
        'received_events_url': 'https://api.github.com/users/octocat/received_events',
        'type': 'User',
        'site_admin': false
    },
    'merge_commit_sha': 'e5bd3914e2e596debea16f433f57875b5b90bcd6',
    'merged': false,
    'mergeable': true,
    'merged_by': {
        'login': 'octocat',
        'id': 1,
        'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
        'gravatar_id': '',
        'url': 'https://api.github.com/users/octocat',
        'html_url': 'https://github.com/octocat',
        'followers_url': 'https://api.github.com/users/octocat/followers',
        'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
        'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
        'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
        'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
        'organizations_url': 'https://api.github.com/users/octocat/orgs',
        'repos_url': 'https://api.github.com/users/octocat/repos',
        'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
        'received_events_url': 'https://api.github.com/users/octocat/received_events',
        'type': 'User',
        'site_admin': false
    },
    'comments': 10,
    'commits': 3,
    'additions': 100,
    'deletions': 3,
    'changed_files': 5
}

describe('webhook pull request', () => {
    config.server.github.enforceDelay = 1
    const res = {
        status: (res_status) => {
            assert.equal(res_status, 200)
            return {
                send: function () { }
            }
        }
    }

    let test_req, testRes, testUser, testUserSaved

    beforeEach(() => {
        test_req = {
            args: {
                pull_request: testData,
                repository: testData.base.repo,
                number: testData.number,
                action: 'opened'
            }
        }
        testRes = {
            getPRCommitters: [{
                id: 1,
                name: 'login'
            }],
            repoService: {
                get: {
                    repo: 'requestedRepo',
                    token: 'abc',
                    gist: 'https://api.github.com/users/octocat/gists{/gist_id}'
                },
                getGHRepo: {}
            },
            cla: {
                isClaRequired: true,
                getLinkedItem: {
                    gist: 'gist',
                    token: 'token'
                }
            }
        }
        testUser = {
            save: function () {
                testUserSaved = true
            },
            name: 'testUser',
            requests: [{
                repo: 'Hello-World',
                owner: 'octocat',
                numbers: [1]
            }]
        }
        testUserSaved = false

        sinon.stub(cla, 'check').callsFake(async (args) => {
            assert(args.number)
            assert(!args.user)
            return { signed: false }
        })

        sinon.stub(repoService, 'get').callsFake(async (args) => {
            assert(args.repoId)
            // assert(args.ownerId)
            return testRes.repoService.get
        })

        sinon.stub(cla, 'isClaRequired').callsFake(async () => {
            return testRes.cla.isClaRequired
        })

        sinon.stub(repoService, 'getGHRepo').callsFake(async () => {
            return testRes.repoService.getGHRepo
        })

        sinon.stub(cla, 'getLinkedItem').callsFake(async (args) => {
            return Object.assign(args, testRes.cla.getLinkedItem)
        })

        sinon.stub(repoService, 'getPRCommitters').callsFake(async (args) => {
            assert(args.repo)
            assert(args.owner)
            assert(args.number)
            return testRes.getPRCommitters
        })

        sinon.spy(pullRequest, 'badgeComment')
        sinon.stub(pullRequest, 'deleteComment').callsFake(() => { })
        sinon.stub(status, 'update').callsFake((args) => {
            assert(args.owner)
            assert(args.repo)
            assert(args.number)
            assert(args.signed !== undefined)
            assert(args.token)
        })
        sinon.stub(status, 'updateForClaNotRequired').callsFake(() => { })

        sinon.stub(orgService, 'get').callsFake(async (args) => {
            assert(args.orgId)
            return {
                org: 'orgOfRequestedRepo',
                token: 'abc',
                isRepoExcluded: function () {
                    return false
                }
            }
        })
        sinon.stub(logger, 'error').callsFake((msg) => assert(msg))
        sinon.stub(logger, 'warn').callsFake((msg) => assert(msg))
        sinon.stub(logger, 'info').callsFake((msg) => assert(msg))
        sinon.stub(User, 'findOne').callsFake(async () => testUser)
    })

    afterEach(() => {
        cla.check.restore()
        cla.isClaRequired.restore()
        cla.getLinkedItem.restore()
        pullRequest.badgeComment.restore()
        pullRequest.deleteComment.restore()
        repoService.getPRCommitters.restore()
        repoService.get.restore()
        repoService.getGHRepo.restore()
        orgService.get.restore()
        status.update.restore()
        status.updateForClaNotRequired.restore()
        logger.error.restore()
        logger.warn.restore()
        logger.info.restore()
        User.findOne.restore()
    })

    it('should update status of pull request if not signed', async () => {
        pull_request(test_req, res)
        await new Promise((resolve) => setTimeout(resolve, 8))
        assert(pullRequest.badgeComment.called)
    })

    it('should provide userMap to badgeComment', async () => {
        cla.check.restore()
        pullRequest.badgeComment.restore()

        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))
        sinon.stub(pullRequest, 'badgeComment').callsFake((_owner, _repo, _prNumber, _signed, userMap) => assert(userMap.not_signed))

        pull_request(test_req, res)
        await new Promise((resolve) => setTimeout(resolve, 8))
        assert(pullRequest.badgeComment.called)
    })

    it('should store PR number if not signed', async () => {
        cla.check.restore()
        testUser.save = () => {
            testUserSaved = true
            assert(testUser.requests[0].numbers.indexOf(1347) > -1)
        }
        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 80))
        sinon.assert.called(User.findOne)
        assert(testUserSaved)
    })

    it('should create PR numbers store if not given yet', async () => {
        cla.check.restore()
        testUser.requests = []
        testUser.save = function () {
            testUserSaved = true
            assert(testUser.requests[0].numbers.indexOf(1347) > -1)
        }

        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        sinon.assert.called(User.findOne)
        assert(testUserSaved)
    })

    it('should create user if not given yet', async () => {
        cla.check.restore()
        testUser = null
        sinon.stub(User, 'create').resolves()
        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        sinon.assert.called(User.findOne)
        sinon.assert.called(User.create)
        User.create.restore()
    })

    it('should store only distinct PR number if not signed', async () => {
        test_req.args.number = 1
        cla.check.restore()
        testUser.save = function () {
            assert('should not be called')
        }

        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        sinon.assert.called(User.findOne)
    })

    it('should store PR if the PR is from an repo that is not stored before', async () => {
        testUser.requests = [{
            repo: 'Another Repo',
            owner: 'octocat',
            numbers: [1]
        }]
        test_req.args.number = 1
        cla.check.restore()

        sinon.stub(cla, 'check').callsFake(async () => ({ signed: false, userMap: { not_signed: ['test_user'] } }))

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        sinon.assert.called(User.findOne)
        assert(testUserSaved)
    })

    it('should update status of pull request if signed', async () => {
        cla.check.restore()
        sinon.stub(cla, 'check').resolves({ signed: true })

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        assert(pullRequest.badgeComment.called)
        assert(status.update.called)
    })

    it('should update status of pull request if not signed and new user', async () => {
        pull_request(test_req, res)

        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))
        assert(cla.check.called)
    })

    it('should do nothing if the pull request has no committers', async () => {
        repoService.getPRCommitters.restore()
        sinon.stub(repoService, 'getPRCommitters').resolves([])

        // this.timeout(150)
        test_req.args.handleDelay = 0

        pull_request(test_req, res)
        await new Promise((resolve) => setTimeout(resolve, 40))
        assert(!cla.check.called)
        assert(logger.warn.called)

    })

    it('should set ClaNotRequired status if the pull request has only whitelisted committers', async () => {
        cla.check.restore()

        sinon.stub(cla, 'check').resolves({
            signed: true,
            userMap: {
                signed: [],
                not_signed: [],
                unknown: []
            }
        })
        // this.timeout(150)
        test_req.args.handleDelay = 0

        pull_request(test_req, res)

        await new Promise((resolve) => setTimeout(resolve, 40))
        assert(!status.update.called)
        assert(status.updateForClaNotRequired.called)

    })

    // it('should update status of PR even if repo is unknown but from known org', function() {
    // 	repoService.get.restore()
    // 	sinon.stub(repoService, 'get').callsFake( (args) => {
    // 		done(null, null)
    // 	})

    // 	pull_request(test_req, res)

    // 	assert.equal(repoService.get.called, false)
    // 	assert.equal(orgService.get.called, true)
    // 	assert.equal(repoService.getPRCommitters.called, true)
    // 	assert.equal(cla.check.called, true)
    // })

    it('should do nothing if the pull request hook comes from unknown repository and unknown org', async () => {
        testRes.cla.getLinkedItem = null
        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))

        assert.equal(cla.getLinkedItem.called, true)
        assert.equal(repoService.getPRCommitters.called, false)
        assert.equal(cla.check.called, false)
    })

    it('should do nothing if the pull request hook comes from private repository of an org', async () => {
        test_req.args.repository.private = true

        pull_request(test_req, res)
        // this.timeout(100)
        await new Promise((resolve) => setTimeout(resolve, 8))

        assert.equal(cla.getLinkedItem.called, false)
        assert.equal(repoService.getPRCommitters.called, false)
        assert.equal(cla.check.called, false)
        test_req.args.repository.private = false
    })

    it('should call repoService 2 more times if getPRCommitters fails', async () => {
        repoService.getPRCommitters.restore()
        sinon.stub(repoService, 'getPRCommitters').rejects(new Error('Could not get committers'))
        // this.timeout(1000)

        test_req.args.handleDelay = 0.01
        pull_request(test_req, res)

        await new Promise((resolve) => setTimeout(resolve, 800))

        assert.equal(repoService.getPRCommitters.calledThrice, true)
        assert.equal(cla.check.called, false)
    })

    it('should NOT try to update a repo that has a null CLA', async () => {
        // this.timeout(100)
        testRes.cla.getLinkedItem.gist = null
        test_req.args.handleDelay = 0
        pull_request(test_req, res)
        await new Promise((resolve) => setTimeout(resolve, 8))
        assert(!status.update.called)
    })

    it('should update status and delete comment when a pull request is NOT significant', async () => {
        // this.timeout(100)
        testRes.cla.isClaRequired = false
        pull_request(test_req, res)
        await new Promise((resolve) => setTimeout(resolve, 10))
        assert(status.updateForClaNotRequired.called)
        assert(pullRequest.deleteComment.called)
    })
})
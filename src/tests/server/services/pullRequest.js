/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

// services
const github = require('../../../server/services/github')
const logger = require('../../../server/services/logger')
const cla_config = require('../../../config')

// service under test
const pullRequest = require('../../../server/services/pullRequest')

const testDataComments_withCLAComment = [{
    'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
    'id': 1,
    'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
    'path': 'file1.txt',
    'position': 1,
    'original_position': 4,
    'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
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
    'body': 'any comment',
    'created_at': '2011-04-14T16:00:49Z',
    'updated_at': '2011-04-14T16:00:49Z',
    'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
    'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
    '_links': {
        'self': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
        },
        'html': {
            'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
        },
        'pull_request': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
        }
    }
}, {
    'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
    'id': 2,
    'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
    'path': 'file1.txt',
    'position': 1,
    'original_position': 4,
    'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
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
    'body': '[![CLA assistant check](http://cla_dev.ngrok.com/24456091/pull/71/badge)](http://cla_dev.ngrok.com/KharitonOff/testGithub) <br/>Please agree to our Contributor License Agreement in order to get your pull request merged.',
    'created_at': '2011-04-14T16:00:49Z',
    'updated_at': '2011-04-14T16:00:49Z',
    'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
    'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
    '_links': {
        'self': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
        },
        'html': {
            'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
        },
        'pull_request': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
        }
    }
}]

const testDataComments_withoutCLA = [{
    'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
    'id': 2,
    'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
    'path': 'file1.txt',
    'position': 1,
    'original_position': 4,
    'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
    'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
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
    'body': 'any comment',
    'created_at': '2011-04-14T16:00:49Z',
    'updated_at': '2011-04-14T16:00:49Z',
    'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
    'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
    '_links': {
        'self': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
        },
        'html': {
            'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
        },
        'pull_request': {
            'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
        }
    }
}]


describe('pullRequest:badgeComment', () => {
    let direct_call_data, assertionFunction
    cla_config.server.github.user = 'cla-assistant'
    cla_config.server.github.pass = 'secret_pass'

    beforeEach(() => {
        cla_config.server.github.token = 'xyz'

        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj === 'issues' && args.fun === 'listComments') {
                return {
                    data: direct_call_data
                }
            }
            if (assertionFunction) {
                return assertionFunction(args)
            }
        })
        sinon.stub(logger, 'warn').callsFake(error => {
            console.log(error) // eslint-disable-line no-console
        })
    })

    afterEach(() => {
        assertionFunction = undefined
        github.call.restore()
        logger.warn.restore()
    })

    it('should create comment with cla-assistant user', async () => {
        direct_call_data = []
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'createComment')
            assert(!args.token)
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert.equal(args.basicAuth.pass, 'secret_pass')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            return {
                data: 'githubRes'
            }
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, undefined, {
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should edit comment with cla-assistant user', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'updateComment')
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, undefined, {
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should add a note to the comment if there is a committer who is not a github user', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'updateComment')
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert(args.arg.body.indexOf('If you have already a GitHub account, please [add the email address used for this commit to your account]') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user1'],
            unknown: ['user1'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })
    it('should add 2 notes  to the comment if there is a external committer (corporate CLA) and he/she is not a GitHub User ', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'updateComment')
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert(args.arg.body.indexOf('In case you are already a member of') >= 0)
            assert(args.arg.body.indexOf('If you have already a GitHub account, please [add the email address used for this commit to your account]') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user1'],
            unknown: ['user1'],
            hasExternalCommiter: {
                check: true
            }
        })
        assert(!logger.warn.called)
    })

    it('should  add anly one note (not a Github user) to the comment if there is no external committer (corporate CLA)', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'updateComment')
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert(args.arg.body.indexOf('In case you are already a member of') < 0)
            assert(args.arg.body.indexOf('If you have already a GitHub account, please [add the email address used for this commit to your account]') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user1'],
            unknown: ['user1'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should add a note to the comment with name of ONE committer who has no github account', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert(args.arg.body.indexOf('**user1** seems not to be a GitHub user. You need a GitHub account to be able to sign the CLA. ') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user1'],
            unknown: ['user1'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should add a note to the comment with names of MULTIPLE committers who has no github account', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert(args.arg.body.indexOf('**user1, user2** seem not to be a GitHub user. You need a GitHub account to be able to sign the CLA. ') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user1', 'user2'],
            unknown: ['user1', 'user2'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should write a list of signed and not signed users on create', async () => {
        direct_call_data = []
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'createComment')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(args.arg.body.indexOf('In case you are already a member of') < 0)
            assert(args.arg.body.indexOf('**1** out of **2**') >= 0)
            assert(args.arg.body.indexOf(':white_check_mark: user1') >= 0)
            assert(args.arg.body.indexOf(':x: user2') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: ['user1'],
            not_signed: ['user2'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should add a note to the commment for Corporate CLA and  write a list of signed and not signed external committers  on create', async () => {
        direct_call_data = []
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'createComment')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(args.arg.body.indexOf('In case you are already a member of') >= 0)
            assert(args.arg.body.indexOf('**1** out of **2**') >= 0)
            assert(args.arg.body.indexOf(':white_check_mark: user1') >= 0)
            assert(args.arg.body.indexOf(':x: user2') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: ['user1'],
            not_signed: ['user2'],
            hasExternalCommiter: {
                check: true
            }
        })
        assert(!logger.warn.called)
    })

    it('should NOT write a list of signed and not signed users on create if there is only one committer', async () => {
        direct_call_data = []
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'createComment')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(args.arg.body.indexOf('In case you are already a member of') < 0)
            assert(args.arg.body.indexOf('**0** out of **1**') < 0)
            assert(args.arg.body.indexOf(':x: user2') < 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user2'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })

    it('should add a note for Corporate CLA and should NOT write a list of signed and not signed users on create if there is only one external committer ', async () => {
        direct_call_data = []
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'createComment')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(args.arg.body.indexOf('In case you are already a member of') >= 0)
            assert(args.arg.body.indexOf('**0** out of **1**') < 0)
            assert(args.arg.body.indexOf(':x: user2') < 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: [],
            not_signed: ['user2'],
            hasExternalCommiter: {
                check: true
            }
        })
        assert(!logger.warn.called)
    })

    it('should write a list of signed and not signed users on edit', async () => {
        direct_call_data = testDataComments_withCLAComment
        assertionFunction = async (args) => {
            assert.equal(args.fun, 'updateComment')
            assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(args.arg.body.indexOf('In case you are already a member of') < 0)
            assert(args.arg.body.indexOf('**1** out of **2**') >= 0)
            assert(args.arg.body.indexOf(':white_check_mark: user1') >= 0)
            assert(args.arg.body.indexOf(':x: user2') >= 0)
            return 'githubRes'
        }

        await pullRequest.badgeComment('login', 'myRepo', 1, false, {
            signed: ['user1'],
            not_signed: ['user2'],
            hasExternalCommiter: {
                check: false
            }
        })
        assert(!logger.warn.called)
    })
})

describe('pullRequest:getComment', () => {
    beforeEach(() => {
        cla_config.server.github.token = 'xyz'

        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj === 'issues' && args.fun === 'listComments') {
                assert.equal(args.token, 'xyz')
                return {
                    data: testDataComments_withCLAComment
                }
            }
        })
    })

    afterEach(() => github.call.restore())

    it('should get CLA assistant_s comment', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        }
        const comment = await pullRequest.getComment(args)
        assert(github.call.called)
        assert.deepEqual(comment, testDataComments_withCLAComment[1])
    })

    it('should not find the comment if it is not there', async () => {
        github.call.restore()
        sinon.stub(github, 'call').resolves({
            data: testDataComments_withoutCLA
        })
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        }
        const comment = await pullRequest.getComment(args)
        assert(github.call.called)
        assert(!comment)
    })

    it('should not find the comment if github is not answering in a proper way', async () => {
        github.call.restore()
        sinon.stub(github, 'call').rejects(new Error('Error'))
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        }
        try {
            pullRequest.getComment(args)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(github.call.called)
        }
    })
})

describe('pullRequest:editComment', () => {
    let assertionFunction
    beforeEach(() => {
        cla_config.server.github.token = 'xyz'

        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj === 'issues' && args.fun === 'listComments') {
                assert.equal(args.token, 'xyz')
                return {
                    data: testDataComments_withCLAComment
                }
            }
            if (assertionFunction) {
                return assertionFunction(args)
            }
            assert.equal(args.basicAuth.user, 'cla-assistant')
            assert(args.arg.comment_id)
            return 'res'
        })
        sinon.stub(logger, 'warn').callsFake(error => {
            console.log(error) // eslint-disable-line no-console
        })
    })

    afterEach(() => {
        github.call.restore()
        assertionFunction = undefined
        logger.warn.restore()
    })

    it('should edit comment if not signed', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1,
            userMap: {
                hasExternalCommiter: {
                    check: false
                }
            }

        }

        await pullRequest.editComment(args)
        assert(github.call.calledTwice)
        assert(!logger.warn.called)
    })

    it('should write a list of signed and not signed users on edit if not signed', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1,
            signed: false,
            userMap: {
                signed: ['user1'],
                not_signed: ['user2'],
                hasExternalCommiter: {
                    check: false
                }
            }
        }

        assertionFunction = async (params) => {
            assert.equal(params.fun, 'updateComment')
            assert(params.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0)
            assert(params.arg.body.indexOf('**1** out of **2**') >= 0)
            assert(params.arg.body.indexOf(':white_check_mark: user1') >= 0)
            assert(params.arg.body.indexOf(':x: user2') >= 0)
            return 'githubRes'
        }

        await pullRequest.editComment(args)
        assert(github.call.called)
        assert(!logger.warn.called)
    })

    it('should edit comment if signed', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1,
            signed: true
        }

        await pullRequest.editComment(args)
        assert(github.call.called)
        assert(!logger.warn.called)
    })

    it('should not fail if no callback provided', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1,
            signed: true
        }

        await pullRequest.editComment(args)
        assert(!logger.warn.called)
    })
})

describe('pullRequest:deleteComment', () => {
    let args = null,
        error = null,
        res = null

    beforeEach(() => {
        args = {
            repo: 'Hello-World',
            owner: 'owner',
            number: 1
        }
        error = {}
        res = {}
        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj === 'issues' && args.fun === 'listComments') {
                if (error.listComments) {
                    throw new Error(error.listComments)
                }
                return {
                    data: res.listComments
                }
            }
            if (args.obj === 'issues' && args.fun === 'deleteComment') {
                throw new Error(error.deleteComment)
            }
        })
    })

    afterEach(() => github.call.restore())

    it('should NOT delete comment if cannot find the comment', async () => {
        error.listComments = 'Cannot find the comment'
        await pullRequest.deleteComment(args)
        assert(!github.call.calledWithMatch({
            obj: 'issues',
            fun: 'deleteComment'
        }))
    })

    it('should NOT delete comment if get commit failed', async () => {
        error.listComments = 'Get commit failed'
        await pullRequest.deleteComment(args)
        assert(!github.call.calledWithMatch({
            obj: 'issues',
            fun: 'deleteComment'
        }))
    })

    it('should delete comment', async () => {
        res.listComments = testDataComments_withCLAComment
        await pullRequest.deleteComment(args)
        assert(github.call.calledWithMatch({
            obj: 'issues',
            fun: 'deleteComment'
        }))
    })
})
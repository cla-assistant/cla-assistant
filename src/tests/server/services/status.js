/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

// services
let github = require('../../../server/services/github');

// service under test
let status = require('../../../server/services/status');

let testData = {
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
};

let testStatusesSuccess = [
    {
        'state': 'success',
        'description': 'Build has completed successfully',
        'id': 1,
        'context': 'anything/else'
    },
    {
        'state': 'success',
        'description': 'Check succeeded',
        'id': 2,
        'context': 'license/cla'
    }
];
let testStatusesPending = [
    {
        'state': 'success',
        'description': 'Build has completed successfully',
        'id': 1,
        'context': 'anything/else'
    },
    {
        'state': 'pending',
        'description': 'Check failed',
        'id': 2,
        'context': 'licence/cla'
    }
];
let testStatusesFailure = [
    {
        'state': 'pending',
        'description': 'Check failed',
        'id': 2,
        'context': 'license/cla'
    },
    {
        'state': 'pending',
        'description': 'Check failed',
        'id': 1,
        'context': 'licence/cla'
    }
];

let statusForElse = {
    id: 2,
    state: 'success',
    description: 'Build has completed successfully',
    target_url: 'www.test.com',
    context: 'anything/else'
};

let statusForClaNotSigned = {
    id: 1,
    state: 'pending',
    description: 'Contributor License Agreement is not signed yet.',
    target_url: 'www.test.com',
    context: 'license/cla'
};

describe('status', function () {
    let githubCallPRGet, githubCallStatusGet, assertFunction, githubCallCombinedStatus;
    beforeEach(function () {
        githubCallPRGet = {
            data: testData,
            err: null
        };
        githubCallStatusGet = {
            data: testStatusesPending,
            err: null
        };
        githubCallCombinedStatus = {
            data: null,
            err: null
        };
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.obj === 'pullRequests' && args.fun === 'get') {
                assert(args.token);
                done(githubCallPRGet.err, githubCallPRGet.data);
            } else if (args.obj === 'repos' && args.fun === 'getStatuses') {
                assert.equal(args.token, 'abc');
                done(githubCallStatusGet.err, githubCallStatusGet.data);
            } else if (args.obj === 'repos' && args.fun === 'getCombinedStatusForRef') {
                done(githubCallCombinedStatus.err, githubCallCombinedStatus.data);
            } else {
                assert.equal(args.token, 'abc');
                if (assertFunction) {
                    assertFunction(args);
                }
                if (typeof done === 'function') {
                    done();
                }
            }
        });
    });

    afterEach(function () {
        assertFunction = undefined;
        github.call.restore();
    });

    describe('update', function () {
        it('should create comment with admin token', function (it_done) {
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc'
            };

            status.update(args, function () {
                assert.equal(github.call.callCount, 4);
                it_done();
            });
        });

        it('should create status pending if not signed', function (it_done) {
            assertFunction = function (args) {
                assert.equal(args.arg.state, 'pending');
                assert.equal(args.arg.context, 'license/cla');

            };
            githubCallStatusGet.data = testStatusesSuccess;
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: false,
                token: 'abc'
            };

            status.update(args, function () {
                assert(github.call.calledThrice);
                it_done();
            });
        });

        it('should not update status if no pull request found', function (it_done) {
            githubCallPRGet.err = 'error';
            githubCallPRGet.data = null;
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: false,
                token: 'abc'
            };

            status.update(args);

            assert(github.call.calledOnce);
            it_done();
        });

        it('should not update status if no pull request found', function (it_done) {
            githubCallPRGet.data = {
                message: 'Not found'
            };
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: false,
                token: 'abc'
            };

            status.update(args);

            assert(github.call.calledOnce);
            it_done();
        });

        it('should not load PR if sha is provided', function (it_done) {
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc',
                sha: 'sha1'
            };

            status.update(args, function () {
                assert(github.call.calledThrice);
                it_done();
            });
        });

        it('should use old and new context if there is already a status with this context', function (it_done) {
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc',
                sha: 'sha1'
            };
            // assertFunction = function (args) {
            //     assert.equal(args.arg.context, 'licence/cla');
            // };

            status.update(args, function () {
                assert(github.call.calledThrice);
                it_done();
            });

        });

        it('should not update status if it has not changed', function (it_done) {
            githubCallStatusGet.data = testStatusesSuccess;
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc',
                sha: 'sha1'
            };

            status.update(args, function () {
                assert(github.call.calledOnce);
                assert(github.call.calledWithMatch({ obj: 'repos', fun: 'getStatuses' }));
                it_done();
            });

        });

        it('should update status if there are no old ones', function (it_done) {
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: false,
                token: 'abc',
                sha: 'sha1'
            };
            githubCallStatusGet.data = null;

            status.update(args, function () {
                assert(github.call.calledTwice);
                it_done();
            });

        });

        it('should update statuses of all contexts if there are both (licenCe and licenSe)', function (it_done) {
            let args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc',
                sha: 'sha1'
            };
            githubCallStatusGet.data = testStatusesFailure;

            status.update(args, function () {
                assert(github.call.calledThrice);
                it_done();
            });

        });
    });

    describe('updateForNullCla', function () {
        let args = null;

        let statusForNullCla = {
            id: 1,
            state: 'success',
            description: 'No Contributor License Agreement required.',
            target_url: null,
            context: 'license/cla'
        };

        let testCombinedStatus = {
            state: 'pending',
            statuses: [statusForClaNotSigned, statusForElse]
        };

        let testNoClaCombinedStatus = {
            state: 'success',
            statuses: [statusForElse]
        };

        let testNullClaCombinedStatus = {
            state: 'success',
            statuses: [statusForNullCla, statusForElse]
        };

        beforeEach(function () {
            args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc'
            };
        });

        it('should create status if previous status is not for null cla', function (it_done) {
            githubCallCombinedStatus.data = testCombinedStatus;
            status.updateForNullCla(args, function () {
                assert(github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should not create status if there is no cla status', function (it_done) {
            githubCallCombinedStatus.data = testNoClaCombinedStatus;
            status.updateForNullCla(args, function () {
                assert(!github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should not create status if previous status is a null cla status', function (it_done) {
            githubCallCombinedStatus.data = testNullClaCombinedStatus;
            status.updateForNullCla(args, function () {
                assert(!github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should send error when get pull request head sha failed', function (it_done) {
            githubCallPRGet.err = 'Get pull request failed';
            status.updateForNullCla(args, function (err) {
                assert.equal(err, githubCallPRGet.err);
                it_done();
            });
        });

        it('should send error when get pull request head sha is null', function (it_done) {
            githubCallPRGet.data = null;
            status.updateForNullCla(args, function (err) {
                assert(err);
                // assert.equal(err, githubCallPRGet.err);
                it_done();
            });
        });
    });

    describe('updateForClaNotRequired', function () {
        let args = null;

        let statusForClaNotRequired = {
            id: 1,
            context: 'license/cla',
            state: 'success',
            description: 'All CLA requirements met.',
            target_url: null
        };

        let testNoClaCombinedStatus = {
            state: 'success',
            statuses: [statusForElse]
        };

        let testCombinedStatus = {
            state: 'pending',
            statuses: [statusForClaNotSigned, statusForElse]
        };

        let testCombinedStatusForClaNotRequired = {
            state: 'success',
            statuses: [statusForClaNotRequired, statusForElse]
        };

        beforeEach(function () {
            args = {
                owner: 'octocat',
                repo: 'Hello-World',
                number: 1,
                signed: true,
                token: 'abc'
            };
        });

        it('should create status if previous status is not for cla not required', function (it_done) {
            githubCallCombinedStatus.data = testCombinedStatus;
            status.updateForClaNotRequired(args, function () {
                assert(github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should create status if there is no cla status', function (it_done) {
            githubCallCombinedStatus.data = testNoClaCombinedStatus;
            status.updateForClaNotRequired(args, function () {
                assert(github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should not create status if previous status is for cla not required', function (it_done) {
            githubCallCombinedStatus.data = testCombinedStatusForClaNotRequired;
            status.updateForClaNotRequired(args, function () {
                assert(!github.call.calledWithMatch({
                    obj: 'repos',
                    fun: 'createStatus'
                }));
                it_done();
            });
        });

        it('should send error when get pull request head sha failed', function (it_done) {
            githubCallPRGet.err = 'Get pull request failed';
            status.updateForClaNotRequired(args, function (err) {
                assert.equal(err, githubCallPRGet.err);
                it_done();
            });
        });
    });
});

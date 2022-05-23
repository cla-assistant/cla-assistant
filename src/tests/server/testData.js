// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

let testData = {
    ////////////////////////////////////////////
    /////////////////// ORG ////////////////////
    ////////////////////////////////////////////
    'orgs': [{
        'login': 'github',
        'id': 1,
        'url': 'https://api.github.com/orgs/github',
        'repos_url': 'https://api.github.com/orgs/github/repos',
        'events_url': 'https://api.github.com/orgs/github/events',
        'hooks_url': 'https://api.github.com/orgs/github/hooks',
        'issues_url': 'https://api.github.com/orgs/github/issues',
        'members_url': 'https://api.github.com/orgs/github/members{/member}',
        'public_members_url': 'https://api.github.com/orgs/github/public_members{/member}',
        'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
        'description': 'A great organization'
    }, {
        'login': 'testOrg',
        'id': 2
    }],

    ////////////////////////////////////////////
    /////////////////// ORG REPOS //////////////
    ////////////////////////////////////////////
    'orgRepos': [{
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
    }],

    ////////////////////////////////////////////
    //////////////// ORG FROM DB ///////////////
    ////////////////////////////////////////////

    'org_from_db': {
        'orgId': 1,
        'org': 'octocat',
        'token': 'testToken',
        'gist': 'https://gist.github.com/aa5a315d61ae9438b18d',
        'isRepoExcluded'() {

            return false;

        }
    },
    'org_from_db_with_excluded_patterns': {
        'orgId': 1,
        'org': 'octocat',
        'token': 'testToken',
        'gist': 'https://gist.github.com/aa5a315d61ae9438b18d',
        'excludePattern': 'foo,bar,baz',
        'allowListPattern': '',
    },
    'org_from_db_with_empty_excluded_patterns': {
        'orgId': 1,
        'org': 'octocat',
        'token': 'testToken',
        'gist': 'https://gist.github.com/aa5a315d61ae9438b18d',
        'excludePattern': '',
    },

    ////////////////////////////////////////////
    /////////////////// REPO ///////////////////
    ////////////////////////////////////////////
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
        'fork': false,
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
        },
        'subscribers_count': 42,
        'organization': {
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
            'type': 'Organization',
            'site_admin': false
        },
        'parent': {
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
        },
        'source': {
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


    ////////////////////////////////////////////
    /////////////////// REPOS //////////////////
    ////////////////////////////////////////////
    'repos': [{
        'id': 1296269,
        'owner': {
            'login': 'octocat',
            'id': 1,
            'html_url': 'https://github.com/octocat',
            'type': 'User',
            'site_admin': false
        },
        'name': 'Hello-World',
        'full_name': 'octocat/Hello-World',
        'description': 'This your first repo!',
        'private': false,
        'fork': false,
        'url': 'https://api.github.com/repos/octocat/Hello-World',
        'html_url': 'https://github.com/octocat/Hello-World',
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
    }, {
        'id': 2,
        'owner': {
            'login': 'login'
        },
        'name': 'test_repo',
        'permissions': {
            'admin': false,
            'push': true,
            'pull': true
        }
    }],

    ////////////////////////////////////////////
    /////////////////// COMMIT /////////////////
    ////////////////////////////////////////////
    'commit': [{
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
        'commit': {
            'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'author': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'committer': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'message': 'Fix all the bugs',
            'tree': {
                'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
                'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
            },
            'comment_count': 0
        },
        'author': {
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
        'committer': {
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
        'parents': [{
            'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        }]
    }],

    ////////////////////////////////////////////
    //////////// COMMIT DONE BY BOT ////////////
    ////////////////////////////////////////////
    'commit_done_by_bot': [{
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
        'commit': {
            'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'author': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'committer': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'message': 'Fix all the bugs',
            'tree': {
                'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
                'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
            },
            'comment_count': 0
        },
        'author': {
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
        'committer': {
            'login': 'web-flow',
            'id': 2,
            'gravatar_id': '',
            'url': 'https://api.github.com/users/web-flow',
            'html_url': 'https://github.com/web-flow',
            'followers_url': 'https://api.github.com/users/web-flow/followers',
            'following_url': 'https://api.github.com/users/web-flow/following{/other_user}',
            'gists_url': 'https://api.github.com/users/web-flow/gists{/gist_id}',
            'starred_url': 'https://api.github.com/users/web-flow/starred{/owner}{/repo}',
            'subscriptions_url': 'https://api.github.com/users/web-flow/subscriptions',
            'organizations_url': 'https://api.github.com/users/web-flow/orgs',
            'repos_url': 'https://api.github.com/users/web-flow/repos',
            'events_url': 'https://api.github.com/users/web-flow/events{/privacy}',
            'received_events_url': 'https://api.github.com/users/web-flow/received_events',
            'type': 'User',
            'site_admin': false
        },
        'parents': [{
            'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        }]
    }],

    ////////////////////////////////////////////
    /////////////////// COMMITS ////////////////
    ////////////////////////////////////////////
    'commits': [{
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
        'commit': {
            'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'author': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'committer': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'message': 'Fix all the bugs',
            'tree': {
                'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
                'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
            },
            'comment_count': 0
        },
        'author': {
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
        'committer': {
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
        'parents': [{
            'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        }]
    }, {
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
        'commit': {
            'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'author': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'committer': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'message': 'Fix all the bugs',
            'tree': {
                'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
                'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
            },
            'comment_count': 0
        },
        'author': {
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
        'committer': {
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
        'parents': [{
            'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        }]
    }, {
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
        'commit': {
            'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'author': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'committer': {
                'name': 'Monalisa Octocat',
                'email': 'support@github.com',
                'date': '2011-04-14T16:00:49Z'
            },
            'message': 'Fix all the bugs',
            'tree': {
                'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
                'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
            },
            'comment_count': 0
        },
        'author': {
            'login': 'octocat2',
            'id': 1,
            'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
            'gravatar_id': '',
            'url': 'https://api.github.com/users/octocat2',
            'html_url': 'https://github.com/octocat2',
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
        'committer': {
            'login': 'octocat2',
            'id': 1,
            'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
            'gravatar_id': '',
            'url': 'https://api.github.com/users/octocat2',
            'html_url': 'https://github.com/octocat2',
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
        'parents': [{
            'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
        }]
    }],

    ////////////////////////////////////////////
    ////////// COMMITS WITHOUT USER ////////////
    ////////////////////////////////////////////

    'commit_with_no_user': [{
        'sha': '0b0f859cb34ccc39c038376a58b612a9574d7d55',
        'commit': {
            'author': {
                'name': 'Anton Kharitonoff',
                'email': 'ak@gmail.com',
                'date': '2015-08-14T12:15:42Z'
            },
            'committer': {
                'name': 'Anton Kharitonoff',
                'email': 'ak@gmail.com',
                'date': '2015-08-14T12:15:42Z'
            },
            'message': 'some more changes',
            'tree': {
                'sha': '297200be0c1886e8ea6185ae71eaa3d8708f53b4',
                'url': 'https://api.github.com/repos/KharitonOff/cla3/git/trees/297200be0c1886e8ea6185ae71eaa3d8708f53b4'
            },
            'url': 'https://api.github.com/repos/KharitonOff/cla3/git/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55',
            'comment_count': 0
        },
        'url': 'https://api.github.com/repos/KharitonOff/cla3/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55',
        'html_url': 'https://github.com/KharitonOff/cla3/commit/0b0f859cb34ccc39c038376a58b612a9574d7d55',
        'comments_url': 'https://api.github.com/repos/KharitonOff/cla3/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55/comments',
        'author': null,
        'committer': null,
        'parents': [{
            'sha': 'b43123ef4c5d862cd57aabf99b53e8d68c7eac85',
            'url': 'https://api.github.com/repos/KharitonOff/cla3/commits/b43123ef4c5d862cd57aabf99b53e8d68c7eac85',
            'html_url': 'https://github.com/KharitonOff/cla3/commit/b43123ef4c5d862cd57aabf99b53e8d68c7eac85'
        }]
    }],

    ////////////////////////////////////////////
    //////////////// REPO FROM DB //////////////
    ////////////////////////////////////////////

    'repo_from_db': {
        'repoId': 1296269,
        'owner': 'octocat',
        'repo': 'Hello-World',
        'token': 'testToken',
        'gist': 'https://gist.github.com/aa5a315d61ae9438b18d'
    },

    ////////////////////////////////////////////
    //////////////// SINGLE GIST ///////////////
    ////////////////////////////////////////////
    'gist': {
        'url': 'https://api.github.com/gists/aa5a315d61ae9438b18d',
        'forks_url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/forks',
        'commits_url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/commits',
        'id': 'aa5a315d61ae9438b18d',
        'description': 'description of gist',
        'public': true,
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
        'user': null,
        'files': {
            'metadata': {
                'filename': 'meta',
                'type': 'text/plain',
                'language': null,
                'raw_url': 'https://gist.githubusercontent.com/KharitonOff/96ef0a16f11c8f11b41c/raw/e226bc4d854a1ffbbb4060138a673ed93ba16f45/meta',
                'size': 424,
                'truncated': false,
                'content': '{"name": {"type": "string", "githubKey": "name"},"email": { "type": "string", "githubKey": "email"},"age": { "description": "Age in years", "type": "integer", "minimum": 0}}'
            },
            'ring.erl': {
                'size': 932,
                'raw_url': 'https://gist.githubusercontent.com/raw/365370/8c4d2d43d178df44f4c03a7f2ac0ff512853564e/ring.erl',
                'type': 'text/plain',
                'language': 'Erlang',
                'truncated': false,
                'content': 'contents of gist'
            }
        },
        'truncated': false,
        'comments': 0,
        'comments_url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/comments/',
        'html_url': 'https://gist.github.com/aa5a315d61ae9438b18d',
        'git_pull_url': 'https://gist.github.com/aa5a315d61ae9438b18d.git',
        'git_push_url': 'https://gist.github.com/aa5a315d61ae9438b18d.git',
        'created_at': '2010-04-14T02:15:15Z',
        'updated_at': '2011-06-20T11:34:15Z',
        'forks': [{
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
            'url': 'https://api.github.com/gists/dee9c42e4998ce2ea439',
            'id': 'dee9c42e4998ce2ea439',
            'created_at': '2011-04-14T16:00:49Z',
            'updated_at': '2011-04-14T16:00:49Z'
        }],
        'history': [{
            'url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/57a7f021a713b1c5a6a199b54cc514735d2d462f',
            'version': '57a7f021a713b1c5a6a199b54cc514735d2d462f',
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
            'change_status': {
                'deletions': 0,
                'additions': 180,
                'total': 180
            },
            'committed_at': '2010-04-14T02:15:15Z'
        }]
    },
    ////////////////////////////////////////////
    //////////////// PULL REQUEST //////////////
    ////////////////////////////////////////////
    'pull_request': {
        'id': 1,
        'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
        'commits_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits',
        'number': 1347,
        'state': 'open',
        'title': 'new-feature',
        'body': 'Please pull these awesome changes',
        'assignee': {
            'login': 'octocat',
            'id': 1
        },
        'milestone': {},
        'locked': false,
        'created_at': '2011-01-26T19:01:12Z',
        'updated_at': '2011-01-26T19:01:12Z',
        'closed_at': '2011-01-26T19:01:12Z',
        'merged_at': '2011-01-26T19:01:12Z',
        'head': {
            'label': 'new-topic',
            'ref': 'new-topic',
            'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
            'user': {
                'login': 'forkOwner',
                'id': 1
            },
            'repo': {
                'id': 1296269,
                'owner': {
                    'login': 'forkOwner',
                    'id': 1
                },
                'name': 'Hello-World',
                'full_name': 'forkOwner/Hello-World',
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
                'id': 1
            },
            'repo': {
                'id': 1296269,
                'owner': {
                    'login': 'octocat',
                    'id': 1
                },
                'name': 'Hello-World',
                'full_name': 'octocat/Hello-World',
                'description': 'This your first repo!',
                'permissions': {
                    'admin': false,
                    'push': false,
                    'pull': true
                }
            }
        },
        '_links': {
        },
        'user': {
            'login': 'octocat',
            'id': 1
        },
        'merge_commit_sha': 'e5bd3914e2e596debea16f433f57875b5b90bcd6',
        'merged': false,
        'mergeable': true,
        'merged_by': {
        },
        'comments': 10,
        'commits': 3,
        'additions': 100,
        'deletions': 3,
        'changed_files': 5
    },

    ////////////////////////////////////////////
    //////////////// GRAPH QL //////////////////
    ////////////////////////////////////////////

    'graphqlPRCommitters': {
        'data': {
            'repository': {
                'pullRequest': {
                    'commits': {
                        'totalCount': 2,
                        'edges': [
                            {
                                'node': {
                                    'commit': {
                                        'author': {
                                            'email': 'octocat@users.noreply.github.com',
                                            'name': 'octocat',
                                            'user': {
                                                'id': 'MDQ6VXNlcjg5Mjc5Nzg=',
                                                'login': 'octocat'
                                            }
                                        },
                                        'committer': {
                                            'user': {
                                                'id': 'MDQ6VXNlcjg5Mjc5Nzg=',
                                                'login': 'octocat'
                                            },
                                            'email': 'octocat@users.noreply.github.com',
                                            'name': 'octocat'
                                        }
                                    }
                                },
                                'cursor': 'MQ=0'
                            },
                            {
                                'node': {
                                    'commit': {
                                        'author': {
                                            'user': {
                                                'id': '123',
                                                'login': 'testUser'
                                            },
                                            'email': 'testUser@users.noreply.github.com',
                                            'name': 'testUser'
                                        },
                                        'committer': {
                                            'email': 'octocat@users.noreply.github.com',
                                            'name': 'octocat',
                                            'user': {
                                                'id': 'MDQ6VXNlcjg5Mjc5Nzg=',
                                                'login': 'octocat'
                                            }
                                        }
                                    }
                                },
                                'cursor': 'MQ=='
                            }
                        ],
                        'pageInfo': {
                            'endCursor': 'MQ==',
                            'hasNextPage': false
                        }
                    }
                }
            }
        }
    },

    'graphqlUserOrgs': {
        'data': {
            'user': {
                'organizations': {
                    'edges': [
                        {
                            'cursor': 'Y3Vyc29yOnYyOpHOAHb2wg==',
                            'node': {
                                'login': 'org1',
                                'name': 'Org 1',
                                'id': 'graphqlid1',
                                'databaseId': '1',
                                'avatarUrl': 'https://avatars2.githubusercontent.com/u/7796418?v=4',
                                'viewerCanAdminister': false
                            }
                        },
                        {
                            'cursor': 'Y3Vyc29yOnYyOpHOAJEA8w==',
                            'node': {
                                'login': 'org2',
                                'name': 'Org 2',
                                'id': 'graphqlid2',
                                'databaseId': '2',
                                'avatarUrl': 'https://avatars1.githubusercontent.com/u/9502963?v=4',
                                'viewerCanAdminister': true
                            }
                        },
                        {
                            'cursor': 'Y3Vyc29yOnYyOpHOAJIbrg==',
                            'node': {
                                'login': 'org3',
                                'name': 'Org 3',
                                'id': 'graphqlid3',
                                'databaseId': '3',
                                'avatarUrl': 'https://avatars0.githubusercontent.com/u/9575342?v=4',
                                'viewerCanAdminister': true
                            }
                        }
                    ],
                    'pageInfo': {
                        'endCursor': 'Y3Vyc29yOnYyOpHOAJIbrg==',
                        'hasNextPage': false
                    }
                }
            }
        }
    }


};

module.exports = {
    data: testData
};

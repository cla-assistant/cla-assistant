/*eslint no-unused-expressions: "off", no-empty-function: "off"*/
/*global angular, describe, xit, it, beforeEach, afterEach*/

describe('Home Controller', function () {
    var scope, httpBackend, createCtrl, homeCtrl, $HUB, $RAW, $RPCService, _timeout;

    var testDataRepos = [{
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
        'permissions': {
            'admin': false,
            'push': true,
            'pull': true
        }
    }, {
        id: 123,
        owner: {
            login: 'orgOwner'
        },
        permissions: {
            admin: false,
            push: true,
            pull: true
        }
    }, {
        id: 456,
        owner: {
            login: 'orgOwner'
        },
        permissions: {
            admin: false,
            push: false,
            pull: true
        }
    }];

    var testDataGists = [{
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
            'ring.erl': {
                'size': 932,
                'raw_url': 'https://gist.githubusercontent.com/raw/365370/8c4d2d43d178df44f4c03a7f2ac0ff512853564e/ring.erl',
                'type': 'text/plain',
                'truncated': false,
                'language': 'Erlang'
            }
        },
        'comments': 0,
        'comments_url': 'https://api.github.com/gists/aa5a315d61ae9438b18d/comments/',
        'html_url': 'https://gist.github.com/aa5a315d61ae9438b18d',
        'git_pull_url': 'https://gist.github.com/aa5a315d61ae9438b18d.git',
        'git_push_url': 'https://gist.github.com/aa5a315d61ae9438b18d.git',
        'created_at': '2010-04-14T02:15:15Z',
        'updated_at': '2011-06-20T11:34:15Z'
    }];

    var testDataOrgs = [{
        'id': '1',
        'login': 'org1',
        'name': 'Org 1',
        'avatarUrl': 'https://avatars2.githubusercontent.com/u/7796418?v=4',
        'viewerCanAdminister': true
    }, {
        'id': '2',
        'login': 'org2',
        'name': 'Org 2',
        'avatarUrl': 'https://avatars2.githubusercontent.com/u/7796418?v=4',
        'viewerCanAdminister': true
    }];

    var calledApi;
    var expRes;
    var expErr;
    var getAllReposData;
    var getAllReposError;
    var rpcRepoGetAllData;
    var rpcRepoGetAllError;
    var rpcRepoCreate;

    beforeEach(angular.mock.module('ngAnimateMock'));
    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function ($injector, $rootScope, $controller, _$HUB_, _$RPCService_, _$RAW_, $q, $timeout) {
        $HUB = _$HUB_;
        $RAW = _$RAW_;
        _timeout = $timeout;
        $RPCService = _$RPCService_;
        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();

        calledApi = {
            RPC: {},
            HUB: {}
        };

        expRes = {
            RPC: {},
            HUB: {
                getUser: {
                    value: {
                        login: 'login'
                    },
                    meta: {
                        scopes: 'user:email, repo, repo:status, read:repo_hook, write:repo_hook, read:org'
                    }
                }
            }
        };
        expErr = {
            RPC: {},
            HUB: {}
        };

        var hubCall = $HUB.call;
        sinon.stub($HUB, 'call', function (obj, fun, args, cb) {
            calledApi.HUB[obj] = calledApi.HUB[obj] ? calledApi.HUB[obj] : {};
            calledApi.HUB[obj][fun] = true;
            var response = {};
            var error = null;
            if (error) {
                cb(error);

                return response;
            }

            if (obj === 'gists' && fun === 'getAll') {
                response.value = testDataGists.concat(
                    [{
                        html_url: 'https://gist.github.com/gistId',
                        files: {
                            'file.txt': {
                                filename: 'file1'
                            }
                        }
                    }]);
            } else if (obj === 'users' && fun === 'getOrgs') {
                response.value = expRes.HUB ? expRes.HUB.getOrgs : testDataOrgs;
            } else if (obj === 'repos' && fun === 'getAll') {
                response = getAllReposData || {
                    value: testDataRepos
                };
                error = getAllReposError ? getAllReposError : null;
                args.affiliation.indexOf('owner').should.be.above(-1);
                args.affiliation.indexOf('organization_member').should.be.above(-1);
            } else if (obj === 'users' && fun === 'getAuthenticated') {
                response = expRes.HUB.getUser;
                error = expErr.HUB.getUser || null;
            } else {
                return hubCall(obj, fun, args, cb);
            }

            if (typeof cb === 'function') {
                cb(error, response);
            }

            return response;
        });

        var rpcCall = $RPCService.call;
        sinon.stub($RPCService, 'call', function (o, f, args, cb) {
            calledApi.RPC[o] = calledApi.RPC[o] ? calledApi.RPC[o] : {};
            calledApi.RPC[o][f] = true;
            var response;
            var error;
            var deferred = $q.defer();
            if (o === 'repo' && f === 'getAll') {
                args.set[0].repoId.should.be.ok;
                response = rpcRepoGetAllData || {
                    value: [{
                        repo: 'Hello-World',
                        owner: 'octocat',
                        gist: 1234
                    }]
                };
                error = rpcRepoGetAllError ? rpcRepoGetAllError : null;
            } else if (o === 'repo' && f === 'create') {
                args.repoId.should.be.equal(123);
                args.gist.should.be.equal(homeCtrl.scope.selected.gist.url);

                response = rpcRepoCreate && !rpcRepoCreate.error ? rpcRepoCreate : {
                    value: true
                };
                error = rpcRepoCreate && rpcRepoCreate.error ? rpcRepoCreate.error : null;
            } else if (o === 'repo' && f === 'remove') {
                response = expRes.RPC.repo && expRes.RPC.repo.remove ? expRes.RPC.repo.remove : {
                    value: true
                };
            } else if (o === 'org' && f === 'create') {
                response = expRes.RPC.org && expRes.RPC.org.create ? expRes.RPC.org.create : {
                    value: true
                };
            } else if (o === 'org' && f === 'getForUser') {
                response = expRes.RPC.org && expRes.RPC.org.getForUser ? expRes.RPC.org.getForUser : {
                    value: []
                };
                deferred.resolve(response);

                return deferred.promise;
            } else if (o === 'org' && f === 'getGHOrgsForUser') {
                response = expRes.RPC.org && expRes.RPC.org.getGHOrgForUser ? expRes.RPC.org.getGHOrgForUser : {
                    value: testDataOrgs
                };
                if (expErr.RPC.org && expErr.RPC.org.getGHOrgForUser) {
                    deferred.reject(expErr.RPC.org.getGHOrgForUser);
                } else {
                    deferred.resolve(response);
                }

                return deferred.promise;
            } else if (o === 'org' && f === 'remove') {
                response = expRes.RPC.org && expRes.RPC.org.remove ? expRes.RPC.org.remove : {
                    value: true
                };
            } else {
                return rpcCall(o, f, args, cb);
            }

            if (cb) {
                cb(error, response);
            } else {
                if (error) {
                    deferred.reject(error);
                } else {
                    deferred.resolve(response);
                }

                return deferred.promise;
            }
        });

        var rawGet = $RAW.get;
        sinon.stub($RAW, 'get', function (url, token) {
            if (url.indexOf('count') > -1) {
                return {
                    then: function () { }
                };
            } else if (url.indexOf('/static/cla-assistant.json') > -1) {
                return {
                    then: function (cb) {
                        cb({
                            data: {
                                'default-cla': [{
                                    name: 'first default cla',
                                    url: 'https://gist.github.com/gistId'
                                }]
                            }
                        });
                    }
                };
            }

            return rawGet(url, token);
        });

        createCtrl = function () {
            var ctrl = $controller('HomeCtrl', {
                $scope: scope
            });
            ctrl.scope = scope;

            return ctrl;
        };

        // homeCtrl = createCtrl();
        // httpBackend.when('POST', '/api/github/direct_call', {
        //     url: 'https://api.github.com/gists?per_page=100'
        // }).respond(testDataGists.data.concat(
        //     [{
        //         html_url: 'https://gist.github.com/gistId',
        //         files: {
        //             'file.txt': {
        //                 filename: 'file1'
        //             }
        //         }
        //     }]));
        // httpBackend.when('GET', '/static/cla-assistant.json').respond({
        //     data: {
        //         'default-cla': [{
        //             name: 'first default cla',
        //             url: 'https://gist.github.com/gistId'
        //         }]
        //     }
        // });

    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
        homeCtrl = {};
        // homeCtrl.scope.selected = {};

        $RAW.get.restore();
        $RPCService.call.restore();
        getAllReposData = undefined;
        getAllReposError = undefined;
        rpcRepoGetAllData = undefined;
        rpcRepoGetAllError = undefined;
    });

    it('should get user repos and mix claRepos data with repos data if user has admin rights', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.repos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.user.value.admin).should.be.equal(true);
        (homeCtrl.scope.claRepos[0].fork).should.be.equal(testDataRepos[0].fork);
    });

    it('should get claOrgs for user if user has admin rights', function () {
        expRes.HUB.getUser.meta.scopes += ', admin:org_hook';
        expRes.RPC.org = {
            getForUser: {
                value: [{
                    orgId: '1',
                    org: 'org1'
                }]
            }
        };

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.claOrgs.length).should.be.equal(1);
        (homeCtrl.scope.claOrgs[0].avatarUrl).should.be.equal(testDataOrgs[0].avatarUrl);
    });

    it('should get only github orgs where user has admin rights, normal membership is not enough', function () {
        expRes.HUB.getUser.meta.scopes += ', admin:org_hook';
        expRes.RPC.org = {
            getForUser: {
                value: [{
                    orgId: '1'
                }]
            }
        };

        homeCtrl = createCtrl();
        _timeout.flush();

        ($RPCService.call.calledWithMatch('org', 'getForUser')).should.be.equal(true);
        (homeCtrl.scope.claOrgs.length).should.be.equal(1);
    });

    it('should get github repos even if user has NO github orgs', function () {
        expRes.HUB.getUser.meta.scopes += ', admin:org_hook';
        expRes.RPC.org = {
            getForUser: {
                value: []
            }
        };
        expErr.RPC = {
            org: {
                getGHOrgForUser: 'no orgs'
            }
        };

        homeCtrl = createCtrl();
        _timeout.flush();

        ($RPCService.call.calledWithMatch('org', 'getForUser')).should.be.equal(false);
        ($RPCService.call.calledWithMatch('org', 'getGHOrgsForUser')).should.be.equal(true);
        (homeCtrl.scope.repos.length).should.be.equal(2);
    });

    it('should get claOrgs and github orgs but not add them to reposAndOrgs array if user has no admin:org_hook rights', function () {
        expRes.RPC.org = {
            getForUser: {
                value: [{
                    orgId: 1
                }]
            }
        };

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.reposAndOrgs.length).should.be.equal(2);
    });

    it('should check whether the user has admin:org_hook right', function () {
        expRes.HUB.getUser.meta.scopes += ', admin:org_hook';

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.user.value.org_admin).should.be.equal(true);
        (homeCtrl.scope.reposAndOrgs.length).should.be.equal(4);
    });

    it('should not get user orgs if the user has no admin:org_hook right', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.user.value.org_admin).should.be.equal(false);
        (homeCtrl.scope.orgs).should.not.be.equal(testDataOrgs);
        (homeCtrl.scope.reposAndOrgs.length).should.be.equal(2);
    });

    it('should get user orgs and combine them with repos in one list', function () {
        expRes.HUB.getUser.meta.scopes += ', admin:org_hook';

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.orgs.length).should.be.equal(testDataOrgs.length);
        (homeCtrl.scope.repos.length).should.be.equal(2);
        (homeCtrl.scope.reposAndOrgs.length).should.be.equal(4);
    });

    it('should group orgs and repos', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.groupOrgs(testDataOrgs[0])).should.be.equal('Organisations');
        (homeCtrl.scope.groupOrgs(testDataRepos[0])).should.not.be.equal('Organisations');
    });

    // xit('should get more repos if there are more to load', function() {
    //     var getMoreCalled = false;
    //     getAllReposData = {
    //         value: testDataRepos.data,
    //         hasMore: true,
    //         getMore: function() {
    //             getMoreCalled = true;
    //         }
    //     };

    //     homeCtrl = createCtrl();
    //     httpBackend.flush();

    //     (getMoreCalled).should.be.equal(true);
    // });

    // it('should update scope.repos when all repos loaded first', function() {
    //     getAllReposData = {
    //         value: testDataRepos.data,
    //         hasMore: true,
    //         getMore: function() {
    //             this.hasMore = false;
    //             this.value.push({
    //                 id: 123,
    //                 name: 'test',
    //                 owner: {
    //                     login: 'octocat'
    //                 },
    //                 permissions: {
    //                     admin: false,
    //                     push: true,
    //                     pull: true
    //                 }
    //             });
    //             this.cb(null, this);
    //         }
    //     };

    //     homeCtrl = createCtrl();
    //     httpBackend.flush();

    //     (scope.repos.length).should.be.equal(3);
    // });

    it('should not load user repos if github call failed', function () {
        getAllReposError = 'GitHub call failed';

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.repos.length).should.be.equal(0);
        ($RPCService.call.calledWithMatch('repo', 'getAll')).should.be.equal(false);
    });

    it('should not load user repos if db call failed', function () {
        rpcRepoGetAllError = 'Could not find entries on DB';

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.claRepos.length).should.be.equal(0);
    });

    it('should not load user`s repos if he is not an admin', function () {
        expRes.HUB.getUser.meta.scopes = 'user:email';
        httpBackend.resetExpectations();

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.repos.length).should.be.equal(0);
        (homeCtrl.scope.user.value.admin).should.be.equal(false);
    });

    it('should not try to get linked repos if user has no repos in GitHub', function () {
        getAllReposData = {
            value: []
        };

        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.repos.length).should.be.equal(0);
    });

    it('should create repo entry on link action', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        homeCtrl.scope.repos = [{
            name: 'myRepo',
            owner: {
                login: 'login'
            },
            fork: true
        }];

        homeCtrl.scope.selected.item = {
            id: 123,
            name: 'myRepo',
            full_name: 'login/myRepo',
            owner: {
                login: 'login'
            }
        };
        homeCtrl.scope.selected.gist = {
            url: 'https://gist.github.com/gistId'
        };

        rpcRepoCreate = {
            value: {
                repo: 'myRepo',
                owner: 'login',
                repoId: 123
            }
        };

        homeCtrl.scope.link();
        _timeout.flush();

        (homeCtrl.scope.claRepos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos[1].repo).should.be.equal('myRepo');
        (homeCtrl.scope.claRepos[1].active).should.be.ok;
        (homeCtrl.scope.claRepos[1].fork).should.be.ok;
    });

    it('should link organisation', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        homeCtrl.scope.orgs = testDataOrgs;
        homeCtrl.scope.selected.item = testDataOrgs[0];
        homeCtrl.scope.selected.gist = {
            url: 'https://gist.github.com/gistId'
        };
        expRes.RPC.org = {
            create: {
                value: {
                    orgId: testDataOrgs[0].id,
                    org: testDataOrgs[0].login
                }
            }
        };

        homeCtrl.scope.link();
        _timeout.flush();

        (homeCtrl.scope.claOrgs.length).should.be.equal(1);
        (homeCtrl.scope.claOrgs[0].avatarUrl).should.be.equal(testDataOrgs[0].avatarUrl);
        // (homeCtrl.scope.claRepos[1].active).should.be.ok;
        // (homeCtrl.scope.claRepos[1].fork).should.be.ok;
    });

    it('should remove repo from claRepos list from github if create failed on backend', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        homeCtrl.scope.repos = [{
            name: 'myRepo',
            owner: {
                login: 'login'
            },
            fork: true
        }];

        homeCtrl.scope.selected.gist = {
            url: 'https://gist.github.com/gistId'
        };
        homeCtrl.scope.selected.item = {
            id: 123,
            name: 'myRepo',
            full_name: 'login/myRepo',
            owner: {
                login: 'login'
            }
        };

        rpcRepoCreate = {
            value: false
        };

        homeCtrl.scope.link();

        (homeCtrl.scope.claRepos.length).should.be.equal(1);
    });

    it('should cleanup if create failed', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        homeCtrl.scope.selected.gist = {
            url: 'https://gist.github.com/gistId'
        };
        homeCtrl.scope.selected.item = {
            id: 123,
            name: 'myRepo',
            full_name: 'login/myRepo',
            owner: {
                login: 'login'
            }
        };

        rpcRepoCreate = {
            error: {
                message: 'any other error'
            }
        };

        homeCtrl.scope.link();
        _timeout.flush();

        (homeCtrl.scope.errorMsg[0]).should.not.be.equal('This repository is already set up.');
    });

    it('should delete db entry on remove for linked org', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        var org = {
            org: 'octocat',
            orgId: 1,
            gist: 'https://gist.github.com/myRepo/2',
        };
        homeCtrl.scope.claOrgs = [org];
        homeCtrl.scope.remove(org);

        ($RPCService.call.calledWithMatch('org', 'remove')).should.be.equal(true);
        (homeCtrl.scope.claOrgs.length).should.be.equal(0);
    });

    it('should delete db entry on remove for linked repo', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        var repo = {
            repo: 'myRepo',
            repoId: 1,
            owner: 'login',

            gist: 'https://gist.github.com/myRepo/2',
            active: true
        };
        homeCtrl.scope.claRepos = [repo];
        homeCtrl.scope.remove(repo);

        ($RPCService.call.calledWithMatch('repo', 'remove')).should.be.equal(true);
        ($RPCService.call.calledWithMatch('repo', 'getAll')).should.be.equal(true);
    });

    it('should load gist files of the user', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        (homeCtrl.scope.gists.length).should.be.equal(3);
        (homeCtrl.scope.gists[0].name).should.be.equal('first default cla');
        (homeCtrl.scope.gists[1].name).should.be.equal('ring.erl');
        (homeCtrl.scope.gists[2].name).should.be.equal('file1');
    });

    it('should validate gist url', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        var invalidUrls = ['https://google.com', '', undefined];

        invalidUrls.forEach(function (url) {
            homeCtrl.scope.isValid(url).should.not.be.ok;
        });
    });

    it('should identify default gist url from all gists', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        var sapClaGist = {
            name: 'first default cla',
            url: 'https://gist.github.com/gistId'
        };
        (homeCtrl.scope.groupDefaultCla(sapClaGist)).should.be.equal('Default CLAs');

        var anyOtherGist = {
            name: 'any name',
            url: 'https://gist.github.com/gitID'
        };
        (homeCtrl.scope.groupDefaultCla(anyOtherGist)).should.not.be.equal('Default CLAs');
    });

    it('should load default cla files', function () {
        homeCtrl = createCtrl();
        _timeout.flush();

        homeCtrl.scope.defaultClas.length.should.be.equal(1);
        homeCtrl.scope.defaultClas[0].name.should.be.equal('first default cla');
    });

    it('should clear selected repo on clear function', function () {
        homeCtrl = createCtrl();
        _timeout.flush();
        var ev = {
            stopPropagation: function () { }
        };
        homeCtrl.scope.selected.item = {
            name: 'any test repo'
        };

        homeCtrl.scope.clear(ev, 'repo');
        (!homeCtrl.scope.selected.item).should.be.ok;
    });

    it('should clear selected cla on clear function', function () {
        homeCtrl = createCtrl();
        _timeout.flush();
        var ev = {
            stopPropagation: function () { }
        };
        homeCtrl.scope.selected.gist = {
            url: 'any_test_url'
        };

        homeCtrl.scope.clear(ev, 'gist');
        (!homeCtrl.scope.selected.gist).should.be.ok;
    });

    it('should NOT load counts if user is logged', function () {
        homeCtrl = createCtrl();
        _timeout.flush();
        ($RAW.get.calledWith('/count/clas')).should.be.equal(false);
    });

    it('should load counts if user not logged', function () {
        expRes.HUB.getUser = null;
        expErr.HUB.getUser = 'Authentication required';

        homeCtrl = createCtrl();
        homeCtrl.scope.showActivity = true;
        _timeout.flush();

        ($RAW.get.calledWith('/count/clas')).should.be.equal(true);
    });
});

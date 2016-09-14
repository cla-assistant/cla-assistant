/*jshiint expr:true*/
/*global angular, sinon, describe, xit, it, beforeEach, afterEach*/

describe('Settings Controller', function () {

    var scope, httpBackend, createCtrl, settingsCtrl, stateParams, modal, RPC, HUB, calledApi, $timeout;
    var testResp = {cla: {}, repo: {}, webhook: {}};
    var testErr = {cla: {}, repo: {}, webhook: {}};

    var testGistData = {
        'url': 'https://api.github.com/gists/10a5479e1ab38ec63566',
        'owner': {
            'login': 'octocat'
        },
        'user': null,
        'files': {
            'metadata': {
                'content': ''
            },
            'ring.erl': {
                'content': 'contents of gist'
            }
        },
        'created_at': '2010-04-14T02:15:15Z',
        'updated_at': '2014-05-14T02:15:15Z',
        'history': [{
            'url': 'https://api.github.com/gists/9cea613eaae831f8aa62/57a7f021a713b1c5a6a199b54cc514735d2d462f',
            'version': '57a7f021a713b1c5a6a199b54cc514735d2d462f',
            'user': {
                'login': 'octocat'
            },
            'change_status': {
                'deletions': 2,
                'additions': 18,
                'total': 20
            },
            'committed_at': '2014-05-14T02:15:15Z'
        }, {
            'url': 'https://api.github.com/gists/9cea613eaae831f8aa62/57a7f021a713b1c5a6a199b54cc514735d2d4123',
            'version': '57a7f021a713b1c5a6a199b54cc514735d2d4123',
            'user': {
                'login': 'octocat'
            },
            'change_status': {
                'deletions': 0,
                'additions': 180,
                'total': 180
            },
            'committed_at': '2010-04-14T02:15:15Z'
        }]
    };

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function ($injector, $rootScope, $controller, $modal, $RPC, $HUB, $q, _$timeout_) {

        RPC = $RPC;
        HUB = $HUB;
        $timeout = _$timeout_;

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();
        modal = $modal;
        scope.user = {
            value: {
                admin: false
            }
        };
        stateParams = {
            user: 'login',
            repo: 'myRepo'
        };
        scope.item = {
            repoId: 123,
            repo: 'myRepo',
            owner: 'login',
            gist: 'https://gist.github.com/gistId'
        };

        calledApi = {
            RPC: {},
            HUB: {}
        };

        var originalRPCCall = RPC.call;
        sinon.stub(RPC, 'call', function (obj, fun, args, cb) {
            calledApi.RPC[obj] = calledApi.RPC[obj] ? calledApi.RPC[obj] : {};
            calledApi.RPC[obj][fun] = true;
            var response = {};
            var error = testErr[obj] && testErr[obj][fun] ? testErr[obj][fun] : null;
            if (error) {
                cb(error);
                return response;
            }


            if (obj === 'cla' && fun === 'getAll') {
                (!args.orgId && !args.repoId).should.be.equal(false);

                (args.gist.gist_url).should.be.equal(scope.item.gist);
                var resp = args.gist.gist_version ? [{user: 'login' }] : [{
                    user: 'login'
                }, {
                    user: 'user2'
                }];
                error = testErr.cla.getAll || null;
                response.value = testResp.cla.getAll || resp;
            } else if (obj === 'cla' && fun === 'get') {
                response.value = { raw: '<p>cla text</p>', meta: '<p>{ "name": {"type": "string", "title": "Full Name", "githubKey": "name"},"email": {"type": "string","githubKey": "email", "required": "true"},"age": {"description": "Age in years","type": "number","minimum": "0", "required": "true"}}</p>' };
            } else if (obj === 'cla' && fun === 'getGist') {
                (args.repo).should.be.equal(scope.item.repo);
                (args.owner).should.be.equal(scope.item.owner);
                (args.gist.gist_url).should.be.equal(scope.item.gist);

                response.value = testResp.cla.getGist || testGistData;
            } else if (obj === 'webhook' && fun === 'get') {
                response.value = testResp.webhook.get || {active: true};
            } else if (obj === 'webhook' && fun === 'create') {
                response.value = testResp.webhook.create || {active: true};
            } else {
                return originalRPCCall(obj, fun, args, cb);
            }

            if (typeof cb === 'function') {
                cb(error, response);
            }
            return response;
        });

        sinon.stub(HUB, 'call', function (obj, fun, args, cb) {
            calledApi.HUB[obj] = calledApi.HUB[obj] ? calledApi.HUB[obj] : {};
            calledApi.HUB[obj][fun] = true;
            var response = {};
            var error = testErr[obj] && testErr[obj][fun] ? testErr[obj][fun] : null;
            if (error) {
                cb(error);
                return response;
            }

            if (typeof cb === 'function') {
                cb(error, response);
            }
            return response;
        });

        createCtrl = function () {
            var ctrl = $controller('SettingsCtrl', {
                $scope: scope,
                $stateParams: stateParams
            });
            ctrl.scope = scope;

            return ctrl;
        };

        scope.user.value = {
            id: 1,
            login: 'octocat',
            admin: false
        };
        httpBackend.when('GET', '/config').respond({});

    }));

    afterEach(function () {
        RPC.call.restore();
        HUB.call.restore();
        testErr = {cla: {}, repo: {}, webhook: {}};
        testResp = {cla: {}, repo: {}, webhook: {}};
    });

    describe('normaly', function () {
        beforeEach(function () {
            settingsCtrl = createCtrl();
        });

        it('should check whethter the user has admin rights or NOT', function () {
            (settingsCtrl.scope.admin).should.not.be.ok;
        });

        it('should load gistFile on init ', function () {
            (settingsCtrl.scope.loading).should.be.ok;

            $timeout.flush();

            (settingsCtrl.scope.loading).should.not.be.ok;
            (settingsCtrl.scope.gist.url).should.be.equal(testGistData.url);
            (settingsCtrl.scope.item).should.not.be.empty;
            (calledApi.RPC.cla.getGist).should.be.equal(true);
            (calledApi.RPC.cla.getAll).should.be.equal(true);
            (calledApi.RPC.webhook.get).should.be.equal(true);
        });

        it('should get gist file name and store it in scope.gist object, ignore metadata file', function () {
            var gistName = settingsCtrl.scope.getGistName();

            (gistName).should.be.equal('ring.erl');
            (settingsCtrl.scope.gist.fileName).should.be.equal('ring.erl');
        });

        it('should use fileName from scope.gist object if given', function () {
            settingsCtrl.scope.gist.fileName = 'testName';
            var gistName = settingsCtrl.scope.getGistName();

            (gistName).should.be.equal('testName');
            settingsCtrl.scope.gist.fileName = undefined;
        });

        it('should get number of contributors on init', function () {
            $timeout.flush();

            (settingsCtrl.scope.signatures.value.length).should.be.equal(1);
        });

        it('should prepare csv header for custom fields', function () {
            testResp.cla.getAll = [{
                owner: 'octocat',
                repo: 'Hello-World',
                user: 'login',
                gist_url: testGistData.url,
                gist_version: testGistData.history[0].version,
                created_at: '2010-04-16T02:15:15Z',
                org_cla: 'false',
                custom_fields: '{ "name": "Test User", "email": "testEmail" }'
            }];

            settingsCtrl.scope.getContributors(testGistData.history[0].version);
            settingsCtrl.scope.$apply();

            (settingsCtrl.scope.csvHeader.indexOf('Full Name')).should.be.greaterThan(-1);
            (settingsCtrl.scope.csvHeader.indexOf('email')).should.be.greaterThan(-1);
        });

        it('should get all contributors signed this cla', function () {
            testResp.cla.getAll = [{
                owner: 'octocat',
                repo: 'Hello-World',
                user: 'login',
                gist_url: testGistData.url,
                gist_version: testGistData.history[0].version,
                created_at: '2010-04-16T02:15:15Z',
                org_cla: 'false',
                custom_fields: '{ "name": "Test User", "email": "testEmail" }'
            }];

            settingsCtrl.scope.getContributors(testGistData.history[0].version);
            settingsCtrl.scope.$apply();

            (settingsCtrl.scope.contributors[0].name).should.be.equal('Test User');
            (settingsCtrl.scope.contributors[0].email).should.be.equal('testEmail');
        });

        it('should fill custom fields if there are some', function () {
            testResp.cla.getAll = [{
                owner: 'octocat',
                repo: 'Hello-World',
                user: 'login',
                gist_url: testGistData.url,
                gist_version: testGistData.history[0].version,
                created_at: '2010-04-16T02:15:15Z',
                org_cla: 'false'
            }];

            settingsCtrl.scope.getContributors(testGistData.history[0].version);
            settingsCtrl.scope.$apply();

            (settingsCtrl.scope.contributors.length).should.be.equal(1);
            (settingsCtrl.scope.contributors[0].user_name).should.be.equal('login');
            (settingsCtrl.scope.contributors[0].repo_owner).should.be.equal('octocat');
            (settingsCtrl.scope.contributors[0].repo_name).should.be.equal('Hello-World');
            (settingsCtrl.scope.contributors[0].gist_name).should.be.equal('ring.erl');
            (settingsCtrl.scope.contributors[0].gist_url).should.be.equal(testGistData.url);
            (settingsCtrl.scope.contributors[0].gist_version).should.be.equal(testGistData.history[0].version);
            (settingsCtrl.scope.contributors[0].signed_at).should.be.equal('2010-04-16T02:15:15Z');
            (settingsCtrl.scope.contributors[0].org_cla).should.be.equal('false');
        });

        it('should fill all relevant fields for org cla', function () {
            settingsCtrl.scope.item = {
                orgId: 1,
                gist: testGistData.url
            };

            testResp.cla.getAll = [{
                owner: 'octocat',
                repo: 'Hello-World',
                user: 'login',
                gist_url: testGistData.url,
                gist_version: testGistData.history[0].version,
                created_at: '2010-04-16T02:15:15Z',
                org_cla: 'true'
            }];

            settingsCtrl.scope.getContributors(testGistData.history[0].version);
            settingsCtrl.scope.$apply();

            (settingsCtrl.scope.contributors.length).should.be.equal(1);
            (settingsCtrl.scope.contributors[0].user_name).should.be.equal('login');
            (settingsCtrl.scope.contributors[0].repo_owner).should.be.equal('octocat');
            (settingsCtrl.scope.contributors[0].repo_name).should.be.equal('Hello-World');
            (settingsCtrl.scope.contributors[0].gist_name).should.be.equal('ring.erl');
            (settingsCtrl.scope.contributors[0].gist_url).should.be.equal(testGistData.url);
            (settingsCtrl.scope.contributors[0].gist_version).should.be.equal(testGistData.history[0].version);
            (settingsCtrl.scope.contributors[0].signed_at).should.be.equal('2010-04-16T02:15:15Z');
            (settingsCtrl.scope.contributors[0].org_cla).should.be.equal('true');
        });

        it('should get gist from github on getGist function', function () {
            testResp.cla.getGist = {
                id: 'gistId'
            };
            (typeof settingsCtrl.scope.gist.id).should.be.equal('undefined');

            settingsCtrl.scope.getGist();

            (settingsCtrl.scope.gist.id).should.be.equal('gistId');
        });

        describe('on getSignatures', function(){
            it('should get data for linked org', function (it_done) {
                scope.item.repoId = undefined;
                scope.item.orgId = 1;

                testResp.cla.getAll = undefined;

                settingsCtrl.scope.getSignatures(scope.item, 1, function(err, signatures){
                    (calledApi.RPC.cla.getAll).should.be.equal(true);
                    (signatures.value.length).should.be.equal(1);
                    it_done();
                });
            });

            it('should reload data for other gist versions', function (it_done) {
                var args = {
                    repoId: scope.item.repoId,
                    gist: scope.item.gist
                };
                testResp.cla.getAll = undefined;

                settingsCtrl.scope.getSignatures(args, 1, function(err, signatures){
                    (calledApi.RPC.cla.getAll).should.be.equal(true);
                    (signatures.value.length).should.be.equal(1);
                    it_done();
                });
            });
        });

        describe('on validateLinkedItem', function () {
            beforeEach(function () {

                settingsCtrl.scope.gist = {};
                testResp.cla.getGist = {
                    id: 'gistId',
                    url: 'https://gist.github.com/gistId'
                };
            });

            it('should provide a gist version calling getSignatures', function(){
                sinon.spy(scope, 'getSignatures');
                testResp.cla.getGist = testGistData;

                settingsCtrl.scope.validateLinkedItem();
                $timeout.flush();

                (scope.getSignatures.calledWith(scope.item, scope.gist.history[0].version)).should.be.equal(true);
            });

            it('should indicate loading', function () {
                $timeout.flush();
                (settingsCtrl.scope.loading).should.be.equal(false);

                settingsCtrl.scope.validateLinkedItem();

                (settingsCtrl.scope.loading).should.be.equal(true);
                $timeout.flush();
                (settingsCtrl.scope.loading).should.be.equal(false);
            });

            it('should validate repo by checking repo, gist and webhook', function () {
                settingsCtrl.scope.validateLinkedItem();

                $timeout.flush();
                (settingsCtrl.scope.loading).should.not.be.equal(true);
                (settingsCtrl.scope.valid.gist).should.be.equal(true);
                (settingsCtrl.scope.valid.webhook).should.be.equal(true);
            });

            it('should use active flag of webhook to validate it', function () {
                testResp.webhook.get = {active: false};
                settingsCtrl.scope.validateLinkedItem();

                $timeout.flush();
                (settingsCtrl.scope.loading).should.not.be.equal(true);
                (settingsCtrl.scope.valid.gist).should.be.equal(true);
                (settingsCtrl.scope.valid.webhook).should.be.equal(false);
            });
        });

        describe('on recheck', function () {
            it('should call validatePullRequests api', function () {
                settingsCtrl.scope.recheck({
                    repo: 'myRepo',
                    owner: 'login'
                });

                (RPC.call.calledWithMatch('cla', 'validatePullRequests', {repo: 'myRepo', owner: 'login'})).should.be.equal(true);
            });

            it('should get a repo for linked org which should be checked', function () {
                settingsCtrl.scope.recheck({
                    org: 'octocat'
                });

                (RPC.call.calledWithMatch('cla', 'validateOrgPullRequests', {org: 'octocat'})).should.be.equal(true);
            });
        });

        describe('on getReport', function(){
            it('should show list of contributors for the current gist version first', function(){
                sinon.spy(scope, 'getSignatures');
                $timeout.flush();

                settingsCtrl.scope.getReport();

                (scope.getSignatures.calledWith(scope.item, scope.gist.history[0].version)).should.be.equal(true);
            });
            it('should prepare array of contributors for export', function () {
                sinon.stub(modal, 'open', function () {
                    return;
                });
                testResp.cla.getAll = [{
                    user: 'login'
                }];
                $timeout.flush();

                settingsCtrl.scope.getReport();
                settingsCtrl.scope.$apply();

                settingsCtrl.scope.contributors.length.should.be.equal(1);
            });

            it('should call report modal even if there are no signatures', function () {
                testResp.cla.getAll = [];
                createCtrl();
                $timeout.flush();

                sinon.stub(modal, 'open', function () {
                    return;
                });

                settingsCtrl.scope.getReport();

                (modal.open.called).should.be.equal(true);
            });
        });

        describe('on getBadge', function(){
            it('should call modal view', function(){
                createCtrl();
                $timeout.flush();

                sinon.stub(modal, 'open', function () {
                    return;
                });

                settingsCtrl.scope.getBadge();

                (modal.open.called).should.be.equal(true);
            });
        });
    });

    describe('handling errors', function () {
        it('should load gist file only if gist url is given', function () {
            scope.item = {
                repo: 'myRepo',
                owner: 'login',
                gist: ''
            };
            settingsCtrl = createCtrl();

            (!!settingsCtrl.scope.gist.url).should.not.be.ok;
        });

        it('should handle error in getGist function', function () {
            testErr.cla.getGist = 'Error';
            settingsCtrl = createCtrl();

            (!!settingsCtrl.scope.gist.url).should.be.equal(false);
        });
    });
});

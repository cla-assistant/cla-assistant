describe('CLA Controller', function() {

    var scope, rootScope, stateParams, httpBackend, createCtrl, claController;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));
    beforeEach(angular.mock.module('diff-match-patch'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        httpBackend.when('GET', '/config').respond({

        });

        scope = $rootScope.$new();
        rootScope = $rootScope;
        rootScope.user = {};
        stateParams = {user: 'login', repo: 'myRepo'};

        createCtrl = function() {

            var ctrl = $controller('ClaController', {
                $scope: scope,
                $stateParams: stateParams
            });
            ctrl.scope = scope;
            return ctrl;
        };

    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should get CLA text', function() {
        scope.user = null;
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond({raw: '<p>cla text</p>'});
        httpBackend.flush();

        (claController.scope.claText).should.be.ok;
    });

    it('should check whether user has signed CLA already or not', function(){
        rootScope.user.value = {id: 123, login: 'login'};
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        httpBackend.expect('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond({raw: '<p>cla text</p>'});

        httpBackend.flush();

        (claController.scope.signed).should.be.ok;
    });

    it('should check whether user has signed CLA already or NOT', function(){
        rootScope.user.value = {id: 123, login: 'login'};
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        httpBackend.expect('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond({raw: '<p>cla text</p>'});
        httpBackend.expect('POST', '/api/cla/getLastSignature', {repo: stateParams.repo, owner: stateParams.user}).respond({id: 123, gist_url: 'gist_url', gist_version: 'gist_version'});
        httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user, gist: {gist_url: 'gist_url', gist_version: 'gist_version'}}).respond({raw: '<p>cla text</p>'});

        httpBackend.flush();

        (claController.scope.signed).should.not.be.ok;
        (claController.scope.signedCLA.gist_url).should.be.equal('gist_url');
    });

    it('should not load cla if repo does not exist', function(){
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.flush();

        (claController.scope.repoExists).should.not.be.ok;
    });

    it('should check whether user has signed cla even if repo does not exist? ', function(){
        rootScope.user.value = {id: 123, login: 'login'};
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.expect('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.flush();

        (claController.scope.signed).should.not.be.ok;
    });

    it('should generate redirect url if pull request number is given', function(){
        scope.user = null;
        stateParams.pullRequest = 1;
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond({raw: '<p>cla text</p>'});
        httpBackend.flush();

        (claController.scope.redirect).should.be.ok;
    });
});

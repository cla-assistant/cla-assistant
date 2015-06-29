/*jshiint expr:true*/
/*global angular, sinon, describe, xit, it, beforeEach, afterEach*/

angular.module('app');
describe('CLA Controller', function() {
    var scope, _timeout, stateParams, httpBackend, createCtrl, claController, _window, _q, user, repoExists, claSigned, claText, _HUBService;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));
    beforeEach(angular.mock.module(function($provide){
        $provide.value('$window', {location: {href: 'dummy'}});
    }));

    user = {value: {}};

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller, $window, $timeout, $q, $HUBService) {
        // $provide.value($window, {location: {href: 'href'}});
        _window = $window;
        _timeout = $timeout;
        _q = $q;
        _HUBService = $HUBService;

        sinon.stub($HUBService, 'call', function(o, functn, data, cb){
            var deferred = _q.defer();
            deferred.resolve(user);
            cb(null, user);

            return deferred.promise;
        });

        httpBackend = $injector.get('$httpBackend');
        httpBackend.when('GET', '/config').respond({ });

        scope = $rootScope.$new();
        stateParams = {user: 'login', repo: 'myRepo'};

        user.value = {id: 123, login: 'login'};
        user.meta = {scopes: 'user:email, repo, repo:status, read:repo_hook, write:repo_hook, read:org'};
        repoExists = true;
        claSigned = true;
        claText = {raw: '<p>cla text</p>'};

        createCtrl = function() {
            // httpBackend.when('POS  T', '/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond(user);
            httpBackend.when('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(repoExists);
            httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(claSigned);
            httpBackend.when('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond(claText);

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
        _HUBService.call.restore();

    });

    it('should get CLA text', function() {
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.claText).should.be.ok;
    });

    it('should run checks on cla when get user and check repo calls are done', function(){
      claController = createCtrl();
      var claCheckWasCalled = false;
      _HUBService.call.restore();
      sinon.stub(_HUBService, 'call', function(o, functn, data, cb){
          var deferred = _q.defer();
          _timeout(function(){

            cb(null, user);
            deferred.resolve(user);
          }, 10);

          return deferred.promise;
      });

      httpBackend.expect('GET', '/logout?noredirect=true').respond(true);
      httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(function(){
        claCheckWasCalled = true;
        return false;
      });

      httpBackend.flush();

      (claCheckWasCalled).should.not.be.ok;
    });

    it('should not check CLA if user not logged', function(){
        var claCheckWasCalled = false;
        _HUBService.call.restore();
        sinon.stub(_HUBService, 'call', function(o, functn, data, cb){
            var deferred = _q.defer();
            cb('Authentication required', null);
            deferred.reject('Authentication required');

            return deferred.promise;
        });

        claController = createCtrl();

        // httpBackend.expect('POST', '/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond(500, 'Authentication required');
        httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(function(){
          claCheckWasCalled = true;
          return false;
        });

        httpBackend.flush();

        (claCheckWasCalled).should.not.be.ok;
    });

    it('should check whether user has signed CLA already or not and logout user if already signed', function(){
        claController = createCtrl();

        httpBackend.expect('GET', '/logout?noredirect=true').respond(true);

        httpBackend.flush();
        _timeout.flush();

        (_window.location.href).should.be.equal('https://github.com/login/myRepo');
        (claController.scope.signed).should.be.ok;
    });

    it('should redirect to pullRequest if given', function(){
        stateParams.pullRequest = 1;

        claController = createCtrl();
        httpBackend.expect('GET', '/logout?noredirect=true').respond(true);

        httpBackend.flush();
        _timeout.flush();

        (_window.location.href).should.be.equal('https://github.com/login/myRepo/pull/1');
        (claController.scope.signed).should.be.ok;
    });

    it('should redirect to accept url on agree with pullRequest parameter', function(){
        stateParams.pullRequest = 1;
        claSigned = false;
        claController = createCtrl();

        // httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(true);
        // httpBackend.expect('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        // httpBackend.expect('POST', '/api/cla/get', {repo: stateParams.repo, owner: stateParams.user}).respond({raw: '<p>cla text</p>'});

        httpBackend.flush();

        claController.scope.agree();
        (_window.location.href).should.be.equal('/accept/login/myRepo?pullRequest=1');
    });

    it('should check whether user has signed CLA already or NOT', function(){
        claSigned = false;
        claController = createCtrl();

        httpBackend.flush();

        (claController.scope.signed).should.not.be.ok;
    });

    it('should redirect to accept url on agree', function(){
        claSigned = false;

        claController = createCtrl();

        httpBackend.flush();

        claController.scope.agree();
        (_window.location.href).should.be.equal('/accept/login/myRepo');
    });

    it('should not load cla if repo does not exist', function(){
        claController = createCtrl();

        httpBackend.expect('POST', '/api/repo/check', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.flush();

        (claController.scope.repoExists).should.not.be.ok;
    });

    it('should not check whether user has signed cla if repo does not exist', function(){
        repoExists = false;
        var claCheckWasCalled = false;
        claController = createCtrl();

        httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(function(){
          claCheckWasCalled = true;
          return false;
        });
        httpBackend.flush();

        (claCheckWasCalled).should.not.be.ok;
    });

    it('should generate redirect url if pull request number is given', function(){
        scope.user = null;
        stateParams.pullRequest = 1;
        claController = createCtrl();

        httpBackend.expect('GET', '/logout?noredirect=true').respond(true);
        httpBackend.flush();

        (claController.scope.redirect).should.be.ok;
    });

    it('should redirect to github mainpage if pull request number is not given', function(){
        claController = createCtrl();

        httpBackend.expect('GET', '/logout?noredirect=true').respond(true);
        httpBackend.flush();

        (claController.scope.redirect).should.be.ok;
    });

});

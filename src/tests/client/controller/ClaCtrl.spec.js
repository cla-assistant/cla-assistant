/*jshiint expr:true*/
/*global angular, sinon, describe, xit, it, beforeEach, afterEach*/

angular.module('app');
describe('CLA Controller', function() {
    var scope, _timeout, stateParams, httpBackend, createCtrl, claController, _window, _q, user, claSigned, claText, claTextWithMeta, _HUBService, _RPCService;
    var linkedItem;
    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));
    beforeEach(angular.mock.module(function($provide){
        $provide.value('$window', {location: {href: 'dummy'}});
    }));

    user = {value: {}};

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller, $window, $timeout, $q, $HUBService, $RPCService) {
        // $provide.value($window, {location: {href: 'href'}});
        _window = $window;
        _timeout = $timeout;
        _q = $q;
        _HUBService = $HUBService;
        _RPCService = $RPCService;

        sinon.stub($HUBService, 'call', function(o, functn, data, cb){
            var deferred = _q.defer();
            if (o === 'users' && functn === 'get') {
                deferred.resolve(user);
                cb(null, user);
            } else if (o === 'users' && functn === 'getEmails') {
                var emails = {
                    value: [
                        {
                            'email': 'octocat@gmail.com',
                            'verified': true,
                            'primary': false
                        },
                        {
                            'email': 'octocat@github.com',
                            'verified': true,
                            'primary': true
                        }
                    ]
                };
                deferred.resolve(emails);
                cb(null, emails);
            }

            return deferred.promise;
        });

        var rpcCall = $RPCService.call;
        sinon.stub($RPCService, 'call', function(o, functn, data, cb){
            if (o === 'cla' && functn === 'sign') {
                cb(null, true);
            } else if (o === 'cla' && functn === 'getLastSignature') {
                cb(null, {
                    value: {
                        custom_fields: '{"name": "Test User"}'
                    }
                });
            } else {
                return rpcCall(o, functn, data, cb);
            }
        });

        httpBackend = $injector.get('$httpBackend');
        httpBackend.when('GET', '/config').respond({ });

        scope = $rootScope.$new();
        stateParams = {user: 'login', repo: 'myRepo'};

        user.value = {id: 123, login: 'login'};
        user.meta = {scopes: 'user:email, repo, repo:status, read:repo_hook, write:repo_hook, read:org'};
        claSigned = true;
        claText = { raw: '<p>cla text</p>' };
        claTextWithMeta = { raw: '<p>cla text</p>', meta: '<p>{ "name": {"type": "string","githubKey": "name"},"email": {"type": "string","githubKey": "email", "required": "true"},"age": {"description": "Age in years","type": "number","minimum": "0", "required": "true"}}</p>' };
        linkedItem = { repoId: 1 };


        createCtrl = function() {
            // httpBackend.when('POS  T', '/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond(user);
            httpBackend.when('POST', '/api/cla/getLinkedItem', {repo: stateParams.repo, owner: stateParams.user}).respond(linkedItem);
            httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(claSigned);
            httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claText);

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
        _RPCService.call.restore();

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

    it('should get CLA text with meta data', function() {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.claText).should.be.ok;
        (claController.scope.hasCustomFields).should.be.equal(true);
        (claController.scope.customKeys).should.be.ok;
        // (claController.scope.customValues.a).should.be.ok;
    });

    it('should fill customFields with github values', function() {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {name: 'Test User'};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.claText).should.be.ok;
        (claController.scope.customFields).should.be.ok;
        (claController.scope.customKeys).should.be.ok;
        (claController.scope.customValues.name).should.be.equal(claController.scope.user.value.name);
    });

    it('should fill customFields with signed values if cla signed', function () {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {name: 'Test User'};
        user.meta = {};
        claSigned = true;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.claText).should.be.ok;
        (claController.scope.customFields).should.be.ok;
        console.log(claController.scope.customValues);
        (claController.scope.customValues.name).should.be.equal('Test User');
    });

    it('should call github if user profile has no email and custom fields expect email', function() {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {name: 'Test User', email: ''};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.claText).should.be.ok;
        (claController.scope.customFields).should.be.ok;
        (claController.scope.customKeys).should.be.ok;
        (claController.scope.customValues.email).should.be.equal('octocat@github.com');
    });

    it('should validate customFields', function () {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        claController.scope.customValues.name = '';
        claController.scope.customValues.email = 'any email';
        claController.scope.customValues.age = 23;

        (claController.scope.customFields).should.be.ok;
        (claController.scope.isValid()).should.be.ok;
    });

    it('should be invalid if not all required fields are filled', function () {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        claController.scope.customValues.name = 'any name';
        claController.scope.customValues.email = '';
        claController.scope.customValues.age = 23;

        (claController.scope.customFields).should.be.ok;
        (claController.scope.isValid()).should.not.be.ok;
    });

    it('should not fail on validate if there are no requiredKeys', function () {
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        claController.scope.customFields = {
            name: { type: 'string', githubKey: 'name' },
            email: { type: 'string', githubKey: 'email' },
            age: { description: 'Age in years', type: 'number' }
        };

        (claController.scope.isValid()).should.be.equal(true);
    });

    it('should handle wrong meta data', function () {
        claTextWithMeta.meta = '{"invalid": "json" "without":"comma"}';
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;

        claController = createCtrl();
        httpBackend.flush();

        _timeout.flush();
        (claController.scope.noLinkedItemError).should.be.ok;
        (!!claController.scope.claText).should.not.be.ok;
        (!!claController.scope.customFields.length).should.not.be.ok;
    });

    it('should get CLA text with orgid', function() {
        user.value = {};
        user.meta = {};
        claSigned = false;
        linkedItem = { orgId: 2 };

        httpBackend.expect('POST', '/api/cla/get', { orgId: linkedItem.orgId }).respond(claText);

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

    it('should get linkedItem of the repo', function () {
        claController = createCtrl();

        httpBackend.expect('POST', '/api/cla/getLinkedItem', { repo: stateParams.repo, owner: stateParams.user }).respond(linkedItem);

        httpBackend.flush();
    });

    it('should check whether user has signed CLA already or not and redirect if redirect param set to true', function(){
        stateParams.redirect = true;

        claController = createCtrl();

        httpBackend.flush();
        _timeout.flush();

        (_window.location.href).should.be.equal('https://github.com/login/myRepo');
        (claController.scope.signed).should.be.ok;
    });

    it('should redirect to pullRequest if given', function(){
        stateParams.pullRequest = 1;
        stateParams.redirect = true;

        claController = createCtrl();

        httpBackend.flush();
        _timeout.flush();

        (_window.location.href).should.be.equal('https://github.com/login/myRepo/pull/1');
        (claController.scope.signed).should.be.ok;
    });

    it('should not redirect to pullRequest if not just signed (no param redirect)', function(){
        stateParams.pullRequest = 1;

        claController = createCtrl();

        httpBackend.flush();
        _timeout.flush();

        (_window.location.href).should.not.be.equal('https://github.com/login/myRepo/pull/1');
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

    it('should redirect to accept url on agree if there are no customFields', function(){
        claSigned = false;

        claController = createCtrl();

        httpBackend.flush();

        claController.scope.agree();
        (_window.location.href).should.be.equal('/accept/login/myRepo');
    });

    it('should call cla:sign on agree if there are customFields and user is logged in', function(){
        httpBackend.when('POST', '/api/cla/get', {repoId: linkedItem.repoId}).respond(claTextWithMeta);
        user.value = {};
        user.meta = {};
        claSigned = false;
        claController = createCtrl();

        httpBackend.flush();
        _timeout.flush();

        claController.scope.user.value = {login: 'testUser', id: 123};

        claController.scope.agree();

        (_window.location.href).should.not.be.equal('/accept/login/myRepo');
        (_RPCService.call.calledWithMatch('cla', 'sign')).should.be.ok;
    });

    it('should not load cla if no linked item exists', function(){
        claController = createCtrl();

        httpBackend.expect('POST', '/api/cla/getLinkedItem', {repo: stateParams.repo, owner: stateParams.user}).respond(false);
        httpBackend.flush();

        (claController.scope.linkedItem).should.not.be.ok;
    });

    it('should not check whether user has signed cla if repo does not exist', function(){
        linkedItem = false;
        var claCheckWasCalled = false;
        claController = createCtrl();

        httpBackend.when('POST', '/api/cla/check', {repo: stateParams.repo, owner: stateParams.user}).respond(function(){
          claCheckWasCalled = true;
          return false;
        });
        httpBackend.flush();

        (claCheckWasCalled).should.not.be.ok;
    });
});

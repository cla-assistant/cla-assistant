describe('Root Controller', function() {

    var scope, rootScope, httpBackend, createCtrl, rootCtrl;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();
        rootScope = $rootScope;
        rootScope.user = {value: {admin: false}};

        createCtrl = function() {

            var ctrl = $controller('RootCtrl', {
                $scope: scope
            });
            ctrl.scope = scope;
            return ctrl;
        };

        rootCtrl = createCtrl();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should get user', function() {

        httpBackend.expect('POST','/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond({data: {login: 'login'}, meta: {scopes: 'user:email'}});
        httpBackend.flush();

        (rootCtrl.scope.user).should.be.ok;
        (rootScope.user.value.login).should.be.equal('login');
    });

    it('should determine user with simple scope', function(){

        httpBackend.expect('POST','/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond({data: {login: 'login'}, meta: {scopes: 'user:email'}});
        httpBackend.flush();

        (rootCtrl.scope.user.value.admin).should.not.be.ok;
    });

    it('should determine user with admin scope', function(){

        httpBackend.expect('POST','/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond({data: {login: 'login'}, meta: {scopes: 'user:email, repo, repo:status, read:repo_hook, write:repo_hook, read:org'}});
        httpBackend.flush();

        (rootCtrl.scope.user.value.admin).should.be.ok;
    });
});

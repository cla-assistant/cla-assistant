describe('Detail Controller', function() {

    var scope, rootScope, httpBackend, createCtrl, HUB, detailCtrl, stateParams;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();
        rootScope = $rootScope;
        rootScope.user = {value: {admin: false}};
        stateParams = {user: 'login', repo: 'myRepo'};

        createCtrl = function() {

            var ctrl = $controller('DetailCtrl', {
                $scope: scope,
                $stateParams: stateParams
            });
            ctrl.scope = scope;
            return ctrl;
        };

        rootScope.user.value = {id: 1, login: 'octocat', admin: false};
        detailCtrl = createCtrl();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should check whethter the user has admin rights or NOT', function(){
        (detailCtrl.scope.repo).should.be.empty;
        (detailCtrl.scope.admin).should.not.be.ok;
    });

    it('should load CLA if gist url is given and user is admin', function(){
		rootScope.user.value = {id: 123, login: 'login', admin: true};
		rootScope.$broadcast('user');

        httpBackend.expect('POST', '/api/repo/get', {repo: stateParams.repo, owner: stateParams.user}).respond({repo: 'myRepo', owner: 'login', gist: 'url'});
        httpBackend.expect('POST', '/api/cla/get', {repo: 'myRepo', owner: 'login'}).respond({raw: '<p>cla text</p>'});
		httpBackend.expect('POST', '/api/cla/getAll', {repo: 'myRepo', owner: 'login', gist: 'url'}).respond([{user: 'login'}]);
		httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});

        httpBackend.flush();

        (detailCtrl.scope.admin).should.be.ok;
        (detailCtrl.scope.repo).should.be.ok;
        (detailCtrl.scope.claText).should.be.ok;
    });

    it('should create webhook for the selected repo on update action if gist is given', function(){
        httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 'url'}).respond(true);
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({});

        detailCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        detailCtrl.scope.update();

        httpBackend.flush();
        (detailCtrl.scope.repo.active).should.be.ok;
    });

    it('should remove webhook for the selected repo on update action if there is NO gist', function(){
        httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: ''}).respond(true);
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});

        detailCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: ''};
        detailCtrl.scope.update();

        httpBackend.flush();
        (detailCtrl.scope.repo.active).should.not.be.ok;
    });

    it('should get all users signed this cla', function(){
		var repo = detailCtrl.scope.repo;
		httpBackend.expect('POST', '/api/cla/getAll', {repo: repo.repo, owner: repo.user, gist: repo.gist}).respond([{user: 'login'}]);
		httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});

		detailCtrl.scope.getUsers();
        httpBackend.flush();

		(detailCtrl.scope.users.length).should.be.equal(1);
    });

});

describe('Settings Controller', function() {

    var scope, rootScope, httpBackend, createCtrl, HUB, SettingsCtrl, stateParams;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();
        rootScope = $rootScope;
        rootScope.user = {value: {admin: false}};
        stateParams = {user: 'login', repo: 'myRepo'};

        createCtrl = function() {

            var ctrl = $controller('SettingsCtrl', {
                $scope: scope,
                $stateParams: stateParams
            });
            ctrl.scope = scope;
            return ctrl;
        };

        rootScope.user.value = {id: 1, login: 'octocat', admin: false};
        settingsCtrl = createCtrl();
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should check whethter the user has admin rights or NOT', function(){
        (settingsCtrl.scope.repo).should.be.empty;
        (settingsCtrl.scope.admin).should.not.be.ok;
    });

    it('should not load anything on init or on rootScope broadcast', function(){
		rootScope.user.value = {id: 123, login: 'login', admin: true};
		rootScope.$broadcast('user');

        (settingsCtrl.scope.repo).should.be.empty;
    });

    it('should create webhook for the selected repo on update action if gist is given', function(){
        httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 'url'}).respond(true);
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({});

        settingsCtrl.scope.$parent.claRepo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        settingsCtrl.scope.update();

        httpBackend.flush();
        (settingsCtrl.scope.repo.active).should.be.ok;
    });

    it('should remove webhook for the selected repo on update action if there is NO gist', function(){
        httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: ''}).respond(true);
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});

        settingsCtrl.scope.$parent.claRepo = {repo: 'myRepo', owner: 'login', gist: ''};
        settingsCtrl.scope.update();

        httpBackend.flush();
        (settingsCtrl.scope.repo.active).should.not.be.ok;
    });

    it('should get all users signed this cla', function(){
		var repo = settingsCtrl.scope.repo;
		httpBackend.expect('POST', '/api/cla/getAll', {repo: repo.repo, owner: repo.user, gist: {gist_url: repo.gist}}).respond([{user: 'login'}]);
		httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});

		settingsCtrl.scope.getUsers();
        httpBackend.flush();

		(settingsCtrl.scope.users.length).should.be.equal(1);
    });

    it('should get gist from github on getGist function', function(){
        settingsCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        httpBackend.expect('POST', '/api/cla/getGist', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'url'}}).respond({id: 'gistId'});

        settingsCtrl.scope.getGist();
        httpBackend.flush();

        (settingsCtrl.scope.gist.id).should.be.equal('gistId');
    });

    it('should handle error in getGist function', function(){
        settingsCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        httpBackend.expect('POST', '/api/cla/getGist', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'url'}}).respond(500, 'Error');

        settingsCtrl.scope.getGist();
        httpBackend.flush();

        (settingsCtrl.scope.gist).should.be.empty;
    });

    it('should reload data for other gist versions on gistVersion', function(){
        rootScope.user.value = {id: 123, login: 'login', admin: true};
        settingsCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: 'url'};

        settingsCtrl.scope.gist = testData;

        var args = {repo: 'myRepo', owner: 'login', gist: {gist_url: 'url', gist_version: '57a7f021a713b1c5a6a199b54cc514735d2d4123'}};
        httpBackend.expect('POST', '/api/cla/get', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'url', gist_version: '57a7f021a713b1c5a6a199b54cc514735d2d4123'}}).respond({raw: '<p>cla text</p>'});
        httpBackend.expect('POST', '/api/cla/getAll', args).respond([{user: 'login'}]);
        httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});


        settingsCtrl.scope.gistVersion(1);
        httpBackend.flush();

        (settingsCtrl.scope.gistIndex).should.be.equal(1);
        (settingsCtrl.scope.repo).should.be.ok;
        (settingsCtrl.scope.claText).should.be.ok;
    });
});

var testData = {
  'url': 'https://api.github.com/gists/10a5479e1ab38ec63566',
  'owner': {
    'login': 'octocat'
  },
  'user': null,
  'files': {
    'ring.erl': {
      'content': 'contents of gist'
    }
  },
  'created_at': '2010-04-14T02:15:15Z',
  'updated_at': '2014-05-14T02:15:15Z',
  'history': [
    {
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
    },
    {
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
    }
  ]
};

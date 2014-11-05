describe('Home Controller', function() {

    var scope, rootScope, httpBackend, createCtrl, HUB, homeCtrl;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();
        rootScope = $rootScope;
        rootScope.user = {value: {admin: false}};

        createCtrl = function() {

            var ctrl = $controller('HomeCtrl', {
                $scope: scope
            });
            ctrl.scope = scope;
            return ctrl;
        };

        rootScope.user.value = {id: 1, login: 'octocat', admin: false};
        homeCtrl = createCtrl();

    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should get user repos if user has admin rights', function() {
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST','/api/github/call', { obj: 'repos', fun: 'getAll', arg: {user: rootScope.user.value.login} }).respond(testDataRepos);
        httpBackend.expect('POST','/api/repo/get', { repo: 'Hello-World', owner: 'octocat'}).respond({name: 'Hello-World', owner: 'octocat', gist: 1234});

        httpBackend.flush();

        (homeCtrl.scope.repos.length).should.be.equal(1);
        (homeCtrl.scope.user.value.admin).should.be.equal(true);
    });

    it('should not load user repos if he is not an admin', function(){
        rootScope.$broadcast('user');

        (homeCtrl.scope.repos.length).should.be.equal(0);
        (homeCtrl.scope.user.value.admin).should.be.equal(false);
    });

    it('should create repo entry on activate action', function(){

        httpBackend.expect('POST','/api/repo/create', { repo: 'myRepo', owner: 'login', gist: 1234}).respond(true);
        httpBackend.expect('POST','/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({});

        var repo = {id: 123, name: 'myRepo', owner: {login: 'login'}, claborate: {gist: 1234}};
        homeCtrl.scope.activate(repo);

        httpBackend.flush();
        (repo.claborate).should.be.ok;
    });

    it('should create webhook for the selected repo on activate action if there are no', function(){

        httpBackend.expect('POST','/api/repo/create', { repo: 'myRepo', owner: 'login', gist: 1234}).respond(true);
        httpBackend.expect('POST','/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({});

        var repo = {id: 123, name: 'myRepo', owner: {login: 'login'}, claborate: {gist: 1234}};
        homeCtrl.scope.activate(repo);

        httpBackend.flush();
    });

    it('should check repos whether they are activated or NOT', function(){
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST','/api/github/call', { obj: 'repos', fun: 'getAll', arg: {user: rootScope.user.value.login} }).respond(testDataRepos);
        httpBackend.expect('POST','/api/repo/get', { repo: 'Hello-World', owner: 'octocat'}).respond();
        httpBackend.flush();

        (homeCtrl.scope.repos[0].claborate.active).should.not.be.ok;
    });

    it('should check repos whether they are ACTIVATED or not', function(){
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST','/api/github/call', { obj: 'repos', fun: 'getAll', arg: {user: rootScope.user.value.login} }).respond(testDataRepos);
        httpBackend.expect('POST','/api/repo/get', { repo: 'Hello-World', owner: 'octocat'}).respond({name: 'Hello-World', owner: 'octocat', gist: 1234});

        httpBackend.flush();

        (homeCtrl.scope.repos[0].claborate.active).should.be.ok;
        (homeCtrl.scope.repos[0].claborate.gist).should.be.ok;
    });

    it('should update repo on changed gist', function(){
        httpBackend.expect('POST','/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2' }).respond(true);

        var repo = {id: 123, name: 'myRepo', owner: {login: 'login'}, claborate: {gist: 'https://gist.github.com/myRepo/2'}};
        homeCtrl.scope.update(repo);

        httpBackend.flush();
    });

    it('should check webhook validity (on update)', function(){

    });

    it('should delete db entry and webhook on deactivate', function(){
        httpBackend.expect('POST','/api/repo/remove', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2' }).respond();
        httpBackend.expect('POST','/api/webhook/remove', { repo: 'myRepo', user: 'login'}).respond();

        var repo = {id: 123, name: 'myRepo', owner: {login: 'login'}, claborate: {gist: 'https://gist.github.com/myRepo/2'}};
        homeCtrl.scope.remove(repo);

        httpBackend.flush();
    });

});

var testDataRepos = {data: [
    {
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
        'html_url': 'https://github.com/octocat/Hello-World'
    }
]};

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

        // httpBackend.expect('POST', '/api/github/call', { obj: 'repos', fun: 'getAll', arg: {user: rootScope.user.value.login} }).respond(testDataRepos);
        // httpBackend.expect('POST', '/api/github/call', { obj: 'user', fun: 'getOrgs', arg: {} }).respond(testDataOrgs);
        httpBackend.expect('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos'}).respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]));
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);

        httpBackend.flush();

        (homeCtrl.scope.repos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.user.value.admin).should.be.equal(true);
    });

    it('should not load user`s repos if he is not an admin', function(){
        rootScope.$broadcast('user');

        (homeCtrl.scope.repos.length).should.be.equal(0);
        (homeCtrl.scope.user.value.admin).should.be.equal(false);
    });

    it('should create repo entry on addRepo action', function(){
        homeCtrl.scope.repos = [{name: 'myRepo', owner: {login: 'login'}, fork: true}];
        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login'}).respond(true);
        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};

        homeCtrl.scope.addRepo();
        httpBackend.flush();

        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.claRepos[0].active).should.not.be.ok;
        (homeCtrl.scope.claRepos[0].fork).should.be.ok;
    });

    it('should remove repo from claRepos list if create failed on backend', function(){
        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login'}).respond(false);
        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};

        homeCtrl.scope.addRepo();
        httpBackend.flush();

        (homeCtrl.scope.claRepos.length).should.be.equal(0);
    });

    it('should show error message if create failed', function(){
        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login'}).respond(500, {err: 'nsertDocument :: caused by :: 11000 E11000 duplicate key error index: cla-staging.repos.$repo_1_owner_1  dup key: { : "myRepo", : "login" }'});
        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};

        homeCtrl.scope.addRepo();
        httpBackend.flush();

        (homeCtrl.scope.errorMsg[0]).should.be.equal('This repository is already set up.');
    });

    // xit('should create webhook for the selected repo on update action if gist is given', function(){

    //     httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 1234}).respond(true);
    //     httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({});

    //     homeCtrl.scope.claRepos = [{repo: 'myRepo', owner: 'login', gist: 1234}];
    //     homeCtrl.scope.update(0);

    //     httpBackend.flush();
    //     (homeCtrl.scope.claRepos[0].active).should.be.ok;
    // });

    // xit('should remove webhook for the selected repo on update action if there is NO gist', function(){

    //     httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: ''}).respond(true);
    //     httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});

    //     homeCtrl.scope.claRepos = [{repo: 'myRepo', owner: 'login', gist: ''}];
    //     homeCtrl.scope.update(0);

    //     httpBackend.flush();
    //     (homeCtrl.scope.claRepos[0].active).should.not.be.ok;
    // });

    it('should check repos whether they are activated or NOT', function(){
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos'}).respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]));
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{name: 'Hello-World', owner: 'octocat', gist: ''}]);
        httpBackend.flush();

        (homeCtrl.scope.claRepos[0].active).should.not.be.ok;
    });

    it('should check repos whether they are ACTIVATED or not', function(){
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos'}).respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]));
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);
        httpBackend.flush();

        (homeCtrl.scope.claRepos[0].active).should.be.ok;
        (homeCtrl.scope.claRepos[0].gist).should.be.ok;
    });

    it('should delete db entry and webhook on remove', function(){
        httpBackend.expect('POST', '/api/repo/remove', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2' }).respond();
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login'}).respond();

        var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2', active: true};
        homeCtrl.scope.claRepos = [repo];
        homeCtrl.scope.remove(repo);

        httpBackend.flush();
        (homeCtrl.scope.claRepos.length).should.be.equal(0);
    });

    // it('should select repo from the search field', function(){
    //     var repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};
    //     homeCtrl.scope.select(repo);

    //     (homeCtrl.scope.selected.full_name).should.be.equal(repo.full_name);
    //     (homeCtrl.scope.query.text).should.be.equal(repo.full_name);
    // });

    it('should mix claRepos data with repos data', function(){
        rootScope.user.value.admin = true;
        rootScope.$broadcast('user');

        httpBackend.expect('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos'}).respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]));
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);

        httpBackend.flush();

        (homeCtrl.scope.repos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.claRepos[0].fork).should.be.equal(testDataRepos.data[0].fork);
    });

    it('should get all users signed this cla', function(){
        var claRepo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        httpBackend.expect('POST', '/api/cla/getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}}).respond([{user: 'login'}]);
        httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});

        homeCtrl.scope.getUsers(claRepo);
          httpBackend.flush();

        (homeCtrl.scope.users.length).should.be.equal(1);
    });

    it('should handle multiple error messages', function(){
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

var testDataOrgs = {data: [
  {
    'login': 'github',
    'id': 1,
    'url': 'https://api.github.com/orgs/github',
    'repos_url': 'https://api.github.com/orgs/github/repos',
    'avatar_url': 'https://github.com/images/error/octocat_happy.gif'
  }
]};

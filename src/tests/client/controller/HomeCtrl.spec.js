describe('Home Controller', function() {

    var scope, rootScope, httpBackend, createCtrl, HUB, homeCtrl, githubResponse;

    beforeEach(angular.mock.module('app'));
    beforeEach(angular.mock.module('templates'));

    beforeEach(angular.mock.inject(function($injector, $rootScope, $controller) {

        httpBackend = $injector.get('$httpBackend');

        scope = $rootScope.$new();

        createCtrl = function() {

            var ctrl = $controller('HomeCtrl', {
                $scope: scope
            });
            ctrl.scope = scope;
            return ctrl;
        };

        homeCtrl = createCtrl();
        githubResponse = {data: {login: 'login'}, meta: {scopes: 'user:email, repo, repo:status, read:repo_hook, write:repo_hook, read:org'}};
        httpBackend.when('POST', '/api/github/call', { obj: 'user', fun: 'get', arg: {} }).respond(githubResponse);
        httpBackend.when('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos?per_page=100'}).respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]));
        httpBackend.when('POST', '/api/github/direct_call', {url: 'https://api.github.com/gists?per_page=100'}).respond(testDataGists.data.concat(
            [{
                html_url: 'https://gist.github.com/gistId',
                files: {'file.txt': {filename: 'file1'}}
            }]));
        httpBackend.when('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);
        httpBackend.when('GET', '/static/cla-assistant.json').respond({ 'default-cla': [{
          'name': 'first default cla',
          'url': 'https://gist.github.com/gistId'
        }]});

    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
        homeCtrl.scope.selectedRepo = {};
        homeCtrl.scope.selectedGist = {};
    });

    it('should get user repos and mix claRepos data with repos data if user has admin rights', function() {
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);

        httpBackend.flush();

        (homeCtrl.scope.repos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.user.value.admin).should.be.equal(true);
        (homeCtrl.scope.claRepos[0].fork).should.be.equal(testDataRepos.data[0].fork);
    });

    xit('should get more repos if there are more to load', function(){

        httpBackend.expect('POST', '/api/github/direct_call', {url: 'https://api.github.com/user/repos?per_page=100'})
            .respond(testDataRepos.data.concat([{id: 123, owner: {login: 'orgOwner'}}]), {link: '<next_page_url>; rel="next"'});
        httpBackend.expect('POST', '/api/github/direct_call', {url: 'next_page_url'}).respond([{id: 456, owner: {login: 'orgOwner'}}]);
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);

        httpBackend.flush();

        (homeCtrl.scope.repos.length).should.be.equal(3);
        (homeCtrl.scope.claRepos.length).should.be.equal(1);
        (homeCtrl.scope.user.value.admin).should.be.equal(true);
    });

    it('should not load user`s repos if he is not an admin', function(){
        githubResponse.meta.scopes = 'user:email';
        httpBackend.flush();


        (homeCtrl.scope.repos.length).should.be.equal(0);
        (homeCtrl.scope.user.value.admin).should.be.equal(false);
    });

    it('should create repo entry and webhook on link action', function(){
        httpBackend.flush();

        homeCtrl.scope.repos = [{name: 'myRepo', owner: {login: 'login'}, fork: true}];

        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};
        homeCtrl.scope.selectedGist.gist = {url: 'https://gist.github.com/gistId'};

        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login', gist: homeCtrl.scope.selectedGist.gist.url}).respond(true);
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({active: true});

        homeCtrl.scope.link();
        httpBackend.flush();

        (homeCtrl.scope.claRepos.length).should.be.equal(2);
        (homeCtrl.scope.claRepos[1].repo).should.be.equal('myRepo');
        (homeCtrl.scope.claRepos[1].active).should.be.ok;
        (homeCtrl.scope.claRepos[1].fork).should.be.ok;
    });

    it('should set active flag depending on webhook response', function(){
        httpBackend.flush();

        homeCtrl.scope.repos = [{name: 'myRepo', owner: {login: 'login'}, fork: true}];

        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};
        homeCtrl.scope.selectedGist.gist = {url: 'https://gist.github.com/gistId'};

        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login', gist: homeCtrl.scope.selectedGist.gist.url}).respond(true);
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond({active: false});

        homeCtrl.scope.link();
        httpBackend.flush();

        (homeCtrl.scope.claRepos[1].repo).should.be.equal('myRepo');
        (homeCtrl.scope.claRepos[1].active).should.be.not.ok;
    });

    it('should remove repo from claRepos list and remove webhook from github if create failed on backend', function(){
        httpBackend.flush();

        homeCtrl.scope.repos = [{name: 'myRepo', owner: {login: 'login'}, fork: true}];

        homeCtrl.scope.selectedGist.gist = {url: 'https://gist.github.com/gistId'};
        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};

        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login', gist: homeCtrl.scope.selectedGist.gist.url}).respond(false);
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond(null, {active: true});
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});

        homeCtrl.scope.link();
        httpBackend.flush();


        (homeCtrl.scope.claRepos.length).should.be.equal(1);
    });

    it('should show error message if create failed', function(){
        httpBackend.flush();

        homeCtrl.scope.selectedGist.gist = {url: 'https://gist.github.com/gistId'};
        homeCtrl.scope.selectedRepo.repo = {id: 123, name: 'myRepo', full_name: 'login/myRepo', owner: {login: 'login'}};

        httpBackend.expect('POST', '/api/repo/create', { repo: 'myRepo', owner: 'login', gist: homeCtrl.scope.selectedGist.gist.url}).respond(500, {err: 'nsertDocument :: caused by :: 11000 E11000 duplicate key error index: cla-staging.repos.$repo_1_owner_1  dup key: { : "myRepo", : "login" }'});
        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond(null, {active: true});
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});

        homeCtrl.scope.link();
        httpBackend.flush();

        (homeCtrl.scope.errorMsg[0]).should.be.equal('This repository is already set up.');
    });

    xit('should create webhook on link if gist url is given', function(){
            // scope.user.value = {id: 123, login: 'login', admin: true};
        httpBackend.flush();

        httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond(null, {active: true});
        httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/gistId'}).respond(true);
        // httpBackend.expect('POST', '/api/repo/get', {repo: 'myRepo', owner: 'login'}).respond({repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/gistId'});
        httpBackend.expect('POST', '/api/cla/getGist', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'https://gist.github.com/gistId'}}).respond({id: 'gistId'});

            settingsCtrl.scope.update();

            httpBackend.flush();
            (settingsCtrl.scope.repo.active).should.be.ok;
            (settingsCtrl.scope.gist.id).should.be.equal('gistId');
        });

        xit('should remove webhook for the selected repo on update action if there is NO gist', function(){
            scope.user.value = {id: 123, login: 'login', admin: true};
            httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});
            httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: ''}).respond(true);
            // httpBackend.expect('POST', '/api/repo/get', {repo: 'myRepo', owner: 'login'}).respond({repo: 'myRepo', owner: 'login', gist: ''});

            settingsCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: ''};
            settingsCtrl.scope.update();

            httpBackend.flush();
            (settingsCtrl.scope.repo.active).should.not.be.ok;
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
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{name: 'Hello-World', owner: 'octocat', gist: ''}]);
        httpBackend.flush();

        (homeCtrl.scope.claRepos[0].active).should.not.be.ok;
    });

    it('should check repos whether they are ACTIVATED or not', function(){
        httpBackend.expect('POST', '/api/repo/getAll', {set: [{owner: 'octocat', repo: 'Hello-World'}, {owner: 'orgOwner'}]}).respond([{repo: 'Hello-World', owner: 'octocat', gist: 1234}]);
        httpBackend.flush();

        (homeCtrl.scope.claRepos[0].active).should.be.ok;
        (homeCtrl.scope.claRepos[0].gist).should.be.ok;
    });

    it('should delete db entry and webhook on remove', function(){
        httpBackend.flush();

        httpBackend.expect('POST', '/api/repo/remove', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2' }).respond();
        httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login'}).respond();

        var repo = {repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/2', active: true};
        homeCtrl.scope.claRepos = [repo];
        homeCtrl.scope.remove(repo);

        httpBackend.flush();
        (homeCtrl.scope.claRepos.length).should.be.equal(0);
    });

    it('should get all users signed this cla', function(){
        var claRepo = {repo: 'myRepo', owner: 'login', gist: 'url'};
        httpBackend.expect('POST', '/api/cla/getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}}).respond([{user: 'login'}]);
        httpBackend.expect('POST', '/api/github/call', {obj: 'user', fun: 'getFrom', arg: {user: 'login'}}).respond({id: 12, login: 'login', name: 'name'});

        homeCtrl.scope.getUsers(claRepo);
          httpBackend.flush();

        (homeCtrl.scope.users.length).should.be.equal(1);
    });

    it('should load gist files of the user', function(){
        httpBackend.flush();

        (homeCtrl.scope.gists.length).should.be.equal(3);
        (homeCtrl.scope.gists[0].name).should.be.equal('first default cla');
        (homeCtrl.scope.gists[1].name).should.be.equal('ring.erl');
        (homeCtrl.scope.gists[2].name).should.be.equal('file1');
    });

    it('should validate gist url', function(){
        httpBackend.flush();
        var invalidUrls = ['https://google.com', '', undefined];

        invalidUrls.forEach(function(url){
            homeCtrl.scope.isValid(url).should.not.be.ok;
        });
    });

    it('should identify default gist url from all gists', function(){
        httpBackend.flush();

        var sapClaGist = {name: 'first default cla', url: 'https://gist.github.com/gistId'};
        (homeCtrl.scope.groupDefaultCla(sapClaGist)).should.be.equal('Default CLAs');

        var anyOtherGist = {name: 'any name', url: 'https://gist.github.com/gitID'};
        (homeCtrl.scope.groupDefaultCla(anyOtherGist)).should.not.be.equal('Default CLAs');
    });

    it('should load default cla files', function(){
        httpBackend.flush();

        homeCtrl.scope.defaultClas.length.should.be.equal(1);
        homeCtrl.scope.defaultClas[0].name.should.be.equal('first default cla');
    });

    it('should clear selected repo on clear function', function(){
        httpBackend.flush();
        var ev = {stopPropagation: function(){}};
        homeCtrl.scope.selectedRepo.repo = {name: 'any test repo'};

        homeCtrl.scope.clear(ev, 'repo');

        (!homeCtrl.scope.selectedRepo.repo).should.be.ok;
    });

    it('should clear selected cla on clear function', function(){
        httpBackend.flush();
        var ev = {stopPropagation: function(){}};
        homeCtrl.scope.selectedGist.gist = {url: 'any_test_url'};

        homeCtrl.scope.clear(ev, 'gist');

        (!homeCtrl.scope.selectedGist.gist).should.be.ok;
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

var testDataGists = {data: [
  {
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
  }
]};

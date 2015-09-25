/*jshiint expr:true*/
/*global angular, sinon, describe, xit, it, beforeEach, afterEach*/

describe('Settings Controller', function () {

	var scope, httpBackend, createCtrl, settingsCtrl, stateParams, modal;

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

	beforeEach(angular.mock.inject(function ($injector, $rootScope, $controller, $modal) {

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
		scope.repo = {
			repo: 'myRepo',
			owner: 'login',
			gist: 'https://gist.github.com/gistId'
		};

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
		httpBackend.when('POST', '/api/cla/getAll', {
			repo: scope.repo.repo,
			owner: scope.repo.owner,
			gist: {
				gist_url: scope.repo.gist
			}
		}).respond([{
			user: 'login'
		}, {
			user: 'user2'
		}]);

	}));

	afterEach(function () {
		httpBackend.verifyNoOutstandingExpectation();
		httpBackend.verifyNoOutstandingRequest();
	});

	describe('normaly', function () {
		beforeEach(function () {
			settingsCtrl = createCtrl();
			httpBackend.expect('POST', '/api/cla/getGist', {
				repo: 'myRepo',
				owner: 'login',
				gist: {
					gist_url: 'https://gist.github.com/gistId'
				}
			}).respond(testData);
			httpBackend.expect('POST', '/api/webhook/get', {
				repo: 'myRepo',
				user: 'login'
			}).respond({
				id: 'webhookId'
			});
		});

		it('should check whethter the user has admin rights or NOT', function () {
			// (settingsCtrl.scope.repo).should.be.empty;
			httpBackend.flush();
			(settingsCtrl.scope.admin).should.not.be.ok;
		});

		it('should load gistFile on init ', function () {
			(settingsCtrl.scope.loading).should.be.ok;

			httpBackend.flush();

			(settingsCtrl.scope.loading).should.not.be.ok;
			(settingsCtrl.scope.gist.url).should.be.equal(testData.url);
			(settingsCtrl.scope.repo).should.not.be.empty;
		});

		it('should get gist file name', function () {
			httpBackend.flush();

			var gistName = '';
			gistName = settingsCtrl.scope.getGistName();
			(gistName).should.be.equal('ring.erl');
		});

		it('should get number of contributors on init', function () {
			httpBackend.flush();

			(settingsCtrl.scope.signatures.length).should.be.equal(2);
		});

		// it('should get gist and create webhook on update action if gist url is given', function(){
		//     scope.user.value = {id: 123, login: 'login', admin: true};

		//     httpBackend.expect('POST', '/api/webhook/create', { repo: 'myRepo', owner: 'login' }).respond(null, {active: true});
		//     httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/gistId'}).respond(true);
		//     // httpBackend.expect('POST', '/api/repo/get', {repo: 'myRepo', owner: 'login'}).respond({repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/gistId'});
		//     httpBackend.expect('POST', '/api/cla/getAll', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'https://gist.github.com/gistId'}}).respond();
		//     httpBackend.expect('POST', '/api/cla/getGist', {repo: 'myRepo', owner: 'login', gist: {gist_url: 'https://gist.github.com/gistId'}}).respond({id: 'gistId'});

		//     settingsCtrl.scope.update();

		//     httpBackend.flush();
		//     (settingsCtrl.scope.repo.active).should.be.ok;
		//     (settingsCtrl.scope.gist.id).should.be.equal('gistId');
		// });

		// it('should remove webhook for the selected repo on update action if there is NO gist', function(){
		//     scope.user.value = {id: 123, login: 'login', admin: true};
		//     httpBackend.expect('POST', '/api/webhook/remove', { repo: 'myRepo', user: 'login' }).respond({});
		//     httpBackend.expect('POST', '/api/repo/update', { repo: 'myRepo', owner: 'login', gist: ''}).respond(true);
		//     // httpBackend.expect('POST', '/api/repo/get', {repo: 'myRepo', owner: 'login'}).respond({repo: 'myRepo', owner: 'login', gist: ''});

		//     settingsCtrl.scope.repo = {repo: 'myRepo', owner: 'login', gist: ''};
		//     settingsCtrl.scope.update();

		//     httpBackend.flush();
		//     (settingsCtrl.scope.repo.active).should.not.be.ok;
		// });

		it('should get all contributors signed this cla', function () {
			var repo = settingsCtrl.scope.repo;
			httpBackend.flush();

			httpBackend.expect('POST', '/api/cla/getAll', {
				repo: repo.repo,
				owner: repo.owner,
				gist: {
					gist_url: repo.gist
				}
			}).respond([{
				user: 'login',
				gist_version: '57a7f021a713b1c5a6a199b54cc514735d2d462f',
				created_at: '2010-04-16T02:15:15Z'
			}]);
			httpBackend.expect('POST', '/api/github/call', {
				obj: 'user',
				fun: 'getFrom',
				arg: {
					user: 'login'
				}
			}).respond({
				id: 12,
				login: 'login',
				name: 'name',
				html_url: 'url'
			});

			settingsCtrl.scope.getContributors();
			httpBackend.flush();

			(settingsCtrl.scope.contributors.length).should.be.equal(1);
			(settingsCtrl.scope.contributors[0].user_name).should.be.equal('login');
			(settingsCtrl.scope.contributors[0].repo_owner).should.be.equal(repo.owner);
			(settingsCtrl.scope.contributors[0].repo_name).should.be.equal(repo.repo);
			(settingsCtrl.scope.contributors[0].gist_name).should.be.equal('ring.erl');
			(settingsCtrl.scope.contributors[0].gist_url).should.be.equal(testData.url);
			(settingsCtrl.scope.contributors[0].gist_version).should.be.equal(testData.history[0].version);
			(settingsCtrl.scope.contributors[0].signed_at).should.be.equal('2010-04-16T02:15:15Z');
		});

		it('should get gist from github on getGist function', function () {
			httpBackend.expect('POST', '/api/cla/getGist', {
				repo: 'myRepo',
				owner: 'login',
				gist: {
					gist_url: 'https://gist.github.com/gistId'
				}
			}).respond({
				id: 'gistId'
			});

			settingsCtrl.scope.getGist();
			httpBackend.flush();

			(settingsCtrl.scope.gist.id).should.be.equal('gistId');
		});

		xit('should reload data for other gist versions on gistVersion', function () {
			scope.user.value = {
				id: 123,
				login: 'login',
				admin: true
			};

			settingsCtrl.scope.gist = testData;

			var args = {
				repo: 'myRepo',
				owner: 'login',
				gist: {
					gist_url: 'https://gist.github.com/gistId',
					gist_version: '57a7f021a713b1c5a6a199b54cc514735d2d4123'
				}
			};
			httpBackend.expect('POST', '/api/cla/get', {
				repo: 'myRepo',
				owner: 'login',
				gist: {
					gist_url: 'https://gist.github.com/gistId',
					gist_version: '57a7f021a713b1c5a6a199b54cc514735d2d4123'
				}
			}).respond({
				raw: '<p>cla text</p>'
			});
			httpBackend.expect('POST', '/api/cla/getAll', args).respond([{
				user: 'login'
			}]);
			httpBackend.expect('POST', '/api/github/call', {
				obj: 'user',
				fun: 'getFrom',
				arg: {
					user: 'login'
				}
			}).respond({
				id: 12,
				login: 'login',
				name: 'name'
			});


			settingsCtrl.scope.gistVersion(1);
			httpBackend.flush();

			(settingsCtrl.scope.gistIndex).should.be.equal(1);
			(settingsCtrl.scope.repo).should.be.ok;
			(settingsCtrl.scope.claText).should.be.ok;
		});

		describe('on validateLinkedRepo', function(){
			beforeEach(function(){
				httpBackend.flush();

				settingsCtrl.scope.gist = {};
				httpBackend.expect('POST', '/api/cla/getGist', {
					repo: 'myRepo',
					owner: 'login',
					gist: {
						gist_url: 'https://gist.github.com/gistId'
					}
				}).respond({
					id: 'gistId',
					url: 'https://gist.github.com/gistId'
				});
				httpBackend.expect('POST', '/api/webhook/get', {
					repo: 'myRepo',
					user: 'login'
				}).respond({
					id: 'webhookId'
				});

			});
			it('should indicate loading', function () {
				(settingsCtrl.scope.loading).should.not.be.ok;
				settingsCtrl.scope.validateLinkedRepo();

				(settingsCtrl.scope.loading).should.be.ok;
				httpBackend.flush();
				(settingsCtrl.scope.loading).should.not.be.ok;
			});

			it('should validate repo by checking repo, gist and webhook', function () {
				settingsCtrl.scope.validateLinkedRepo();

				httpBackend.flush();
				(settingsCtrl.scope.loading).should.not.be.ok;
				(settingsCtrl.scope.valid.gist).should.be.ok;
				(settingsCtrl.scope.valid.webhook).should.be.ok;
			});
		});

		it('should prepare array of contributors for export', function () {
			httpBackend.flush();
			sinon.stub(modal, 'open', function () {
				return;
			});
			httpBackend.expect('POST', '/api/cla/getAll', {
				repo: scope.repo.repo,
				owner: scope.repo.owner,
				gist: {
					gist_url: scope.repo.gist
				}
			}).respond([{
				user: 'login'
			}]);
			httpBackend.expect('POST', '/api/github/call', {
				obj: 'user',
				fun: 'getFrom',
				arg: {
					user: 'login'
				}
			}).respond({
				id: 12,
				login: 'login',
				name: 'name'
			});

			settingsCtrl.scope.getReport();
			httpBackend.flush();

			settingsCtrl.scope.contributors.length.should.be.equal(1);
		});

		it('should not call report modal if there are no signatures', function () {
			var modalCalled = false;
			httpBackend.expect('POST', '/api/cla/getAll', {
				repo: scope.repo.repo,
				owner: scope.repo.owner,
				gist: {
					gist_url: scope.repo.gist
				}
			}).respond([]);

			httpBackend.flush();
			sinon.stub(modal, 'open', function () {
				modalCalled = true;
				return;
			});

			settingsCtrl.scope.getReport();

			modalCalled.should.not.be.ok;
		});
	});

	describe('handling errors', function () {
		it('should load gist file only if gist url is given', function () {
			scope.repo = {
				repo: 'myRepo',
				owner: 'login',
				gist: ''
			};
			settingsCtrl = createCtrl();
			httpBackend.flush();

			(!!settingsCtrl.scope.gist.url).should.not.be.ok;
		});

		it('should handle error in getGist function', function () {
			settingsCtrl = createCtrl();
			httpBackend.expect('POST', '/api/cla/getGist', {
				repo: 'myRepo',
				owner: 'login',
				gist: {
					gist_url: 'https://gist.github.com/gistId'
				}
			}).respond(500, 'Error');
			httpBackend.expect('POST', '/api/webhook/get', {
				repo: 'myRepo',
				user: 'login'
			}).respond({
				id: 'webhookId'
			});
			// settingsCtrl.scope.getGist();
			httpBackend.flush();

			(!!settingsCtrl.scope.gist.url).should.not.be.ok;
		});
	});

});

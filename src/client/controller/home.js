// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

var isInArray = function(item, repos){
    function check (claRepo) {
        return claRepo.repo === item.name && claRepo.owner === item.owner.login;
    }
    return repos.some(check);
};

var deleteFromArray = function(item, array){
    var i = array.indexOf(item);
    if (i > -1) {
        array.splice(i, 1);
    }
};

module.controller('HomeCtrl', ['$rootScope', '$scope', '$document', '$HUB', '$RPC', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q', '$location',
        function ($rootScope, $scope, $document, $HUB, $RPC, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q, $location) {

            $scope.repos = [];
            $scope.gists = [];
            $scope.claRepos = [];
            $scope.selectedRepo = {};
            $scope.selectedGist = {};
            $scope.query = {};
            $scope.errorMsg = [];
            $scope.openSettings = false;
            $scope.users = [];
            $scope.selectedIndex = -1;
            $scope.user = {};
            $scope.nextstep = {
                step1: true
            };
            $scope.active = 0;
            $scope.defaultClas = [];
            var githubGists = 'https://api.github.com/gists?per_page=100';
            var githubUserRepos = 'https://api.github.com/user/repos?per_page=100&affiliation=owner,organization_member';


            $scope.logAdminIn = function () {
                $window.location.href = '/auth/github?admin=true';
            };

            $scope.isNotClaRepo = function (repo) {
                return !isInArray(repo, $scope.claRepos);
            };

            var mixRepoData = function (claRepo) {
                $scope.repos.some(function (repo) {
                    if (claRepo.repo === repo.name && claRepo.owner === repo.owner.login) {
                        claRepo.fork = repo.fork;
                        return true;
                    }
                });
                return claRepo;
            };

            var updateScopeData = function () {
                var repoSet = [];
                $scope.repos.forEach(function (repo) {
                    repoSet.push({
                        owner: repo.owner.login,
                        repo: repo.name,
                        repoId: repo.id
                    });
                });
                $RPCService.call('repo', 'getAll', {
                    set: repoSet
                }, function (err, data) {
                    if (err || !data) {
                        return;
                    }
                    $scope.claRepos = data.value;
                    $scope.claRepos.forEach(function (claRepo) {
                        claRepo.active = claRepo.gist ? true : false;
                        claRepo = mixRepoData(claRepo);
                    });
                });
            };

            var getUser = function () {
                $rootScope.user = {
                    value: {
                        admin: false
                    }
                };

                return $HUBService.call('user', 'get', {}, function (err, res) {
                    if (err) {
                        return;
                    }

                    $scope.user = res;
                    $scope.user.value.admin = false;

                    if (res.meta.scopes.indexOf('write:repo_hook') > -1) {
                        $scope.user.value.admin = true;
                    }
                    $rootScope.user = $scope.user;
                    $rootScope.$broadcast('user');
                });
            };

            var getRepos = function () {
                if ($scope.user && $scope.user.value && $scope.user.value.admin) {
                    $HUB.direct_call(githubUserRepos, {}, function (err, data) {
                        if (err || !data) {
                            return;
                        }
                        if (data.hasMore) {
                            data.getMore();
                        } else {
                            data.value.forEach(function (repo) {
                                if (repo.permissions.push) {
                                    $scope.repos.push(repo);
                                }
                            });
                            if ($scope.repos.length > 0) {
                                updateScopeData();
                            }
                        }
                    });
                }
            };

            var getGists = function () {
                $scope.gists = [];
                if (!$scope.defaultClas.length) {
                    $scope.getDefaultClaFiles().then(function () {
                        $scope.gists = $scope.gists.concat($scope.defaultClas);
                    });
                }
                $scope.gists = $scope.defaultClas.concat([]);

                $HUBService.direct_call(githubGists).then(function (data) {
                    if (data && data.value) {
                        data.value.forEach(function (gist) {
                            var gistFile = {};
                            gistFile.name = Object.keys(gist.files)[0];
                            gistFile.name = gist.files[gistFile.name].filename ? gist.files[gistFile.name].filename : gistFile.name;
                            gistFile.url = gist.html_url;
                            $scope.gists.push(gistFile);
                        });
                    }
                });
            };

            // var validateLinkedRepos = function(){

            // };

            var showErrorMessage = function (text) {
                var error = text;
                $timeout(function () {
                    deleteFromArray(error, $scope.errorMsg);
                }, 3000);

                $scope.errorMsg.push(error);
            };

            var linkSuccess = function () {
                var modal = $modal.open({
                    templateUrl: '/modals/templates/linkSuccess.html',
                    controller: 'LinkCtrl',
                    windowClass: 'link-success',
                    scope: $scope,
                    resolve: {
                        selectedGist: function () {
                            return $scope.selectedGist;
                        },
                        selectedRepo: function () {
                            return $scope.selectedRepo;
                        }
                    }
                });

                modal.result.then(function () {
                    $scope.selectedRepo = {};
                    $scope.selectedGist = {};
                    $scope.newLink = false;
                }, function () {
                    $scope.selectedRepo = {};
                    $scope.selectedGist = {};
                    $scope.newLink = false;
                });
            };

            var confirmAdd = function () {
                var modal = $modal.open({
                    templateUrl: '/modals/templates/confirmLink.html',
                    controller: 'ConfirmCtrl',
                    windowClass: 'confirm-add',
                    resolve: {
                        selectedGist: function () {
                            return $scope.selectedGist;
                        },
                        selectedRepo: function () {
                            return $scope.selectedRepo;
                        }
                    }
                });
                modal.result.then(function () {
                    $scope.linkStatus = null;
                    linkSuccess();
                    $scope.link().then(function () {
                        $scope.linkStatus = 'linked';
                    }, function () {
                        $scope.linkStatus = 'failed';
                    });
                });
            };

            $scope.confirmRemove = function (claRepo) {
                var modal = $modal.open({
                    templateUrl: '/modals/templates/confirmRemove.html',
                    controller: 'ConfirmCtrl',
                    windowClass: 'confirm-add',
                    resolve: {
                        selectedGist: function () {
                            return {};
                        },
                        selectedRepo: function () {
                            return claRepo;
                        }
                    }
                });
                modal.result.then(function (repo) {
                    $scope.remove(repo);
                });
            };

            $scope.info = function () {
                $modal.open({
                    templateUrl: '/modals/templates/info_gist.html',
                    controller: 'InfoCtrl',
                    windowClass: 'howto'
                });
            };

            $scope.getDefaultClaFiles = function () {
                return $RAW.get('/static/cla-assistant.json').then(function (data) {
                    $scope.defaultClas = data['default-cla'];
                });
            };

            $scope.count = function(){
                $RAW.get('/count/clas').then(function (data) {
                    $scope.numberClas = data.count;
                });
                $RAW.get('/count/repos').then(function (data) {
                    $scope.numberRepos = data.count;
                });
                $RAW.get('/count/stars').then(function (data) {
                    $scope.numberStars = data.count;
                });
            };

            getUser().then(function () {
                getRepos();
                getGists();
            }, function(){
                $scope.count();
            });

            $scope.clear = function ($event, obj) {
                $event.stopPropagation();
                if (obj === 'repo') {
                    $scope.selectedRepo.repo = undefined;
                } else if (obj === 'gist') {
                    $scope.selectedGist.gist = undefined;
                }
            };

            $scope.isValid = function (gist) {
                var valid = false;
                // valid = value ? !!value.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)\/[a-zA-Z0-9]*$/) : false;
                valid = gist ? !!gist.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;
                return valid;
            };

            $scope.addWebhook = function (claRepo) {
                // $scope.gistValid = $scope.isValid($scope.repo.gist);
                // if ($scope.repo.gist && !$scope.gistValid) {
                //     return;
                // }
                if (claRepo.gist) {
                    $RPCService.call('webhook', 'create', {
                        repo: claRepo.repo,
                        owner: claRepo.owner
                    }, function (err, data) {
                        if (!err && data && data.value) {
                            claRepo.active = data.value.active;
                        }
                    });
                }
            };

            $scope.removeWebhook = function (claRepo) {
                $RPCService.call('webhook', 'remove', {
                    repo: claRepo.repo,
                    user: claRepo.owner
                }, function (err) {
                    if (!err) {
                        claRepo.active = false;
                    }
                });
            };


            $scope.addRepo = function () {
                confirmAdd();
                // return;
            };

            $scope.link = function () {
                var newClaRepo = {
                    repo: $scope.selectedRepo.repo.name,
                    owner: $scope.selectedRepo.repo.owner.login,
                    repoId: $scope.selectedRepo.repo.id,
                    gist: $scope.selectedGist.gist.url
                };
                var promise1 = $RPCService.call('repo', 'create', newClaRepo, function (err, data) {
                    if (err && err.err.match(/.*duplicate key error.*/)) {
                        showErrorMessage('This repository is already set up.');
                    }
                    if (err || !data.value) {
                        $scope.removeWebhook(newClaRepo);
                        deleteFromArray(newClaRepo, $scope.claRepos);
                    } else {
                        $scope.claRepos.push(newClaRepo);
                        $scope.query.text = '';
                    }
                });

                newClaRepo.active = false;
                newClaRepo = mixRepoData(newClaRepo);

                var promise2 = $scope.addWebhook(newClaRepo);
                return $q.all([promise1, promise2]);
            };

            $scope.remove = function (claRepo) {
                $RPCService.call('repo', 'remove', {
                    repo: claRepo.repo,
                    owner: claRepo.owner,
                    gist: claRepo.gist
                }, function (err) {
                    if (!err) {
                        var i = $scope.claRepos.indexOf(claRepo);
                        if (i > -1) {
                            $scope.claRepos.splice(i, 1);
                        }
                    }
                });

                $scope.removeWebhook(claRepo);
            };

            $scope.isActive = function (viewLocation) {
                return viewLocation === $location.url();
            };

            $scope.groupDefaultCla = function (gist) {
                var found = false;

                $scope.defaultClas.some(function (defCla) {
                    if (gist.url === defCla.url) {
                        found = true;
                        return found;
                    }
                });

                return found ? 'Default CLAs' : 'My Gist Files';
            };

        }
    ])
    .directive('feature', ['$window', function () {
        return {
            templateUrl: '/templates/feature.html',
            scope: {
                id: '@',
                iconSrc: '@',
                header: '@',
                text: '@'
            }
        };
    }])
    .directive('textSlider', ['$window', '$timeout', function ($window, $timeout) {
        return {
            scope: {
                time: '@',
                active: '='
            },
            link: function (scope, element) {
                var children = element.children();
                var start = function () {
                    $timeout(function () {
                        scope.active = scope.active + 1 === children.length ? 0 : scope.active + 1;
                        start();
                    }, scope.time);
                };

                start();
            }
        };
    }]);

filters.filter('notIn', function () {
    return function (repos, arr) {

        if (arr.length === 0) {
            return repos;
        }

        var notMatched = [];

        repos.forEach(function (item) {
            if (!isInArray(item, arr)) {
                notMatched.push(item);
            }
        });
        return notMatched;
    };
});

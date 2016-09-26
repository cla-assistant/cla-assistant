// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

var isInArray = function(item, items) {
    function check(linkedItem) {
        if (!item.full_name) {
            return linkedItem.org === item.login;
        } else {
            return (linkedItem.repo === item.name && linkedItem.owner === item.owner.login)  || linkedItem.org === item.owner.login;
        }
    }
    return items.some(check);
};

var deleteFromArray = function(item, array) {
    var i = array.indexOf(item);
    if (i > -1) {
        array.splice(i, 1);
    }
};

module.controller('HomeCtrl', ['$rootScope', '$scope', '$document', '$HUB', '$RPC', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q', '$location', 'utils',
    function($rootScope, $scope, $document, $HUB, $RPC, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q, $location, utils) {

        $scope.active = 0;
        $scope.claRepos = [];
        $scope.claOrgs = [];
        $scope.defaultClas = [];
        $scope.errorMsg = [];
        $scope.gists = [];
        $scope.nextstep = {
            step1: true
        };
        $scope.openSettings = false;
        $scope.orgs = [];
        $scope.query = {};
        $scope.repos = [];
        $scope.reposAndOrgs = [];
        $scope.selected = {};
        $scope.selectedIndex = -1;
        $scope.users = [];
        $scope.user = {};
        var githubGists = 'https://api.github.com/gists?per_page=100';
        var githubUserRepos = 'https://api.github.com/user/repos?per_page=100&affiliation=owner,organization_member';


        $scope.logAdminIn = function() {
            $window.location.href = '/auth/github';
        };

        var mixOrgData = function (claOrg) {
            $scope.orgs.some(function (org) {
                if (org.id == claOrg.orgId) {
                    claOrg.avatar_url = org.avatar_url;
                    return true;
                }
            });
        };

        var getLinkedOrgs = function () {
            $scope.claOrgs = [];
            $RPCService.call('org', 'getForUser', {}, function (err, data) {
                if (data && data.value) {
                    data.value.forEach(function (org) {
                            mixOrgData(org);
                            $scope.claOrgs.push(org);
                    });
                }
            });
        };

        var mixRepoData = function(claRepo) {
            $scope.repos.some(function(repo) {
                if (claRepo.repo === repo.name && claRepo.owner === repo.owner.login) {
                    claRepo.fork = repo.fork;
                    return true;
                }
            });
            return claRepo;
        };

        var getLinkedRepos = function() {
            var repoSet = [];
            $scope.repos.forEach(function(repo) {
                repoSet.push({
                    repoId: repo.id
                });
            });
            $RPCService.call('repo', 'getAll', {
                set: repoSet
            }, function(err, data) {
                if (err || !data) {
                    return;
                }
                $scope.claRepos = data.value;
                $scope.claRepos.forEach(function(claRepo) {
                    claRepo = mixRepoData(claRepo);
                });
            });

            $scope.reposAndOrgs = $scope.user.value.org_admin ? $scope.orgs.concat($scope.repos) : $scope.repos;
        };

        var getUser = function() {
            $rootScope.user = {
                value: {
                    admin: false
                }
            };

            return $HUBService.call('users', 'get', {}, function(err, res) {
                if (err) {
                    return;
                }

                $scope.user = res;
                $scope.user.value.admin = res.meta.scopes && res.meta.scopes.indexOf('write:repo_hook') > -1 ? true : false;
                $scope.user.value.org_admin = res.meta.scopes && res.meta.scopes.indexOf('admin:org_hook') > -1 ? true : false;
                $rootScope.user = $scope.user;
                $rootScope.$broadcast('user');
            });
        };

        var getRepos = function() {
            if ($scope.user && $scope.user.value && $scope.user.value.admin) {
                return $HUBService.direct_call(githubUserRepos, {}).then(function(data) {
                    data.value.forEach(function(repo) {
                        if (repo.permissions.push) {
                            $scope.repos.push(repo);
                        }
                    });
                    if ($scope.repos.length > 0) {
                        getLinkedRepos();
                    }
                });
            }
        };

        var getGists = function() {
            $scope.gists = [];
            if (!$scope.defaultClas.length) {
                $scope.getDefaultClaFiles().then(function() {
                    $scope.gists = $scope.gists.concat($scope.defaultClas);
                });
            }
            $scope.gists = $scope.defaultClas.concat([]);

            $HUBService.direct_call(githubGists).then(function(data) {
                if (data && data.value) {
                    data.value.forEach(function(gist) {
                        var gistFile = {};
                        gistFile.name = utils.getGistAttribute(gist, 'filename');
                        gistFile.url = gist.html_url;
                        $scope.gists.push(gistFile);
                    });
                }
            });
        };

        var getOrgs = function () {
            var deferred = $q.defer();
            deferred.reject();
            return $scope.user.value.org_admin ? $RPCService.call('org', 'getGHOrgsForUser').then(function (res) {
                if (res && res.value){
                    $scope.orgs = res.value;
                }
            }) : deferred.promise;
        };

        var showErrorMessage = function(text) {
            var error = text;
            $timeout(function() {
                deleteFromArray(error, $scope.errorMsg);
            }, 5000);

            $scope.errorMsg.push(error);
        };

        var linkSuccess = function() {
            var modal = $modal.open({
                templateUrl: '/modals/templates/linkSuccess.html',
                controller: 'LinkCtrl',
                windowClass: 'link-success',
                scope: $scope,
                resolve: {
                    selected: function() {
                        return $scope.selected;
                    }
                }
            });

            modal.result.then(function() {
                $scope.selected = {};
                $scope.newLink = false;
            }, function() {
                $scope.selected = {};
                $scope.newLink = false;
            });
        };

        var confirmAdd = function() {
            var modal = $modal.open({
                templateUrl: '/modals/templates/confirmLink.html',
                controller: 'ConfirmCtrl',
                windowClass: 'confirm-add',
                resolve: {
                    selected: function() {
                        return $scope.selected;
                    }
                }
            });
            modal.result.then(function() {
                $scope.linkStatus = null;
                linkSuccess();
                $scope.link().then(function() {
                    $scope.linkStatus = 'linked';
                }, function() {
                    $scope.linkStatus = 'failed';
                });
            });
        };

        $scope.confirmRemove = function(linkedItem) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/confirmRemove.html',
                controller: 'ConfirmCtrl',
                windowClass: 'confirm-add',
                resolve: {
                    selected: function() {
                        return {item: linkedItem};
                    }
                }
            });
            modal.result.then(function(org) {
                $scope.remove(org);
            });
        };

        $scope.info = function() {
            $modal.open({
                templateUrl: '/modals/templates/info_gist.html',
                controller: 'InfoCtrl',
                windowClass: 'howto'
            });
        };

        $scope.addScope = function() {
            var modal = $modal.open({
                templateUrl: '/modals/templates/add_scope.html',
                controller: 'AddScopeCtrl',
                windowClass: 'howto'
            });
            modal.result.then(function() {
                $window.location.href = '/auth/github?admin=true&org_admin=true';
            });
        };

        $scope.getDefaultClaFiles = function() {
            return $RAW.get('/static/cla-assistant.json').then(function(data) {
                $scope.defaultClas = data['default-cla'];
            });
        };

        $scope.count = function() {
            $RAW.get('/count/clas').then(function(data) {
                $scope.numberClas = data.count;
            });
            $RAW.get('/count/repos').then(function(data) {
                $scope.numberRepos = data.count;
            });
            $RAW.get('/count/stars').then(function(data) {
                $scope.numberStars = data.count;
            });
        };

        getUser().then(function() {
            getOrgs().then(function () {
                getLinkedOrgs();
                getRepos();
            }, function () {
                getRepos();
            });
            getGists();
        }, function() {
            $scope.count();
        });

        $scope.clear = function($event, obj) {
            $event.stopPropagation();
            if (obj === 'repo') {
                $scope.selected.item = undefined;
            } else if (obj === 'gist') {
                $scope.selected.gist = undefined;
            }
        };

        $scope.isValid = function(gist) {
            var valid = false;
            // valid = value ? !!value.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)\/[a-zA-Z0-9]*$/) : false;
            valid = gist ? !!gist.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;
            return valid;
        };

        $scope.isRepo = function(item) {
            return item.full_name ? true : false;
        };

        $scope.addWebhook = function(item) {
            if (item.gist) {
                $RPCService.call('webhook', 'create', item, function(err, data) {
                    if (!err && data && data.value) {
                        item.active = data.value.active;
                    }
                });
            }
        };

        $scope.removeWebhook = function (linkedItem) {
            var arg = linkedItem.org ? {
                org: linkedItem.org
            } : {
                repo: linkedItem.repo,
                user: linkedItem.owner
            };
            $RPCService.call('webhook', 'remove', arg, function() {});
        };


        $scope.linkCla = function() {
            confirmAdd();
        };

        var linkItem = function(obj, item) {
            var linkedArray = obj === 'org' ? $scope.claOrgs : $scope.claRepos;
            var promise1 = $RPCService.call(obj, 'create', item, function(err, data) {
                if (err && err.errmsg.match(/.*duplicate key error.*/)) {
                    showErrorMessage('This repository is already set up.');
                }
                else if (err || !data.value) {
                    err && err.errmsg ? showErrorMessage(err.errmsg) : null;
                    $scope.removeWebhook(item);
                    deleteFromArray(item, linkedArray);
                } else {
                    linkedArray.push(item);
                    $scope.query.text = '';
                }
            });

            item.active = false;

            var promise2 = $scope.addWebhook(item);
            return $q.all([promise1, promise2]);
        };

        var linkRepo = function() {
            var newClaRepo = {
                repo: $scope.selected.item.name,
                owner: $scope.selected.item.owner.login,
                repoId: $scope.selected.item.id,
                gist: $scope.selected.gist.url
            };
            newClaRepo = mixRepoData(newClaRepo);
            return linkItem('repo', newClaRepo);
        };

        var linkOrg = function() {
            var newClaOrg = {
                orgId: $scope.selected.item.id,
                org: $scope.selected.item.login,
                gist: $scope.selected.gist.url,
                excludePattern: $scope.selected.item.excludePattern
            };
            mixOrgData(newClaOrg);
            return linkItem('org', newClaOrg);
        };

        $scope.link = function() {
            return $scope.isRepo($scope.selected.item) ? linkRepo() : linkOrg();
        };

        $scope.remove = function (linkedItem) {
            var api = linkedItem.orgId ? 'org' : 'repo';
            var removeArgs = linkedItem.orgId ?
                {
                    orgId: linkedItem.orgId
                } : {
                    repoId: linkedItem.repoId
                };
            $RPCService.call(api, 'remove', removeArgs, function(err) {
                if (!err) {
                    return api === 'org' ? getLinkedOrgs() : getLinkedRepos();
                }
            });

            $scope.removeWebhook(linkedItem);
        };

        $scope.isActive = function(viewLocation) {
            return viewLocation === $location.url();
        };

        $scope.groupDefaultCla = function(gist) {
            var found = false;

            $scope.defaultClas.some(function(defCla) {
                if (gist.url === defCla.url) {
                    found = true;
                    return found;
                }
            });

            return found ? 'Default CLAs' : 'My Gist Files';
        };

        $scope.groupOrgs = function(item) {
            return item.full_name ? 'Repositories' : 'Organisations';
        };

    }
])
    .directive('feature', ['$window', function() {
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
    .directive('textSlider', ['$window', '$timeout', function($window, $timeout) {
        return {
            scope: {
                time: '@',
                active: '='
            },
            link: function(scope, element) {
                var children = element.children();
                var start = function() {
                    $timeout(function() {
                        scope.active = scope.active + 1 === children.length ? 0 : scope.active + 1;
                        start();
                    }, scope.time);
                };

                start();
            }
        };
    }]);

filters.filter('notIn', function() {
    return function(items, arr) {

        if (arr.length === 0) {
            return items;
        }

        var notMatched = [];

        items.forEach(function(item) {
            if (!isInArray(item, arr)) {
                notMatched.push(item);
            }
        });
        return notMatched;
    };
});

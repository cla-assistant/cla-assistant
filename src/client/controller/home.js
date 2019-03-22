// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

var isInArray = function (item, items) {
    function check(linkedItem) {
        if (!item.full_name) {
            return linkedItem.org === item.login; // The item is an org
        }

        return linkedItem.repo === item.name && linkedItem.owner === item.owner.login; // The item is a repo
    }

    return items.some(check);
};

var deleteFromArray = function (item, array) {
    var i = array.indexOf(item);
    if (i > -1) {
        array.splice(i, 1);
    }
};

module.controller('HomeCtrl', ['$rootScope', '$scope', '$document', '$HUB', '$RPC', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q', '$location', '$state', 'utils', 'linkItemService',
    function ($rootScope, $scope, $document, $HUB, $RPC, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q, $location, $state, utils, linkItemService) {

        $scope.active = 0;
        $scope.claRepos = [];
        $scope.claOrgs = [];
        $scope.defaultClas = [];
        $scope.errorMsg = [];
        $scope.gists = [];
        $scope.orgs = [];
        $scope.query = {};
        $scope.repos = [];
        $scope.reposAndOrgs = [];
        $scope.selected = {};
        $scope.selectedIndex = -1;
        $scope.users = [];
        $scope.user = {};
        $scope.isLoading = false;
        $scope.showActivity = $location.host().indexOf('cla-assistant.io') > -1;

        $scope.logAdminIn = function () {
            $window.location.href = '/auth/github';
        };

        var mixOrgData = function (claOrg) {
            $scope.orgs.some(function (org) {
                if (org.id == claOrg.orgId) {
                    claOrg.avatarUrl = org.avatarUrl;

                    return true;
                }
            });
        };

        var getLinkedOrgs = function () {
            $scope.claOrgs = [];

            return $RPCService.call('org', 'getForUser', {}).then(function (data) {
                if (data && data.value) {
                    data.value.forEach(function (org) {
                        mixOrgData(org);
                        $scope.claOrgs.push(org);
                    });
                }
            });
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

        var getLinkedRepos = function () {
            var repoSet = [];
            $scope.repos.forEach(function (repo) {
                repoSet.push({
                    repoId: repo.id
                });
            });

            return $RPCService.call('repo', 'getAll', {
                set: repoSet
            }).then(function (data) {
                if (!data) {
                    return;
                }
                $scope.claRepos = data.value;
                // eslint-disable-next-line no-unused-vars
                $scope.claRepos.forEach(function (claRepo) {
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

            return $HUBService.call('users', 'getAuthenticated', {}, function (err, res) {
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

        var getRepos = function () {
            if ($scope.user && $scope.user.value && $scope.user.value.admin) {
                return $HUBService.call('repos', 'getAll', {
                    per_page: 100,
                    affiliation: 'owner,organization_member'
                }).then(function (data) {
                    data.value.forEach(function (repo) {
                        if (repo.permissions.push) {
                            $scope.repos.push(repo);
                        }
                    });
                    if ($scope.repos.length > 0) {
                        return getLinkedRepos();
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

            $HUBService.call('gists', 'getAll').then(function (data) {
                if (data && data.value) {
                    data.value.forEach(function (gist) {
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
            if (!$scope.user.value.org_admin) {
                deferred.resolve();

                return deferred.promise;
            }

            return $RPCService.call('org', 'getGHOrgsForUser').then(function (res) {
                if (res && res.value) {
                    $scope.orgs = res.value;
                }
                if ($scope.orgs.length > 0) {
                    return getLinkedOrgs();
                }
            });
        };

        var showErrorMessage = function (text) {
            var error = text;
            $timeout(function () {
                deleteFromArray(error, $scope.errorMsg);
            }, 5000);

            $scope.errorMsg.push(error);
        };

        var linkSuccess = function () {
            var modal = $modal.open({
                templateUrl: '/modals/templates/linkSuccess.html',
                controller: 'LinkCtrl',
                windowClass: 'link-success',
                scope: $scope,
                resolve: {
                    selected: function () {
                        return $scope.selected;
                    }
                }
            });

            modal.result.then(function () {
                $scope.selected = {};
                $scope.newLink = false;
            }, function () {
                $scope.selected = {};
                $scope.newLink = false;
            });
        };

        var confirmAdd = function () {
            var modal = $modal.open({
                templateUrl: '/modals/templates/confirmLink.html',
                controller: 'ConfirmCtrl',
                windowClass: 'confirm-add',
                resolve: {
                    selected: function () {
                        return $scope.selected;
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

        $scope.confirmRemove = function (linkedItem) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/confirmRemove.html',
                controller: 'ConfirmCtrl',
                windowClass: 'confirm-add',
                resolve: {
                    selected: function () {
                        return {
                            item: linkedItem
                        };
                    }
                }
            });
            modal.result.then(function (org) {
                $scope.remove(org);
            });
        };

        $scope.info = function () {
            $modal.open({
                templateUrl: '/modals/templates/info_gist.html',
                controller: 'InfoCtrl',
                windowClass: 'howto'
            });
        };

        $scope.addScope = function () {
            var modal = $modal.open({
                templateUrl: '/modals/templates/add_scope.html',
                controller: 'AddScopeCtrl',
                windowClass: 'howto'
            });
            modal.result.then(function () {
                $window.location.href = '/auth/github?admin=true&org_admin=true';
            });
        };

        $scope.gistShareInfo = function () {
            $modal.open({
                templateUrl: '/modals/templates/info_share_gist.html',
                controller: 'InfoCtrl',
                windowClass: 'howto'
            });
        };

        $scope.getDefaultClaFiles = function () {
            var promise = $RAW.get('/static/cla-assistant.json');
            promise.then(function (res) {
                $scope.defaultClas = res.data['default-cla'];
            });

            return promise;
        };

        $scope.count = function () {
            $RAW.get('/count/clas').then(function (res) {
                $scope.numberClas = res.data.count;
            });
            $RAW.get('/count/repos').then(function (res) {
                $scope.numberRepos = res.data.count;
            });
            $RAW.get('/count/stars').then(function (res) {
                $scope.numberStars = res.data.count;
            });
        };

        getUser().then(function () {
            $scope.isLoading = true;
            $q.all([
                getOrgs(),
                getRepos(),
                getGists()
            ]).then(function () {
                $scope.reposAndOrgs = $scope.user.value.org_admin ? $scope.orgs.concat($scope.repos) : $scope.repos;
                $scope.isLoading = false;
            }, function () {
                $scope.isLoading = false;
            });
        }, function () {
            if ($scope.showActivity) {
                $scope.count();
            }
        });

        $scope.clear = function ($event, obj) {
            $event.stopPropagation();
            if (obj === 'repo') {
                $scope.selected.item = undefined;
            } else if (obj === 'gist') {
                $scope.selected.gist = undefined;
            }
        };

        $scope.isValid = function (gist) {
            var valid = false;
            // valid = value ? !!value.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)\/[a-zA-Z0-9]*$/) : false;
            valid = gist ? !!gist.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;

            return valid;
        };

        $scope.isRepo = function (item) {
            return item && (item.full_name || item.repoId) ? true : false;
        };

        $scope.linkCla = function () {
            confirmAdd();
        };

        // var linkItem = function (obj, item) {
        //     var linkedArray = obj === 'org' ? $scope.claOrgs : $scope.claRepos;
        //     item.active = false;

        //     return $RPCService.call(obj, 'create', item, function (err, data) {
        //         if (err && err.message.match(/.*duplicate key error.*/)) {
        //             showErrorMessage('This repository is already set up.');
        //         } else if (err || !data.value) {
        //             if (err && err.message) {
        //                 showErrorMessage(err.message);
        //             }
        //             deleteFromArray(item, linkedArray);
        //         } else {
        //             item.active = true;
        //             linkedArray.push(item);
        //             $scope.query.text = '';
        //         }
        //     });
        // };

        // var linkRepo = function () {
        //     var newClaRepo = {
        //         repo: $scope.selected.item.name,
        //         owner: $scope.selected.item.owner.login,
        //         repoId: $scope.selected.item.id,
        //         gist: $scope.selected.gist.url,
        //         sharedGist: $scope.selected.sharedGist,
        //         minFileChanges: $scope.selected.minFileChanges,
        //         minCodeChanges: $scope.selected.minCodeChanges
        //     };
        //     newClaRepo = mixRepoData(newClaRepo);

        //     return linkItem('repo', newClaRepo);
        // };

        // var linkOrg = function () {
        //     var newClaOrg = {
        //         orgId: $scope.selected.item.id,
        //         org: $scope.selected.item.login,
        //         gist: $scope.selected.gist.url,
        //         excludePattern: $scope.selected.item.excludePattern,
        //         sharedGist: $scope.selected.sharedGist,
        //         minFileChanges: $scope.selected.minFileChanges,
        //         minCodeChanges: $scope.selected.minCodeChanges
        //     };
        //     mixOrgData(newClaOrg);

        //     return linkItem('org', newClaOrg);
        // };

        $scope.link = function () {
            var options = {
                gist: $scope.selected.gist,
                sharedGist: $scope.selected.sharedGist,
                minFileChanges: $scope.selected.minFileChanges,
                minCodeChanges: $scope.selected.minCodeChanges,
                excludePattern: $scope.selected.item.excludePattern,
                whiteListPattern: $scope.selected.whiteListPattern
            };
            var promise = linkItemService.createLink($scope.selected.item, options);

            promise.then(function success(data) {
                var linkedItem = data.value;
                var linkedArray = $scope.isRepo($scope.selected.item) ? $scope.claRepos : $scope.claOrgs;
                if (linkedItem) {
                    if ($scope.isRepo(linkedItem)) {
                        mixRepoData(linkedItem);
                    } else {
                        mixOrgData(linkedItem);
                    }
                    linkedItem.active = true;
                    linkedArray.push(linkedItem);
                    $scope.query.text = '';
                } else {
                    deleteFromArray($scope.selected.item, linkedArray);
                }
            }, function error(err) {
                if (err && err.message.match(/.*duplicate key error.*/)) {
                    showErrorMessage('This repository is already set up.');
                } else if (err && err.message) {
                    showErrorMessage(err.message);
                }
            });

            return promise;
        };

        $scope.remove = function (linkedItem) {
            var api = linkedItem.orgId ? 'org' : 'repo';
            var removeArgs = linkedItem.orgId ? {
                orgId: linkedItem.orgId
            } : {
                    repoId: linkedItem.repoId
                };
            $RPCService.call(api, 'remove', removeArgs, function (err) {
                if (!err) {
                    return api === 'org' ? getLinkedOrgs() : getLinkedRepos();
                }
            });
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

        $scope.groupOrgs = function (item) {
            return item.full_name ? 'Repositories' : 'Organisations';
        };

        var handleNullCla = function (item) {
            var nullCla = {
                name: 'No CLA',
                url: null
            };
            var clearDropdown = function (item) {
                if (item && $scope.isRepo(item)) {
                    if (!$scope.gists.some(function (cla) {
                        return cla.name === nullCla.name && cla.url === nullCla.url;
                    })) {
                        $scope.gists.push(nullCla);
                    }
                } else {
                    $scope.gists = $scope.gists.filter(function (cla) {
                        return cla.name !== nullCla.name && cla.url !== nullCla.url;
                    });
                }
            };
            var clearGistSelection = function (item) {
                if (!$scope.isRepo(item) && $scope.selected.gist && $scope.selected.gist.name === nullCla.name && $scope.selected.gist.url === nullCla.url) {
                    $scope.selected.gist = undefined;
                }
            };

            clearDropdown(item);
            clearGistSelection(item);
        };

        $scope.$watch('selected.item', function (newValue) {
            handleNullCla(newValue);
        });

        $scope.isComplete = function () {
            return $scope.selected.item && $scope.selected.gist && (($scope.isRepo($scope.selected.item) && (!$scope.selected.gist.url || $scope.isValid($scope.selected.gist.url))) || (!$scope.isRepo($scope.selected.item) && $scope.isValid($scope.selected.gist.url)));
        };

        $scope.showTOS = function () {
            return !$state.current.name.includes('repo');
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
                function start() {
                    $timeout(function () {
                        scope.active = scope.active + 1 === children.length ? 0 : scope.active + 1;
                        start();
                    }, scope.time);
                }

                start();
            }
        };
    }]);

filters.filter('notIn', function () {
    return function (items, arr) {

        if (arr.length === 0) {
            return items;
        }

        var notMatched = [];

        items.forEach(function (item) {
            if (!isInArray(item, arr)) {
                notMatched.push(item);
            }
        });

        return notMatched;
    };
});

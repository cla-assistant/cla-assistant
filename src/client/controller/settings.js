// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPC', '$RPCService', '$HUBService', '$window', '$sce', '$modal', '$q', 'utils',
    function ($rootScope, $scope, $stateParams, $HUB, $RPC, $RPCService, $HUBService, $window, $sce, $modal, $q, utils) {

        $scope.gist = {};
        $scope.gistIndex = 0;
        $scope.admin = false;
        $scope.errorMsg = [];
        $scope.loading = false;
        $scope.gistUrlIsValid = true;
        $scope.valid = {};
        $scope.signatures = {};
        $scope.contributors = [];
        var webhook = {};

        var csvHeader = ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL', 'Gist Version', 'Signed At', 'Signed for Organisation'];
        $scope.csvHeader = csvHeader.concat();

        function gistArgs() {
            var args = {
                gist_url: $scope.item.gist
            };
            if ($scope.gist.history && $scope.gist.history.length > 0) {
                args.gist_version = $scope.gist.history[$scope.gistIndex].version;
            }
            return args;
        }
        // var validateGistUrl = function (gist_url) {
        //     var valid = false;
        //     valid = gist_url ? !!gist_url.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;
        //     return valid ? gist_url : undefined;
        // };

        $scope.open_error = function () {
            $modal.open({
                templateUrl: '/modals/templates/error_modal.html',
                controller: 'ErrorCtrl'
            });
        };

        $scope.getSignatures = function (linkedItem, gist_version, cb) {
            return $RPC.call('cla', 'getAll', {
                repoId: linkedItem.repoId,
                orgId: linkedItem.orgId,
                gist: {
                    gist_url: linkedItem.gist,
                    gist_version: gist_version
                }
            }, cb);
        };

        var getCustomFields = function (linkedItem, gist_version, cb) {
            utils.getGistContent(linkedItem.repoId, linkedItem.orgId, linkedItem.gist, gist_version).then(
                function(gistContent) {
                    if (gistContent.hasCustomFields) {
                        $scope.csvHeader = csvHeader.concat();
                        gistContent.customKeys.forEach(function (key) {
                            var field = gistContent.customFields[key];
                            $scope.csvHeader.push(field.title || key);
                        });
                        cb(null, gistContent.customKeys);
                    } else {
                        cb();
                    }
                },
                function fail(err) {
                    cb(err);
                }
            );
        };

        var getWebhook = function () {
            return $RPCService.call('webhook', 'get', {
                repo: $scope.item.repo,
                user: $scope.item.owner,
                org: $scope.item.org
            }, function (err, obj) {
                if (!err && obj && obj.value) {
                    webhook = obj.value;
                    $scope.valid.webhook = webhook.active;
                }
            });
        };

        $scope.getContributors = function (gist_version, cb) {
            var customKeys;
            getCustomFields($scope.item, gist_version, function (err, keys) {
                customKeys = keys ? keys : customKeys;

                $scope.getSignatures($scope.item, gist_version, function (err, data) {
                    $scope.contributors = [];
                    if (data && data.value && data.value.length > 0) {
                        data.value.forEach(function (signature) {
                            var contributor = {};
                            contributor.user_name = signature.user;
                            contributor.repo_owner = signature.owner;
                            contributor.repo_name = signature.repo;
                            contributor.gist_name = $scope.getGistName();
                            contributor.gist_url = signature.gist_url;
                            contributor.gist_version = signature.gist_version;
                            contributor.signed_at = signature.created_at;
                            contributor.org_cla = signature.org_cla;
                            if (customKeys && signature.custom_fields) {
                                var customFields = JSON.parse(signature.custom_fields);
                                customKeys.forEach(function (key) {
                                    contributor[key] = customFields[key];
                                });
                            }
                            $scope.contributors.push(contributor);
                        });
                    }
                    if (typeof cb == 'function') {
                        cb();
                    }
                });
            });

        };

        $scope.getGist = function () {
            return $RPCService.call('cla', 'getGist', {
                repo: $scope.item.repo,
                owner: $scope.item.owner,
                gist: gistArgs()
            }, function (err, data) {
                if (!err && data.value) {
                    $scope.gist = data.value;
                    $scope.valid.gist = $scope.gist && $scope.gist.id ? true : false;
                    getCustomFields($scope.item, gistArgs().gist_version, function (err) {
                        $scope.valid.gist = err ? false : $scope.valid.gist;
                    });
                }
                $scope.gist.linked = true;
            });
        };

        $scope.getGistName = function () {
            $scope.gist.fileName = $scope.gist.fileName ? $scope.gist.fileName : utils.getGistAttribute($scope.gist, 'filename');
            return $scope.gist.fileName;
        };

        // var showErrorMessage = function(text) {
        //     var error = text;
        //     $timeout(function(){
        //         var i = $scope.errorMsg.indexOf(error);
        //         if (i > -1) {
        //             $scope.errorMsg.splice(i, 1);
        //         }
        //     }, 3000);

        //     $scope.errorMsg.push(error);
        // };

        $scope.validateLinkedItem = function () {
            var promises = [];
            if ($scope.item.gist) {
                $scope.loading = true;
                promises.push($scope.getGist());
                promises.push(getWebhook());
                $q.all(promises).then(function () {
                    $scope.signatures = $scope.getSignatures($scope.item, gistArgs().gist_version);
                    $scope.loading = false;
                });
            }
        };

        $scope.isLinkActive = function () {
            return !$scope.loading && $scope.valid.gist && $scope.valid.webhook;
        };

        $scope.renderHtml = function (html_code) {
            return $sce.trustAsHtml(html_code);
        };

        var report = function (linkedItem) {
            $modal.open({
                templateUrl: '/modals/templates/report.html',
                controller: 'ReportCtrl',
                windowClass: 'report',
                scope: $scope,
                resolve: {
                    item: function () {
                        return linkedItem;
                    }
                }
            });
        };

        $scope.getReport = function () {
            if ($scope.signatures.value.length > 0) {
                $scope.getContributors(gistArgs().gist_version);
            }
            report($scope.item);
        };

        var validateRepoPr = function (repo, owner) {
            $scope.validatePR = $RPC.call('cla', 'validatePullRequests', {
                repo: repo,
                owner: owner
            }, function(){
                $scope.popoverIsOpen = false;
            });
        };
        var validateOrgPr = function (linkedItem) {
            $RPCService.call('cla', 'validateOrgPullRequests', {
                org: linkedItem.org
            }).then(function(){
                $scope.popoverIsOpen = false;
            });
        };

        $scope.recheck = function (linkedItem) {
            if (linkedItem.org) {
                validateOrgPr(linkedItem);
            } else {
                validateRepoPr(linkedItem.repo, linkedItem.owner);
            }
        };

        $scope.upload = function (linkedItem) {
            $scope.popoverIsOpen = false;
            var modal = $modal.open({
                templateUrl: '/modals/templates/upload.html',
                controller: 'UploadCtrl',
                windowClass: 'upload'
            });
            modal.result.then(function (users) {
                $RPCService.call('cla', 'upload', {
                    repo: linkedItem.repo,
                    owner: linkedItem.owner || linkedItem.org,
                    users: users
                }).then($scope.validateLinkedItem);
            });
        };

        $scope.getBadge = function (claRepo) {
            $scope.popoverIsOpen = false;
            $modal.open({
                templateUrl: '/modals/templates/badge.html',
                controller: 'BadgeCtrl',
                windowClass: 'get-badge',
                resolve: {
                    repo: function () {
                        return claRepo;
                    }
                }
            });
        };

        $scope.validateLinkedItem();
    }
]);

module.directive('settings', ['$document', function ($document) {
    return {
        templateUrl: '/templates/settings.html',
        controller: 'SettingsCtrl',
        transclude: true,
        scope: {
            item: '=',
            user: '=',
            repos: '='
        },
        link: function (scope, element) {
            var documentClickHandler = function (event) {
                var eventOutsideTarget = (element[0] !== event.target) && (element.find(event.target).length === 0);
                if (eventOutsideTarget) {
                    scope.$apply(function () {
                        scope.popoverIsOpen = false;
                    });
                }
            };

            $document.on('click', documentClickHandler);
            scope.$on('$destroy', function () {
                $document.off('click', documentClickHandler);
            });
        }
    };
}]);

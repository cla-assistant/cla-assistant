// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$RPC', '$RPCService', '$window', '$sce', '$modal', '$q', 'utils', '$log',
    function ($rootScope, $scope, $stateParams, $RPC, $RPCService, $window, $sce, $modal, $q, utils, $log) {

        $scope.gist = {};
        $scope.gistIndex = 0;
        $scope.admin = false;
        $scope.errorMsg = [];
        $scope.loading = false;
        $scope.gistUrlIsValid = true;
        $scope.valid = {};
        $scope.signatures = {};
        $scope.contributors = [];
        $scope.completeHistory = [];
        $scope.jsonUrl = undefined

        var webhook = {};

        var csvHeader = ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL', 'Gist Version', 'Signed At', 'Revoked At', 'Signed for Organization'];
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

        $scope.open_error = function () {
            $modal.open({
                templateUrl: '/assets/templates/modals/error_modal.html',
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
                },
                sharedGist: linkedItem.sharedGist
            }, cb);
        };

        var getCustomFields = function (linkedItem, gist_version, cb) {
            utils.getGistContent(linkedItem.repoId, linkedItem.orgId, linkedItem.gist, gist_version).then(
                function (gistContent) {
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
                owner: $scope.item.owner,
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
                if (err) {
                    $log.info(err);
                }
                customKeys = keys ? keys : customKeys;

                $scope.getSignatures($scope.item, gist_version, function (err, data) {
                    if (err) {
                        $log.info(err);
                    }
                    $scope.contributors = [];
                    $scope.completeHistory = [];
                    if (data && data.value && data.value.length > 0) {
                        var foundSigners = [];
                        data.value.forEach(function (signature) {
                            var contributor = buildContributor(signature, customKeys);
                            if (foundSigners.indexOf(signature.userId) < 0) {
                                foundSigners.push(signature.userId);
                                $scope.contributors.push(contributor);
                            }
                            $scope.completeHistory.push(contributor);
                        })
                    }
                    var jsonData = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($scope.completeHistory));
                    $scope.jsonUrl = 'data:' + jsonData;

                    if (typeof cb == 'function') {
                        cb();
                    }
                });
            });

        };

        var buildContributor = function (signature, customKeys) {
            var contributor = {};
            contributor.user_name = signature.user;
            contributor.repo_owner = signature.owner;
            contributor.repo_name = signature.repo;
            contributor.gist_name = $scope.getGistName();
            contributor.gist_url = signature.gist_url;
            contributor.gist_version = signature.gist_version;
            contributor.signed_at = signature.created_at;
            contributor.revoked_at = signature.revoked_at ? signature.revoked_at : '';
            contributor.org_cla = signature.org_cla;
            if (customKeys && signature.custom_fields) {
                var customFields = JSON.parse(signature.custom_fields);
                customKeys.forEach(function (key) {
                    contributor[key] = customFields[key];
                });
            }
            return contributor;
        }

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
            if (!$scope.item.gist) {
                return '';
            }
            $scope.gist.fileName = $scope.gist.fileName ? $scope.gist.fileName : utils.getGistAttribute($scope.gist, 'filename');

            return $scope.gist.fileName;
        };

        $scope.validateLinkedItem = function () {
            var promises = [];
            if ($scope.item.gist) {
                $scope.loading = true;
                promises.push($scope.getGist());
                promises.push(getWebhook());
                $q.all(promises).then(function () {
                    $scope.getSignatures($scope.item, gistArgs().gist_version, function (err, data) {
                        if(err) {
                            $log.info(err);
                        }
                        $scope.signatures = findDistinctSignatures(data);
                    })
                    $scope.loading = false;
                });
            }
        };

        var findDistinctSignatures = function(data) {
            var foundSigners = []
            var distinctSignatures = data.value.filter( function findUnqiueSigners(cla) {
                if (foundSigners.indexOf(cla.userId) < 0) {
                    foundSigners.push(cla.userId)
                    return true
                }
                return false
            })
            return distinctSignatures;
        }

        $scope.isLinkActive = function () {
            return (!$scope.loading && $scope.valid.gist && $scope.valid.webhook) || !$scope.item.gist;
        };

        $scope.renderHtml = function (html_code) {
            return $sce.trustAsHtml(html_code);
        };

        var report = function (linkedItem) {
            $modal.open({
                templateUrl: '/assets/templates/modals/report.html',
                controller: 'ReportCtrl',
                windowClass: 'report',
                scope: $scope,
                size: 'lg',
                resolve: {
                    item: function () {
                        return linkedItem;
                    }
                }
            });
        };

        $scope.getReport = function () {
            if ($scope.signatures.length > 0) {
                $scope.getContributors(gistArgs().gist_version);
            }
            report($scope.item);
        };

        var validateRepoPr = function (repo, owner) {
            $RPCService.call('cla', 'validateAllPullRequests', {
                repo: repo,
                owner: owner
            });
            $scope.popoverIsOpen = false;
        };
        var validateOrgPr = function (linkedItem) {
            $RPCService.call('cla', 'validateOrgPullRequests', {
                org: linkedItem.org
            });
            $scope.popoverIsOpen = false;
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
            getCustomFields(linkedItem, undefined, function (err, customFields) {
                if (err) {
                    //do nothing
                }
                var modal = $modal.open({
                    templateUrl: '/assets/templates/modals/upload.html',
                    controller: 'UploadCtrl',
                    windowClass: 'upload',
                    resolve: {
                        customFields: function () {
                            return customFields;
                        }
                    }
                });
                modal.result.then(function (signatures) {
                    $RPCService.call('cla', 'upload', {
                        repo: linkedItem.repo,
                        owner: linkedItem.owner || linkedItem.org,
                        signatures: signatures
                    }).then($scope.validateLinkedItem);
                });
            });
        };

        $scope.getBadge = function (claRepo) {
            $scope.popoverIsOpen = false;
            $modal.open({
                templateUrl: '/assets/templates/modals/badge.html',
                controller: 'BadgeCtrl',
                windowClass: 'get-badge',
                resolve: {
                    repo: function () {
                        return claRepo;
                    }
                }
            });
        };

        $scope.editLinkedItem = function (linkedItem, gist, gists) {
            $scope.popoverIsOpen = false;
            var modal = $modal.open({
                templateUrl: '/assets/templates/modals/editLinkedItem.html',
                controller: 'EditLinkedItemCtrl',
                windowClass: 'edit-linked-item',
                resolve: {
                    item: function () {
                        return linkedItem;
                    },
                    gist: function () {
                        return gist;
                    },
                    gists: function () {
                        return gists;
                    }
                }
            });
            modal.result.then(function (updatedItem) {
                updatedItem.fork = $scope.item.fork;
                updatedItem.avatarUrl = $scope.item.avatarUrl;
                $scope.item = updatedItem;
                $scope.linkedItem = updatedItem;
                $scope.validateLinkedItem();
            }, function () {
                // do nothing on cancel
            });
        };

        $scope.getSignURL = function () {
            return $scope.item.repo ? $window.location + $scope.item.owner + '/' + $scope.item.repo : $window.location + ' ' + $scope.item.org;
        };

        $scope.validateLinkedItem();
    }
]);

module.directive('settings', ['$document', function ($document) {
    return {
        templateUrl: '/assets/templates/settings.html',
        controller: 'SettingsCtrl',
        transclude: true,
        scope: {
            item: '=',
            user: '=',
            repos: '=',
            gists: '='
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

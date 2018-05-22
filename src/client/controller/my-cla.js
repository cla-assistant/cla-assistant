// *****************************************************
// My-CLA Controller
//
// tmpl: my-cla.html.html
// path: /
// *****************************************************

module.controller('MyClaCtrl', ['$scope', '$filter', '$HUB', '$RAW', '$RPCService', '$HUBService', '$modal', 'utils',
    function ($scope, $filter, $HUB, $RAW, $RPCService, $HUBService, $modal, utils) {
        $scope.repos = [];
        $scope.gists = [];
        $scope.signedCLAs = [];
        $scope.signedCLAs = [];
        $scope.users = [];
        $scope.user = {};
        $scope.defaultClas = [];

        var orderBy = $filter('orderBy');

        var getUser = function () {
            $scope.user = { value: { admin: false } };

            return $HUBService.call('users', 'get', {}, function (err, res) {
                if (err) {
                    return;
                }

                $scope.user = res;
                $scope.user.value.admin = false;

                if (res.meta.scopes.indexOf('write:repo_hook') > -1) {
                    $scope.user.value.admin = true;
                }
            });
        };

        var getSignedCLA = function () {
            return $RPCService.call('cla', 'getSignedCLA', {
                user: $scope.user.value.login
            }, function (err, data) {
                if (!err && data) {
                    $scope.signedCLAs = data.value;
                    for (var i = 0; i < $scope.signedCLAs.length; i++) {
                        $scope.getGist($scope.signedCLAs[i]);
                        $scope.getVersionStatus($scope.signedCLAs[i]);
                    }
                }
            });
        };

        $scope.getGist = function (repo) {
            $RPCService.call('cla', 'getGist', {
                repo: repo.repo,
                owner: repo.owner,
                gist: {
                    gist_url: repo.gist_url,
                    gist_version: repo.gist_version
                }
            }, function (err, data) {
                if (!err && data.value) {
                    repo.gistObj = data.value;
                }
            });
        };

        $scope.getGistName = function (gistObj) {
            return utils.getGistAttribute(gistObj, 'filename');
        };

        getUser().then(function () {
            getSignedCLA();
        });

        $scope.order = function (predicate, reverse) {
            $scope.signedCLAs = orderBy($scope.signedCLAs, predicate, reverse);
        };

        $scope.getDefaultClaFiles = function () {
            return $RAW.get('/static/cla-assistant.json').then(function (res) {
                $scope.defaultClas = res.data['default-cla'];
            });
        };

        $scope.getClaView = function (signedCLA) {
            $modal.open({
                templateUrl: '/modals/templates/claView.html',
                controller: 'ClaViewCtrl',
                scope: $scope,
                resolve: {
                    cla: function () { return signedCLA; }
                }
            });
        };

        $scope.getGistVersion = function (gistObj) {
            return utils.getGistAttribute(gistObj, 'updated_at');
        };

        $scope.getVersionView = function (signedCLA) {
            if (signedCLA.newCLA) {
                signedCLA.noCLA = false;

                if (signedCLA.newCLA.html_url !== signedCLA.gist_url) {
                    signedCLA.showCLA = true;
                } else {
                    signedCLA.showCLA = false;
                }
            } else {
                signedCLA.noCLA = true;
            }
            $modal.open({
                templateUrl: '/modals/templates/versionView.html',
                controller: 'VersionViewCtrl',
                scope: $scope,
                resolve: {
                    cla: function () { return signedCLA; },
                    noCLA: function () { return signedCLA.noCLA; },
                    showCLA: function () { return signedCLA.showCLA; }
                }
            });
        };

        function getLinkedGist(signedCLA) {
            return $RPCService.call('cla', 'getGist', {
                repo: signedCLA.repo,
                owner: signedCLA.owner
            }, function (err, data) {
                if (!err && data.value) {
                    signedCLA.newCLA = data.value;
                }
            });
        }

        function checkCLA(signedCLA) {
            return $RPCService.call('cla', 'check', {
                repo: signedCLA.repo,
                owner: signedCLA.owner
            }, function (err, signed) {
                if (!err && signed.value && signed) {
                    signedCLA.signed = true;
                } else {
                    signedCLA.signed = false;
                    getLinkedGist(signedCLA);
                }
            });
        }

        $scope.getVersionStatus = function (signedCLA) {
            checkCLA(signedCLA).then(function () {
                if (signedCLA.signed) {
                    signedCLA.stat = true;
                } else {
                    signedCLA.stat = false;
                }
            });
        };
    }
]);

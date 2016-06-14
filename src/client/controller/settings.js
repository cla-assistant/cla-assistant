// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPC', '$RPCService', '$HUBService', '$window', '$sce', '$modal', '$q',
    function ($rootScope, $scope, $stateParams, $HUB, $RPC, $RPCService, $HUBService, $window, $sce, $modal, $q) {

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

        $scope.csvHeader = ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL', 'Gist Version', 'Signed At'];

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

        $scope.getSignatures = function (claRepo, gist_version, cb) {
            return $RPC.call('cla', 'getAll', {
                repo: claRepo.repo,
                owner: claRepo.owner,
                gist: {
                    gist_url: claRepo.gist,
                    gist_version: gist_version
                }
            }, cb);
        };

        var getWebhook = function () {
            return $RPCService.call('webhook', 'get', {
                repo: $scope.item.repo,
                user: $scope.item.owner
            }, function (err, obj) {
                if (!err && obj && obj.value) {
                    webhook = obj.value;
                    $scope.valid.webhook = webhook.active;
                }
            });
        };

        var getGithubUserData = function (login) {
            return $HUBService.call('users', 'getFrom', {
                user: login
            });
        };

        $scope.getContributors = function (gist_version) {
            return $scope.getSignatures($scope.item, gist_version, function (err, data) {
                $scope.contributors = [];
                if (data && data.value && data.value.length > 0) {
                    data.value.forEach(function (signature) {
                        var contributor = {};
                        contributor.user_name = signature.user;
                        contributor.repo_owner = $scope.item.owner;
                        contributor.repo_name = $scope.item.repo;
                        contributor.gist_name = $scope.getGistName();
                        contributor.gist_url = $scope.gist.url;
                        contributor.gist_version = signature.gist_version;
                        contributor.signed_at = signature.created_at;
                        $scope.contributors.push(contributor);
                        getGithubUserData(signature.user).then(function (user) {
                            contributor.html_url = user.html_url;
                        });
                    });
                }
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
                }
                $scope.gist.linked = true;
            });
        };

        $scope.getGistName = function () {
            var fileName = '';
            if ($scope.gist && $scope.gist.files) {
                fileName = Object.keys($scope.gist.files)[0];
                fileName = $scope.gist.files[fileName].filename ? $scope.gist.files[fileName].filename : fileName;
            }
            return fileName;
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

        $scope.validateLinkedRepo = function () {
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
            return !$scope.loading && $scope.valid.gist && $scope.valid.webhook ? true : false;
        };

        $scope.renderHtml = function (html_code) {
            return $sce.trustAsHtml(html_code);
        };

        var report = function (claRepo) {
            $modal.open({
                templateUrl: '/modals/templates/report.html',
                controller: 'ReportCtrl',
                windowClass: 'report',
                scope: $scope,
                resolve: {
                    repo: function () {
                        return claRepo;
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

        $scope.recheck = function (claRepo) {
            $scope.validatePR = $RPC.call('cla', 'validatePullRequests', {
                repo: claRepo.repo,
                owner: claRepo.owner
            }, function(){
                $scope.popoverIsOpen = false;
            });
        };

        $scope.upload = function (claRepo) {
            $scope.popoverIsOpen = false;
            var modal = $modal.open({
                templateUrl: '/modals/templates/upload.html',
                controller: 'UploadCtrl',
                windowClass: 'upload'
            });
            modal.result.then(function (users) {
                $RPCService.call('cla', 'upload', {
                    repo: claRepo.repo,
                    owner: claRepo.owner,
                    users: users
                }).then($scope.validateLinkedRepo);
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

        $scope.validateLinkedRepo();
    }
]);

module.directive('settings', ['$document', function ($document) {
    return {
        templateUrl: '/templates/settings.html',
        controller: 'SettingsCtrl',
        transclude: true,
        scope: {
            item: '=',
            user: '='
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

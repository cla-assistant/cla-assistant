// *****************************************************
// CLA Controller
//
// tmpl: cla.html
// *****************************************************

module.controller('ClaController', ['$rootScope', '$log', '$window', '$scope', '$stateParams', '$RPCService', '$HUBService', '$sce', '$timeout', '$http', '$q', 'utils',
    function ($rootScope, $log, $window, $scope, $stateParams, $RPCService, $HUBService, $sce, $timeout, $http, $q, utils) {

        $scope.cla = null;
        $scope.customFields = {};
        $scope.customValues = {};
        $scope.hasCustomFields = false;
        $scope.linkedItem = null;
        $scope.noLinkedItemError = false;
        $scope.params = $stateParams;
        $scope.user = {};
        $scope.signed = false;
        $scope.isSharedSignature = false;
        $scope.privacyPolicyAccepted = false;

        function getUserEmail(key) {
            // eslint-disable-next-line handle-callback-err
            $HUBService.call('users', 'getEmails', {}, function (err, data) {
                if (data && data.value) {
                    data.value.some(function (email) {
                        $scope.customValues[key] = email.primary ? email.email : $scope.customValues[key];

                        return email.primary;
                    });
                }
            });
        }

        function getGithubValues() {
            if ($scope.hasCustomFields && $scope.user.value && !$scope.signed) {
                $scope.customKeys.forEach(function (key) {
                    var githubKey = $scope.customFields[key].githubKey;
                    if (githubKey) {
                        $scope.customValues[key] = $scope.user.value[githubKey];
                        if (githubKey === 'email' && !$scope.user.value.email) {
                            getUserEmail(key);
                        }
                    }
                });
            }
        }

        function isSharedSignature(cla) {
            return cla && !cla.owner;
        }

        function getSignedValues() {
            $RPCService.call('cla', 'getLastSignature', {
                repo: $stateParams.repo,
                owner: $stateParams.user,
                number: $stateParams.pullRequest
            }, function (err, res) {
                if (err) {
                    $log.info(err);
                }
                if ($scope.hasCustomFields && res && res.value && res.value.custom_fields) {
                    var customFields = JSON.parse(res.value.custom_fields);
                    $scope.customKeys.forEach(function (key) {
                        $scope.customValues[key] = customFields[key];
                    });
                }
                $scope.isSharedSignature = isSharedSignature(res.value);
            });
        }

        function getCLA() {
            return utils.getGistContent($scope.linkedItem.repoId, $scope.linkedItem.orgId).then(
                function success(gistContent) {
                    $scope.cla = $sce.trustAsHtml(gistContent.claText);
                    $scope.cla.text = gistContent.claText;
                    $scope.claText = gistContent.claText;

                    $scope.customFields = gistContent.customFields;
                    $scope.customKeys = gistContent.customKeys;
                    $scope.hasCustomFields = gistContent.hasCustomFields;
                },
                function error(err) {
                    $scope.noLinkedItemError = err.message || err;
                }
            );
        }

        function checkCLA() {
            return $RPCService.call('cla', 'check', {
                repo: $stateParams.repo,
                owner: $stateParams.user,
                number: $stateParams.pullRequest
            }, function (err, signed) {
                if (!err && signed.value) {
                    $scope.signed = true;
                    $scope.privacyPolicyAccepted = true;
                } else {
                    $scope.signed = false;
                }
            });
        }

        function getLinkedItem(callback) {
            return $RPCService.call('cla', 'getLinkedItem', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function (err, linkedItem) {
                if (err) {
                    $scope.noLinkedItemError = err.message || err;
                }
                callback(linkedItem.value);
            });
        }

        var getUser = function () {
            return $HUBService.call('users', 'get', {}, function (err, res) {
                if (err) {
                    return;
                }

                $scope.user = res;
                $scope.user.value.admin = false;
                if (res.meta && res.meta['x-oauth-scopes'] && res.meta['x-oauth-scopes'].indexOf('write:repo_hook') > -1) {
                    $scope.user.value.admin = true;
                }
                $rootScope.user = $scope.user;
                $rootScope.$broadcast('user');
            });
        };

        var redirect = function () {
            $scope.redirect = 'https://github.com/' + $stateParams.user + '/' + $stateParams.repo;
            if ($stateParams.pullRequest) {
                $scope.redirect = $scope.redirect + '/pull/' + $stateParams.pullRequest;
            }
            // $http.get('/logout?noredirect=true');
            $timeout(function () {
                $window.location.href = $scope.redirect;
            }, 5000);
        };

        $scope.agree = function () {
            if (!$scope.hasCustomFields) {
                var acceptUrl = '/accept/' + $stateParams.user + '/' + $stateParams.repo;
                acceptUrl = $stateParams.pullRequest ? acceptUrl + '?pullRequest=' + $stateParams.pullRequest : acceptUrl;
                $window.location.href = acceptUrl;
            } else if ($scope.user.value && $scope.hasCustomFields) {
                $RPCService.call('cla', 'sign', {
                    repo: $stateParams.repo,
                    owner: $stateParams.user,
                    custom_fields: JSON.stringify($scope.customValues)
                }, function (err, signed) {
                    if (err) {
                        $log.info(err);
                    }
                    $scope.signed = signed ? signed.value : false;
                    $scope.privacyPolicyAccepted = $scope.signed ? true : false;
                    if ($scope.signed) {
                        redirect();
                    }
                });
            }
        };

        $scope.signIn = function () {
            var acceptUrl = '/signin/' + $stateParams.user + '/' + $stateParams.repo;
            $window.location.href = $stateParams.pullRequest ? acceptUrl + '?pullRequest=' + $stateParams.pullRequest : acceptUrl;
        };


        var userPromise = getUser();
        var claPromise;
        var repoPromise = getLinkedItem(function (linkedItem) {
            $scope.linkedItem = linkedItem;
            if ($scope.linkedItem) {
                claPromise = getCLA();
            }
        });

        $scope.isValid = function () {
            var valid = true;

            function isNotEmpty(value) {
                return !!value || value === 0;
            }

            function typeIsValid(value, field) {
                return typeof value == field.type || field.type.enum || field.type == 'textarea';
            }

            $scope.customKeys.some(function (key) {
                var value = $scope.customValues[key];
                var field = $scope.customFields[key];
                valid = !field.required || (isNotEmpty(value) && typeIsValid(value, field));

                return !valid;
            });

            return valid;
        };

        $scope.showSharedGistMsg = function () {
            return $scope.linkedItem && $scope.linkedItem.sharedGist && (!$scope.signed || ($scope.signed && $scope.isSharedSignature));
        };

        $q.all([userPromise, repoPromise]).then(function () {
            if ($scope.user && $scope.user.value && $scope.linkedItem) {
                // var claPromise = getCLA();
                var signedPromise = checkCLA().then(function (signed) {
                    // $scope.customValues = signed.value ? {} : $scope.customValues;
                    if (signed.value && $stateParams.redirect) {
                        redirect();
                    }
                });
                $q.all([claPromise, signedPromise]).then(function () {
                    if ($scope.signed) {
                        getSignedValues();
                    } else {
                        getGithubValues();
                    }
                });
            }
        }, function errorCallback() {
            // empty
        });
    }
])
    .directive('customfield', [function () {
        return {
            templateUrl: '/templates/customField.html',
            scope: {
                description: '=',
                key: '=',
                logged: '=',
                min: '=',
                max: '=',
                name: '=',
                required: '=',
                signed: '=',
                title: '=',
                type: '=',
                value: '=',
            }
        };
    }]);

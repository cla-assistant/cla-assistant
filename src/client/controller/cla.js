// *****************************************************
// CLA Controller
//
// tmpl: cla.html
// path: /:repoId/:prId
// *****************************************************

module.controller( 'ClaController', ['$window', '$rootScope', '$scope', '$stateParams', '$RAW', '$RPCService', '$modal', '$sce', '$timeout', '$http',
    function($window, $rootScope, $scope, $stateParams, $RAW, $RPCService, $modal, $sce, $timeout, $http) {

        $scope.cla = null;
        $scope.signed = false;
        $scope.signedCLA = null;
        $scope.repoExists = false;
        $scope.params = $stateParams;
        $scope.user = {};
        $scope.redirect = 'https://github.com/' + $stateParams.user + '/' + $stateParams.repo;

        function getCLA () {
            return $RPCService.call('cla', 'get', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function(err, cla) {
                if(!err) {
                    $scope.claText = cla.value.raw;
                }
            });
        }

        function checkCLA() {
            return $RPCService.call('cla', 'check', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function(err, signed){
                if (!err && signed.value) {
                    $scope.signed = true;
                }
            });
        }

        function checkRepo(callback) {
            return $RPCService.call('repo', 'check', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function(err, exists){
                callback(exists.value);
            });
        }

        // function getDiff(){
        //     return $RPCService.call('cla', 'get', {
        //         repo: $stateParams.repo,
        //         owner: $stateParams.user,
        //         gist: {
        //             gist_url: $scope.signedCLA.gist_url,
        //             gist_version: $scope.signedCLA.gist_version
        //         }
        //     }, function(err, cla) {
        //         if(!err) {
        //             $scope.signedCLA.text = cla.value.raw;
        //         }
        //     });
        // }

        function getLastSignature(){
            var promise = $RPCService.call('cla', 'getLastSignature', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            });

            promise.then(function(data){
                $RPCService.call('cla', 'get', {
                    repo: $stateParams.repo,
                    owner: $stateParams.user,
                    gist: {gist_url: data.value.gist_url,
                            gist_version: data.value.gist_version}
                }).then(function(data){
                    $scope.signedCLA.text = data.value.raw;
                });
            });

            return promise;
        }

        $scope.agree = function(){
            var acceptUrl = '/accept/' + $stateParams.user + '/' + $stateParams.repo;
            acceptUrl = $stateParams.pullRequest ? acceptUrl + '?pullRequest=' + $stateParams.pullRequest : acceptUrl;
            $window.location.href = acceptUrl;
        };

        $scope.$on('user', function(event, data){
            $scope.user = $rootScope.user.value;
        });

        checkRepo(function(exists){
            $scope.repoExists = exists;

            if ($stateParams.pullRequest) {
                $scope.redirect = $scope.redirect + '/pull/' + $stateParams.pullRequest;
            }
            if ($rootScope.user.value) {
                checkCLA().then(function(signed){
                    if (signed.value) {
                        $http.get('/logout?noredirect=true');
                        $timeout(function(){
                            $window.location.href = $scope.redirect;
                        }, 5000);
                    }
                });
            }
            if (exists) {
                getCLA().then(function(data){
                    $scope.cla = $sce.trustAsHtml(data.value.raw);
                    $scope.cla.text = data.value.raw;
                });
            }
        });
    }
]);

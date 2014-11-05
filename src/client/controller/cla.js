// *****************************************************
// CLA Controller
//
// tmpl: cla.html
// path: /:repoId/:prId
// *****************************************************

module.controller( 'ClaController', ['$window', '$rootScope', '$scope', '$stateParams', '$RAW', '$RPC', '$modal', '$sce',
    function($window, $rootScope, $scope, $stateParams, $RAW, $RPC, $modal, $sce) {

        $scope.cla = {text: 'dummy text'};
        $scope.signed = false;
        $scope.repoExists = false;

        function getCLA () {
            $RPC.call('cla', 'get', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function(err, cla) {
                if(!err) {
                    $scope.claText = cla.value.raw;
                }
            });
        }

        function checkCLA() {
            $RPC.call('cla', 'check', {
                repo: $stateParams.repo
            }, function(err, signed){
                if (!err && signed.value) {
                    $scope.signed = true;
                }
            });
        }

        function checkRepo(callback) {
            $RPC.call('repo', 'check', {
                repo: $stateParams.repo,
                owner: $stateParams.user
            }, function(err, exists){
                callback(exists.value);
            });
        }

        checkRepo(function(exists){
            $scope.repoExists = exists;

            if ($stateParams.pullRequest) {
                $scope.redirect = 'https://github.com/' + $stateParams.user + '/' + $stateParams.repo + '/pull/' + $stateParams.pullRequest;
            }
            if ($rootScope.user.value) {
                checkCLA();
            }
            if (exists) {
                getCLA();
            }
        });

        $scope.agree = function(){
            $window.location.href = '/accept/' + $stateParams.user + '/' + $stateParams.repo;
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };
    }
]);

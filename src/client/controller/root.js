// *****************************************************
// Root Controller
// *****************************************************

module.controller('RootCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPC', '$RAW', '$timeout',
    function($rootScope, $scope, $stateParams, $HUB, $RPC, $RAW, $timeout) {

        $rootScope.user = {value: {admin: false}};
        $rootScope.loading = true;

        $HUB.call('user', 'get', {}, function(err, res){
            $rootScope.loading = false;
            if (err) {
                return;
            }

            $timeout(function() {
                $rootScope.user = res;
                $rootScope.user.value.admin = false;

                if (res.meta.scopes.indexOf('write:repo_hook') > -1) {
                    $rootScope.user.value.admin = true;
                }

                $rootScope.$broadcast('user');
            }, 0);
        });
    }
]);

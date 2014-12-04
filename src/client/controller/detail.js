// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('DetailCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC', '$RAW', '$window', '$sce',
    function ($rootScope, $scope, $state, $stateParams, $HUB, $RPC, $RAW, $window, $sce) {

        $scope.repo = {};
        $scope.admin = false;
        $scope.users = [];
        $scope.errorMsg = [];

        function getCLA () {
            $RPC.call('cla', 'get', {
                repo: $scope.repo.repo,
                owner: $scope.repo.owner
            }, function(err, cla) {
                if(!err) {
                    $scope.claText = cla.value.raw;
                }
            });
        }

        $scope.getUsers = function(){
            $scope.users = [];

            $RPC.call('cla', 'getAll', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: $scope.repo.gist}, function(err, data){
                if (!err && data.value) {
                    data.value.forEach(function(entry){
                        // $HUB.call('user', 'get', {user: entry.user}, function(err, user){
                        $HUB.call('user', 'getFrom', {user: entry.user}, function(err, user){
                            $scope.users.push(user.value);
                        });
                    });
                }
            });
        };

        var getRepo = function() {
            if ($rootScope.user.value.admin) {
                $scope.admin = true;
                $RPC.call('repo', 'get', {repo: $stateParams.repo, owner: $stateParams.user}, function(err, data){
                    if (!err && data.value) {
                        $scope.repo = data.value;
                        getCLA();
                        $scope.getUsers();
                    }
                });
            }
        };

        getRepo();

        $scope.$on('user', function(event, data){
            getRepo();
        });

        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };

        // var updateScopeData = function(){
        //     $RPC.call('repo', 'getAll', {owner: $rootScope.user.value.login}, function(err, data){
        //         $scope.claRepos = data.value;
        //         $scope.claRepos.forEach(function(claRepo){
        //             claRepo.active = claRepo.gist ? true : false;
        //         });
        //     });
        // };

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

        $scope.update = function(){
            $RPC.call('repo', 'update', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: $scope.repo.gist}, function(err, data){
                getRepo();
            });

            if ($scope.repo.gist) {
                $RPC.call('webhook', 'create', {repo: $scope.repo.repo, owner: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = true;
                    }
                });
            } else {
                $RPC.call('webhook', 'remove', {repo: $scope.repo.repo, user: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = false;
                    }
                });
            }
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };
    }
]);

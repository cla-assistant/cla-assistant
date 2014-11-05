// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC', '$RAW', '$window', '$modal',
    function ($rootScope, $scope, $state, $stateParams, $HUB, $RPC, $RAW, $window, $modal) {

        $scope.repos = [];

        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };

        var updateScopeData = function(){
            $scope.repos.forEach(function(repo){
                repo.claborate = {active: false};
                $RPC.call('repo', 'get', {repo: repo.name, owner: repo.owner.login}, function(err, data){
                    repo.claborate.active = !!data.value;
                    if (repo.claborate.active) {
                        repo.claborate.gist = data.value.gist;
                    }
                });
            });
        };

        $scope.$on('user', function(event, data){
            if ($rootScope.user.value && $rootScope.user.value.admin) {
                $HUB.call('repos', 'getAll', {user: $rootScope.user.value.login}, function(err, data){
                    if (err) {
                        return;
                    }
                    $scope.repos = data.value;
                    updateScopeData();
                });
            }
        });

        $scope.activate = function(repo) {
            $RPC.call('repo', 'create', {repo: repo.name, owner: repo.owner.login, gist: repo.claborate.gist}, function(err, data){
                repo.claborate.active = data.value;
            });

            $RPC.call('webhook', 'create', {repo: repo.name, owner: repo.owner.login}, function(err, data){});
        };

        $scope.update = function(repo){
            $RPC.call('repo', 'update', {repo: repo.name, owner: repo.owner.login, gist: repo.claborate.gist}, function(err, data){
                repo.claborate.active = data.value;
            });
        };

        $scope.remove = function(repo){
            $RPC.call('repo', 'remove', {repo: repo.name, owner: repo.owner.login, gist: repo.claborate.gist}, function(err, data){
                // repo.claborate.active = data.value;
            });

            $RPC.call('webhook', 'remove', {repo: repo.name, user: repo.owner.login}, function(err, data){});
        };

        $scope.setting = function(repo) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/setting.html',
                controller: 'SettingCtrl',
                resolve: {
                    repo: function() {
                        return repo;
                    }
                }
            });

            modal.result.then(function(args){
                repo = args.repo;
                $scope[args.action](repo);

            }, function(){
                console.log('dismissed');
            });
        };

    }
]);

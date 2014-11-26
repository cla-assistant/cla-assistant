// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC', '$RAW', '$window', '$modal', '$timeout',
    function ($rootScope, $scope, $state, $stateParams, $HUB, $RPC, $RAW, $window, $modal, $timeout) {

        $scope.repos = [];
        $scope.claRepos = [];
        $scope.selected = {};
        $scope.selectedIndex = -1;
        $scope.query = {};
        $scope.errorMsg = [];

        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };

        var updateScopeData = function(){
            $RPC.call('repo', 'getAll', {owner: $rootScope.user.value.login}, function(err, data){
                $scope.claRepos = data.value;
                $scope.claRepos.forEach(function(claRepo){
                    claRepo.active = claRepo.gist ? true : false;
                });
            });
        };

        var getRepos = function() {
            if ($rootScope.user.value && $rootScope.user.value.admin) {
                $HUB.call('repos', 'getAll', {user: $rootScope.user.value.login}, function(err, data){
                    if (err) {
                        return;
                    }
                    $scope.repos = data.value;
                    updateScopeData();
                });
            }
        };

        var showErrorMessage = function(text) {
            var error = text;
            $timeout(function(){
                var i = $scope.errorMsg.indexOf(error);
                if (i > -1) {
                    $scope.errorMsg.splice(i, 1);
                }
            }, 3000);

            $scope.errorMsg.push(error);
        };

        getRepos();

        $scope.$on('user', function(event, data){
            getRepos();
        });

        $scope.addRepo = function(){
            var newClaRepo = {repo: $scope.selected.name, owner: $scope.selected.owner.login, gist: '', active: false};
            $RPC.call('repo', 'create', {repo: $scope.selected.name, owner: $scope.selected.owner.login}, function(err, data){
                if (err && err.err.match(/.*duplicate key error.*/)) {
                    showErrorMessage('This repository is already set up.');
                }
                if (err || !data.value) {
                    var i = $scope.claRepos.indexOf(newClaRepo);
                    if (i > -1) {
                        $scope.claRepos.splice(i, 1);
                    }
                } else {
                    $scope.claRepos.push(newClaRepo);
                }
            });
        };

        $scope.update = function(index){
            var claRepo = $scope.claRepos[index];
            $RPC.call('repo', 'update', {repo: claRepo.repo, owner: claRepo.owner, gist: claRepo.gist}, function(err, data){
            });

            if (claRepo.gist) {
                $RPC.call('webhook', 'create', {repo: claRepo.repo, owner: claRepo.owner}, function(err, data){
                    if (!err) {
                        claRepo.active = true;
                    }
                });
            } else {
                $RPC.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){
                    if (!err) {
                        claRepo.active = false;
                    }
                });
            }
        };

        $scope.remove = function(claRepo){
            $RPC.call('repo', 'remove', {repo: claRepo.repo, owner: claRepo.owner, gist: claRepo.gist}, function(err, data){ 
                if (!err) {
                    var i = $scope.claRepos.indexOf(claRepo);
                    if (i > -1) {
                        $scope.claRepos.splice(i, 1);
                    }
                }
            });
            $RPC.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){});
        };

        $scope.showSettings = function(index){
            $scope.selectedIndex = $scope.selectedIndex === index ? -1 : index;
        };

        $scope.navigateToDetails = function (index) {
            $state.go('repo.cla', {'user': $scope.claRepos[index].owner, 'repo': $scope.claRepos[index].repo});
        };

        $scope.select = function(repo){
            $scope.selected = repo;
            $scope.query.text = repo.full_name;
            // $scope.query.input = false;
        };

        $scope.finishInput = function(){
            $timeout(function(){
                $scope.query.input = false;
            },150);
        };

    }
]);

// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPC', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q',
    function ($rootScope, $scope, $state, $stateParams, $HUB, $RPC, $RAW, $HUBService, $window, $modal, $timeout, $q) {

        $scope.repos = [];
        $scope.claRepos = [];
        $scope.selected = {};
        $scope.query = {};
        $scope.errorMsg = [];

        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };


        $scope.isNotClaRepo = function(repo){
            var match = false;
            $scope.claRepos.some(function(claRepo){
                match = claRepo.repo === repo.name && claRepo.owner === repo.owner.login ? true : false;
                return match;
            });
            return !match;
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
                var promises = [];
                var promise = {};
                promise = $HUBService.call('repos', 'getAll', {user: $rootScope.user.value.login}, function(err, data){
                    if (err) {
                        return;
                    }
                    $scope.repos = data.value;
                });
                promises.push(promise);

                $HUB.call('user', 'getOrgs', {}, function(err, data){
                    var orgRepos = [];
                    data.value.forEach(function(org){
                        promise = $HUBService.direct_call(org.repos_url).then(function(data){
                            data.value.forEach(function(orgRepo){
                                $scope.repos.push(orgRepo);
                            });
                        });
                    });
                    $q.all(promises).then(function(){
                        updateScopeData();
                    });
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
                    $scope.query.text = '';
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

        $scope.navigateToDetails = function (claRepo) {
            $state.go('details', {'user': claRepo.owner, 'repo': claRepo.repo});
        };

        $scope.select = function(repo){
            $scope.selected = repo;
            $scope.query.text = repo.full_name;
            // $scope.query.input = false;
        };

        $scope.finishInput = function(){
            $timeout(function(){
                $scope.query.input = false;
            }, 150);
        };
    }
]);

filters.filter('notIn', function() {
    return function(repos, arr) {

        if(arr.length === 0) {
            return repos;
        }

        var notMatched = [];

        repos.forEach(function(item){
            var found = false;
            arr.some(function(claRepo){
                found = claRepo.repo === item.name && claRepo.owner === item.owner.login ? true : false;
                return found;
            });
            if (!found) {
                notMatched.push(item);
            }
        });

        return notMatched;
    };
});

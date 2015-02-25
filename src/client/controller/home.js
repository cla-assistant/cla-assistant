// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$HUB', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q',
    function ($rootScope, $scope, $state, $stateParams, $HUB, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q) {

        $scope.repos = [];
        $scope.claRepos = [];
        $scope.selectedRepo = {};
        $scope.query = {};
        $scope.errorMsg = [];
        $scope.openSettings = false;
        $scope.users = [];
        $scope.selectedIndex = -1;


        $scope.settingsRepo = {};

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

        var mixRepoData = function(claRepo){
            $scope.repos.some(function(repo){
                if (claRepo.repo === repo.name && claRepo.owner === repo.owner.login) {
                    claRepo.fork = repo.fork;
                    return true;
                }
            });
            return claRepo;
        };

        var updateScopeData = function(){
            $RPCService.call('repo', 'getAll', {owner: $rootScope.user.value.login}, function(err, data){
                $scope.claRepos = data.value;
                $scope.claRepos.forEach(function(claRepo){
                    claRepo.active = claRepo.gist ? true : false;
                    claRepo = mixRepoData(claRepo);
                });
            });
        };

        var getRepos = function() {
            if ($rootScope.user.value && $rootScope.user.value.admin) {
                // var promises = [];
                // var promise = {};
                // promise = $HUBService.call('repos', 'getAll', {user: $rootScope.user.value.login}, function(err, data){
                //     if (err) {
                //         return;
                //     }
                //     // $scope.repos = data.value;
                //     data.value.forEach(function(orgRepo){
                //         $scope.repos.push(orgRepo);
                //     });
                // });
                // promises.push(promise);

                // $HUB.call('user', 'getOrgs', {}, function(err, data){
                //     var orgRepos = [];
                //     data.value.forEach(function(org){
                //         promise = $HUBService.direct_call(org.repos_url).then(function(data){
                //             data.value.forEach(function(orgRepo){
                //                 $scope.repos.push(orgRepo);
                //             });
                //         });
                //     });
                //     $q.all(promises).then(function(){
                //         updateScopeData();
                //     });
                // });

                $HUBService.direct_call('https://api.github.com/user/repos').then(function(data){
                            data.value.forEach(function(orgRepo){
                                $scope.repos.push(orgRepo);
                            });
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
            var newClaRepo = {repo: $scope.selectedRepo.repo.name, owner: $scope.selectedRepo.repo.owner.login, gist: '', active: false};
            newClaRepo = mixRepoData(newClaRepo);
            $RPCService.call('repo', 'create', {repo: $scope.selectedRepo.repo.name, owner: $scope.selectedRepo.repo.owner.login}, function(err, data){
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

        $scope.remove = function(claRepo){
            $RPCService.call('repo', 'remove', {repo: claRepo.repo, owner: claRepo.owner, gist: claRepo.gist}, function(err, data){
                if (!err) {
                    var i = $scope.claRepos.indexOf(claRepo);
                    if (i > -1) {
                        $scope.claRepos.splice(i, 1);
                    }
                }
            });
            $RPCService.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){});
        };

        $scope.update = function(index){
            var claRepo = $scope.claRepos[index];
            $RPCService.call('repo', 'update', {repo: claRepo.repo, owner: claRepo.owner, gist: claRepo.gist}, function(err, data){
            });

            if (claRepo.gist) {
                $RPCService.call('webhook', 'create', {repo: claRepo.repo, owner: claRepo.owner}, function(err, data){
                    if (!err) {
                        claRepo.active = true;
                    }
                });
            } else {
                $RPCService.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){
                    if (!err) {
                        claRepo.active = false;
                    }
                });
            }
        };

        $scope.getUsers = function(claRepo){
            return $RPCService.call('cla', 'getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}}, function(err, data){
                $scope.users = [];
                if (!err && data.value) {
                    data.value.forEach(function(entry){
                        // $HUB.call('user', 'get', {user: entry.user}, function(err, user){
                        $HUB.call('user', 'getFrom', {user: entry.user}, function(err, user){
                            user.value.cla = entry;
                            $scope.users.push(user.value);
                        });
                    });
                }
            });
        };

        $scope.navigateToDetails = function (claRepo) {
            if ($scope.settingsRepo.owner === claRepo.owner && $scope.settingsRepo.repo === claRepo.repo || !$scope.openSettings) {
                $scope.openSettings = !$scope.openSettings;
            }
            $scope.settingsRepo = claRepo;
            $state.go('home.settings', claRepo);
            // $state.go('home.settings');
        };

        var report = function(claRepo) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/report.html',
                controller: 'ReportCtrl',
                resolve: {
                    repo: function(){ return claRepo;},
                    users: function(){ return $scope.users; }
                }
            });
            // modal.result.then(function(args){});
        };

        $scope.getReport = function(claRepo){
            $scope.getUsers(claRepo).then(function(){
                report(claRepo);
            });
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

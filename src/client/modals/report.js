module.controller('ReportCtrl',
    function($scope, $modalInstance, $window, repo, users, $state, $RPCService) {
		$scope.claRepo = repo;
		$scope.users = users;
		$scope.gist = null;

		//TODO: Code duplication!!! To be improved!
		$scope.getGistName = function(){
            return $scope.gist && $scope.gist.files ? $scope.gist.files[Object.keys($scope.gist.files)[0]].filename : '';
        };

		var getGist = function(){
            $RPCService.call('cla', 'getGist', {repo: $scope.claRepo.repo, owner: $scope.claRepo.owner, gist: $scope.claRepo.gist}, function(err, data){
                if (!err && data.value) {
                    $scope.gist = data.value;
                }
            });
        };
        getGist();
    }
);

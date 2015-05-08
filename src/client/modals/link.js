module.controller('LinkCtrl',
    function($scope, $modalInstance, $window, selectedGist, selectedRepo, $state, $RPCService) {
		// $scope.gist = selectedGist.gist;
		// $scope.repo = selectedRepo.repo;

        console.log('modal status', $scope.linkStatus);


		$scope.ok = function () {
			$modalInstance.close();
		};

		$scope.cancel = function () { 
			$modalInstance.dismiss('cancel');
		};
    }
);

module.controller('ConfirmCtrl',
	function($scope, $modalInstance, $window, selectedGist, selectedRepo, $state, $RPCService) {
		$scope.gist = selectedGist.gist;
		$scope.repo = selectedRepo.repo;

		$scope.ok = function () {
			$modalInstance.close();
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);

module.controller('ConfirmCtrl',
	function($scope, $modalInstance, $window, $timeout, selectedGist, selectedRepo) {
		$scope.gist = selectedGist && selectedGist.gist ? selectedGist.gist : null;
		$scope.repo = selectedRepo && selectedRepo.repo ? selectedRepo.repo : null;

		$scope.ok = function () {
			$modalInstance.close(selectedRepo);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);

module.controller('LinkCtrl',
    function($scope, $modalInstance, $window, selectedGist, selectedRepo, $state, $RPCService) {
		$scope.ok = function () {
			$modalInstance.close();
		};

		$scope.cancel = function () { 
			$modalInstance.dismiss('cancel');
		};
    }
);

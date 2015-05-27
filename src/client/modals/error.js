module.controller('ErrorCtrl',
	function($scope, $modalInstance, $window, $timeout, $state, $RPCService) {

		$scope.ok = function () {
			$modalInstance.close();
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);
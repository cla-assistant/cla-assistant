module.controller('AddScopeCtrl',
    function($scope, $modalInstance, $window) {

        $scope.origin = $window.location.origin;

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
		$scope.ok = function () {
			$modalInstance.close();
		};
    }
);

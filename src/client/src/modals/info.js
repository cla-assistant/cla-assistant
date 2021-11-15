module.controller('InfoCtrl',
    function($scope, $modalInstance, $window) {

        $scope.origin = $window.location.origin;

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);

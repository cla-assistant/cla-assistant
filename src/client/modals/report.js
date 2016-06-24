module.controller('ReportCtrl', function($scope, $modalInstance, $window, item) {
	$scope.claItem = item;
	$scope.newContributors = {loading: false};
	$scope.history = $scope.gist.history;
	// $scope.gist = null;
	$scope.selectedVersion = {};
	$scope.selectedVersion.version = $scope.gist.history[0];

	$scope.history.push({text: 'All versions'});

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

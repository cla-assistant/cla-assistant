module.controller('ReportCtrl', function($scope, $modalInstance, $window, repo) {
	$scope.claRepo = repo;
	$scope.newContributors = {loading: false};
	// $scope.gist = null;
	$scope.selectedVersion = {};
	$scope.selectedVersion.version = $scope.gist.history[0];

	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

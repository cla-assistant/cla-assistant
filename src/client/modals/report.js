module.controller('ReportCtrl', function($scope, $modalInstance, $window, repo) {
	$scope.claRepo = repo;
	// $scope.gist = null;
	$scope.selectedVersion = {};
	$scope.selectedVersion.version = $scope.gist.history[0];
	
	console.log($scope.selectedVersion);
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

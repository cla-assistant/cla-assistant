module.controller('ReportCtrl', function($scope, $modalInstance, $window, repo) {
	$scope.claRepo = repo;
	$scope.gist = null;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

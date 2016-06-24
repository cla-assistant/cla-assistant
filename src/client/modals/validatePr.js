module.controller('ValidatePrCtrl', function($scope, $modalInstance, $window, item, repos) {
    $scope.linkedItem = item;
    $scope.selectedRepo = {};
    $scope.repos = repos;


    $scope.isOrgRepo = function (repo) {
        return repo.owner.login === item.org;
    };

    $scope.ok = function () {
    	$modalInstance.close($scope.selectedRepo.item);
	};
	$scope.cancel = function () {
		$modalInstance.dismiss('cancel');
	};
});

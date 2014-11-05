module.controller('SettingCtrl',
    function($scope, $modalInstance, repo, $window) {

		$scope.repo = angular.copy(repo);
		$scope.gist = repo.claborate.gist ? repo.claborate.gist : '';
        $scope.origin = $window.location.origin;
        var args = {};

        $scope.activate = function() {
			args.repo = $scope.repo;
			args.action = 'activate';

			$modalInstance.close(args);
        };

        $scope.remove = function() {
			args.repo = $scope.repo;
			args.action = 'remove';

			$modalInstance.close(args);
        };

        $scope.update = function() {
			args.repo = $scope.repo;
			args.action = 'update';

			$modalInstance.close(args);
        };
    }
);

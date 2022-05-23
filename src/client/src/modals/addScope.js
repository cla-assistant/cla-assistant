// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

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

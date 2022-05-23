// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

module.controller('ConfirmCtrl',
	function($scope, $modalInstance, $window, $timeout, selected) {
		$scope.gist = selected && selected.gist ? selected.gist : null;
		$scope.item = selected && selected.item ? selected.item : null;

		$scope.ok = function () {
			$modalInstance.close(selected.item);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);

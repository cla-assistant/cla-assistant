// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

module.controller(
  'MigrateRepositoryCtrl',
  function ($scope, $modalInstance, $RPCService, $window, $modal, linkItemService, item, $log) {
    $scope.item = item;

    // these are used to automatically fill out the organization
    // when installing the GitHub App
    $scope.inviteAppName = ''
    $scope.inviteOrganizationID = ''
    $scope.inviteUserID = ''

    $scope.updateInviteMeta = function() {
      $RPCService.call('github', 'getInstallationMeta', {
        owner: item.owner,
      }, function(err, res) {
        $log.info('getInstallationMeta', err, res)
        if (err) {
          return;
        }
        $scope.inviteUserID = res.value.suggestedUserID;
        $scope.$broadcast('inviteUserID');

        $scope.inviteAppName = res.value.appName;
        $scope.$broadcast('inviteAppName');
      })
    };

    $scope.errorMsg = '';

    // indicates if we are already checking
    $scope.checking = false;

    $scope.needGitHubApp = false;
    $scope.needGitHubAppPrivileges = false;
    $scope.needCheckMigration = false;
    $scope.success = false;

    $scope.migrate = function () {
      if ($scope.checking) {
        return;
      }
      $scope.checking = true;

      linkItemService.migrate(item).then(
        function success(data) {
          if (data.value) {
            if (data.value.success) {
              $scope.success = true;
              $scope.needGitHubApp = false;
              $scope.needCheckMigration = false;
            } else {
              $scope.success = false;
              $scope.needGitHubApp = false;
              $scope.needCheckMigration = true;

              if (data.value.message === 'GitHub App not installed') {
                $scope.needGitHubApp = true;
              } else if (
                data.value.message === 'GitHub App has insufficient permissions'
              ) {
                $scope.needGitHubAppPrivileges = true;
              } else {
                $scope.errorMsg = data.value.message;
              }
            }
          }
          $scope.checking = false;
        },
        function failure(err) {
          $scope.errorMsg = JSON.stringify(err);
          $scope.checking = false;
        }
      );
    };

    $scope.done = function () {
      $scope.item.migrate = false
      $modalInstance.close($scope.item);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };

    $scope.updateInviteMeta();
    $scope.migrate();
  }
);

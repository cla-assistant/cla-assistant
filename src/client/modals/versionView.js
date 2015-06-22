module.controller('VersionViewCtrl', function($scope, $modalInstance, cla, noCLA, showCLA, $window, $state, $RPCService, $sce) {
  $scope.claObj = cla;
  $scope.noCLA = noCLA;
  $scope.showCLA = showCLA;
  $scope.cla = null;
  $scope.modalInstance = $modalInstance;
  $scope.newCLA = null;


  $scope.openNewCla = function () {
    $modalInstance.dismiss('Link opened');
    $window.open('/'+$scope.claObj.owner+'/'+$scope.claObj.repo);
  };

  $scope.openRevision = function () {
    $window.open($scope.claObj.gist_url+'/revisions');
  };

  $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
  };
});

module.controller('RevokeViewCtrl', function($scope, $RPCService, $modalInstance, $window, cla) {
    $scope.claObj = cla;
    $scope.signedCLAs = '';

    var revokeAllSignatures = function(){
        return $RPCService.call('cla', 'revokeAllSignatures', {
            user: $scope.user.value.login,
            repo: $scope.claObj.repo
        }, function(err, data){
            if(!err && data){
                $window.location.reload();
            }
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.revoke = function() {
        revokeAllSignatures();
        $modalInstance.dismiss('cancel');
    };
});

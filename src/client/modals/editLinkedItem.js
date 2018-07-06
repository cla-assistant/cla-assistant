module.controller('EditLinkedItemCtrl', function ($scope, $modalInstance, $window, $modal, linkItemService, item, gist, gists) {
    $scope.linkedItem = item;
    $scope.gists = gists;
    $scope.selected = {};
    $scope.errorMsg = [];

    $scope.selected.item = angular.copy(item);

    function initGist() {
        $scope.selected.gist = gists.find(function (g) {
            return g.url === item.gist;
        }) || gist;
    }

    $scope.clear = function ($event) {
        $event.stopPropagation();
        $scope.selected.gist = undefined;
    };

    $scope.gistShareInfo = function () {
        $modal.open({
            templateUrl: '/modals/templates/info_share_gist.html',
            controller: 'InfoCtrl',
            windowClass: 'howto'
        });
    };
    $scope.ok = function () {
        $scope.selected.item.gist = $scope.selected.gist.url;
        linkItemService.updateLink($scope.selected.item).then(function success(data) {
            if (data.value) {
                $modalInstance.close(data.value);
            }
        }, function failure(err) {
            $scope.errorMsg.push(err);
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    initGist();

});

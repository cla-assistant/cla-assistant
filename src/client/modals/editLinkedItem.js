module.controller('EditLinkedItemCtrl', function ($scope, $modalInstance, $window, $modal, linkItemService, item, gist, gists) {
    $scope.linkedItem = item;
    $scope.gists = gists;
    $scope.selected = {};
    $scope.errorMsg = [];

    $scope.selected.item = angular.copy(item);

    function initGist() {
        $scope.selected.gist = { name: gist.description || gist.fileName, url: gist.html_url } || gists.find(function (g) {
            return g.url === item.gist;
        });
        // $scope.selected.gist = gists.find(function (g) {
        //     return g.url === item.gist;
        // }) || { name: gist.description || gist.fileName, url: gist.html_url };
    }

    function getGistId(url) {
        var regexLastSlash = new RegExp('(.*)/$', 'g');
        var result = regexLastSlash.exec(url);
        var newUrl = result ? result[1] : url;
        var regexGistId = new RegExp('([a-zA-Z0-9_-]*)$', 'g');

        return regexGistId.exec(newUrl)[1];
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

    $scope.whitelistInfo = function () {
        $modal.open({
            templateUrl: '/modals/templates/whitelist_info.html',
            controller: 'InfoCtrl',
            windowClass: 'howto'
        });
    };

    $scope.ok = function (itemToSave) {
        $scope.selectedGistId = getGistId($scope.selected.gist.url);
        $scope.itemsGistId = getGistId(itemToSave.gist);

        if ($scope.selectedGistId !== $scope.itemsGistId) {
            itemToSave.gist = $scope.selected.gist;
        } else if (!itemToSave.gist.url) {
            itemToSave.gist = { url: itemToSave.gist };
        }
        linkItemService.updateLink(itemToSave).then(function success(data) {
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

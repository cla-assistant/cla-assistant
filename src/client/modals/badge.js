module.controller('BadgeCtrl', function ($scope, $modalInstance, $window, repo) {
    $scope.claRepo = repo;
    $scope.badgeUrl = $window.location + 'readme/badge/' + repo.owner + '/' + repo.repo;
    $scope.linkUrl = $window.location + repo.owner + '/' + repo.repo;
    $scope.types = [{
        type: 'HTML',
        url: '<a href="' + $scope.linkUrl + '"><img src="' + $scope.badgeUrl + '" alt="CLA assistant" /></a>'
    }, {
        type: 'Image URL',
        url: $scope.badgeUrl
    }, {
        type: 'Markdown',
        url: '[![CLA assistant](' + $scope.badgeUrl + ')](' + $scope.linkUrl + ')'
    }, {
        type: 'Textile',
        url: '!' + $scope.badgeUrl + '(CLA assistant)!:' + $scope.linkUrl
    }, {
        type: 'RDOC',
        url: '{<img src="' + $scope.badgeUrl + '" alt="CLA assistant" />}[' + $scope.linkUrl + ']'
    }];

    $scope.selectedType = {};
    $scope.selectedType.type = $scope.types[0];

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
})
    // copied from https://github.com/sachinchoolur/ngclipboard/blob/master/src/ngclipboard.js
    .directive('ngClipboard', function () {
        return {
            restrict: 'A',
            scope: {
                ngClipboardSuccess: '&',
                ngClipboardError: '&'
            },
            link: function (scope, element) {
                var clipboard = new Clipboard(element[0]);

                clipboard.on('success', function (e) {
                    scope.ngClipboardSuccess({
                        e: e
                    });
                });

                clipboard.on('error', function (e) {
                    scope.ngClipboardError({
                        e: e
                    });
                });
            }
        };
    });

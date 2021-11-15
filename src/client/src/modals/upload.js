module.controller('UploadCtrl',
    function ($scope, $modalInstance, customFields) {

        $scope.json = {};
        $scope.availableFieldKeys = ['user', 'created_at'];
        $scope.selectedKeys = {};

        $scope.availableFieldKeys = $scope.availableFieldKeys.concat(customFields);

        $scope.selectedKeyList = function () {
            return Object.keys($scope.selectedKeys).map(function (i) { return $scope.selectedKeys[i]; });
        };

        $scope.canBeUploaded = function () {
            return $scope.selectedKeyList().indexOf('user') != -1;
        };

        $scope.validateAttribute = function (data, index) {
            if ($scope.selectedKeys[index] === 'created_at') {
                return isNaN(Date.parse(data)) ? 'danger' : 'success';
            } else if ($scope.selectedKeys[index] === 'user') {
                return typeof data === 'string' ? 'success' : 'danger';
            }
        };

        $scope.$watch('file', function () {
            if ($scope.file) {
                Papa.parse($scope.file, {
                    complete: function (data) {
                        $scope.json = data;
                    }
                });
            }
        });

        $scope.upload = function () {

            var data = [];
            if ($scope.header) {
                $scope.json.data.splice(0, 1);
            }
            data = $scope.json.data.map(function (line) {
                var argsToUpload = {};
                try {
                    Object.keys($scope.selectedKeys).forEach(function (index) {
                        var attributeName = $scope.selectedKeys[index];
                        if (attributeName === 'user') {
                            argsToUpload.user = line[index];
                        } else if (attributeName === 'created_at') {
                            if (isNaN(Date.parse(line[index]))) {
                                throw new Error('unsupported date format');
                            }
                            argsToUpload.created_at = new Date(line[index]).toUTCString();
                        } else {
                            argsToUpload.custom_fields = argsToUpload.custom_fields ? argsToUpload.custom_fields : {};
                            argsToUpload.custom_fields[attributeName] = line[index];
                        }
                    });
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.log(e);

                    return;
                }
                argsToUpload.custom_fields = JSON.stringify(argsToUpload.custom_fields);

                return argsToUpload;
            }).filter(function (line) { return line; });

            $modalInstance.close(data);
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }
)
    .directive('fileModel', function () {
        return {
            scope: {
                fileModel: '='
            },
            link: function (scope, elem) {
                elem.bind('change drop', function (change) {
                    var reader = new FileReader();
                    reader.onload = function (load) {
                        scope.$apply(function () {
                            scope.fileModel = load.target.result;
                        });
                    };
                    reader.readAsText(change.target.files[0]);
                });
            }
        };
    });

filters.filter('notSelected', function () {
    return function (items, arr) {

        if (!arr || arr.length === 0) {
            return items;
        }

        var notMatched = [];

        items.forEach(function (item) {
            if (arr.indexOf(item) < 0) {
                notMatched.push(item);
            }
        });

        return notMatched;
    };
});
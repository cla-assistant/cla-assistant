module.controller('UploadCtrl',
	function($scope, $modalInstance) {

		$scope.json = {};

		$scope.$watch('file', function() {
			if($scope.file) {
				Papa.parse($scope.file, {
					complete: function(data) {
						$scope.json = data;
					}
				});
			}
		});

		$scope.upload = function(index) {

			var data = [];

			for(var i = ($scope.header ? 1 : 0); i < $scope.json.data.length; i++) {
				data.push($scope.json.data[i][index]);
			}

			$modalInstance.close(data);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
	}
)
.directive('fileModel', function(){
	return {
		scope: {
			fileModel: '='
		},
		link: function(scope, elem) {
			elem.bind('change drop', function(change) {
				var reader = new FileReader();
				reader.onload = function(load) {
					scope.$apply(function() {
						scope.fileModel = load.target.result;
					});
				};
				reader.readAsText(change.target.files[0]);
			});

			elem.bind('ondragenter', function() {
				console.log('dude...');
			});
		}
	};
});

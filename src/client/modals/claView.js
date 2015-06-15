module.controller('ClaViewCtrl', function($scope, $modalInstance, $window, cla, $state, $RPCService, $sce) {
		$scope.claObj = cla;
		$scope.cla = null;
		$scope.modalInstance = $modalInstance;

		$scope.getGistName = function(gistObj){
				var fileName = '';
				if (gistObj && gistObj.files) {
						fileName = Object.keys(gistObj.files)[0];
						fileName = gistObj.files[fileName].filename ? gistObj.files[fileName].filename : fileName;
				}
				return fileName;
		};

		function getCLA () {
				return $RPCService.call('cla', 'get', {
						repo: $scope.claObj.repo,
						owner: $scope.claObj.owner,
						gist: {
							gist_url: $scope.claObj.gist_url,
							gist_version: $scope.claObj.gist_version
						}
				}, function(err, cla) {
						if(!err) {
								$scope.claText = cla.value.raw;
						}
				});
		};

		getCLA().then(function(data){
			$scope.cla = $sce.trustAsHtml(data.value.raw);
			$scope.cla.text = data.value.raw;
			//console.log($scope.cla.text);
		});


    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

})
.directive('clacontent', ['$window', function($window){
    return {
        link: function(scope, element, attrs){
						scope.$watch(attrs.clacontent, function(content){
								if (content) {
									var linkIcons = element[0].getElementsByClassName('octicon octicon-link');
									for (var index in linkIcons){
										if (linkIcons.hasOwnProperty(index)){
											angular.element(linkIcons[index]).removeClass('octicon octicon-link');
										}
									};
								}
						});
        }
    };
}]);

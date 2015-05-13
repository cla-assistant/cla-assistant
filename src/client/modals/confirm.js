module.controller('ConfirmCtrl',
	function($scope, $modalInstance, $window, $timeout, selectedGist, selectedRepo, $state, $RPCService) {
		$scope.gist = selectedGist && selectedGist.gist ? selectedGist.gist : null;
		$scope.repo = selectedRepo && selectedRepo.repo ? selectedRepo.repo : null;

		angular.element(document).ready(function () {
		});

		$modalInstance.opened.then(function(){
			// $timeout(function() {
				
			// 	console.log('Hello World');

			// 	var comp = AdobeEdge.getComposition('EDGE-216448673');
			// 	if (comp) {
			// 		comp.getStage().stop(0);
			// 		comp.getStage().play(0);
			// 	} else {
			// 		AdobeEdge.loadComposition('assets/js/nervous_remove', 'EDGE-216448673', {
			// 		            scaleToFit: "none",
			// 		            centerStage: "none",
			// 		            minW: "0",
			// 		            maxW: "undefined",
			// 		            width: "161px",
			// 		            height: "206px"
			// 		        }, {dom: [ ]}, {dom: [ ]});
			// 	};
			// }, 10);
// comp.stop();
			// AdobeEdge.loadComposition('assets/js/nervous_remove', 'EDGE-216448673', {
			// 	scaleToFit: "none",
			// 	centerStage: "none",
			// 	minW: "0",
			// 	maxW: "undefined",
			// 	width: "161px",
			// 	height: "206px"
			// }, {dom: [ ]}, {dom: [ ]});
		});

		$scope.ok = function () {
			$modalInstance.close(selectedRepo);
		};

		$scope.cancel = function () {
			$modalInstance.dismiss('cancel');
		};
    }
);

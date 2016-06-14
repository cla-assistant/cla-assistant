// *****************************************************
// CLA Controller
//
// tmpl: cla.html
// path: /:repoId/:prId
// *****************************************************

module.controller( 'ClaController', ['$window', '$scope', '$stateParams', '$RAW', '$RPCService', '$HUBService', '$sce', '$timeout', '$http', '$q',
		function($window, $scope, $stateParams, $RAW, $RPCService, $HUBService, $sce, $timeout, $http, $q) {

				$scope.cla = null;
				$scope.signed = false;
				$scope.repoExists = false;
				$scope.params = $stateParams;
				$scope.user = {};
				$scope.redirect = 'https://github.com/' + $stateParams.user + '/' + $stateParams.repo;

				function getCLA () {
						return $RPCService.call('cla', 'get', {
								repo: $stateParams.repo,
								owner: $stateParams.user
						}, function(err, cla) {
								if(!err) {
										$scope.claText = cla.value.raw;
								}
						});
				}

                function checkCLA() {
                    return $RPCService.call('cla', 'check', {
                        repo: $stateParams.repo,
                        owner: $stateParams.user
                    }, function(err, signed){
                        if (!err && signed.value) {
                            $scope.signed = true;
                        }else{
                            $scope.signed = false;
                        }
                    });
                }

				function checkRepo(callback) {
						return $RPCService.call('repo', 'check', {
								repo: $stateParams.repo,
								owner: $stateParams.user
						}, function(err, exists){
								callback(exists.value);
						});
				}

                var getUser = function(){
                    return $HUBService.call('users', 'get', {}, function(err, res){
                        if (err) {
                            return;
                        }

                        $scope.user = res;
                        $scope.user.value.admin = false;

                        if (res.meta && res.meta.scopes && res.meta.scopes.indexOf('write:repo_hook') > -1) {
                            $scope.user.value.admin = true;
                        }
                    });
                };

				$scope.agree = function(){
						var acceptUrl = '/accept/' + $stateParams.user + '/' + $stateParams.repo;
						acceptUrl = $stateParams.pullRequest ? acceptUrl + '?pullRequest=' + $stateParams.pullRequest : acceptUrl;
						$window.location.href = acceptUrl;
				};

				var userPromise = getUser();

				var repoPromise = checkRepo(function(exists){
						$scope.repoExists = exists;
						if ($scope.repoExists) {
								getCLA().then(function(data){
										$scope.cla = $sce.trustAsHtml(data.value.raw);
										$scope.cla.text = data.value.raw;
								});
						}
				});

				$q.all([userPromise, repoPromise]).then(function(){
					if ($stateParams.pullRequest) {
							$scope.redirect = $scope.redirect + '/pull/' + $stateParams.pullRequest;
					}
					if ($scope.user && $scope.user.value && $scope.repoExists) {
							checkCLA().then(function(signed){
									if (signed.value) {
											$http.get('/logout?noredirect=true');
											$timeout(function(){
													$window.location.href = $scope.redirect;
											}, 5000);
									}
							});
					}
				});
		}
]);

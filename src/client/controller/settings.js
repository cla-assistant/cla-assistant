// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPCService', '$HUBService', '$window', '$sce', '$modal',
    function ($rootScope, $scope, $stateParams, $HUB, $RPCService, $HUBService, $window, $sce, $modal) {

        $scope.gist = {};
        $scope.gistIndex = 0;
        $scope.admin = false;
        $scope.errorMsg = [];
        $scope.loading = false;
        $scope.gistValid = true;
        $scope.signatures = [];
        $scope.contributors = [];

        $scope.csvHeader = ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL', 'Gist Version', 'Signed At'];

        function gistArgs () {
            var args = {gist_url: $scope.repo.gist};
            if ($scope.gist.history && $scope.gist.history.length > 0) {
                args.gist_version = $scope.gist.history[$scope.gistIndex].version;
            }
            return args;
        }

        $scope.isValid = function(gist){
            var valid = false;
             // valid = value ? !!value.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)\/[a-zA-Z0-9]*$/) : false;
            valid = gist ? !!gist.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;
            return valid ? gist : undefined;
        };

        $scope.open_error = function(){
            var modal = $modal.open({
                templateUrl: '/modals/templates/error_modal.html',
                controller: 'ErrorCtrl'
            });
        };

        $scope.getSignatures = function(claRepo){
            return $RPCService.call('cla', 'getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}});
        };

        var getGithubUserData = function(login){
            return $HUBService.call('user', 'getFrom', {user: login});
        };

        $scope.getContributors = function(){
            return $scope.getSignatures($scope.repo).then(function(data){
                $scope.contributors = [];
                if (data && data.value && data.value.length > 0) {
                    data.value.forEach(function(signature){
                        var contributor = {};
                        contributor.user_name = signature.user;
                        contributor.repo_owner = $scope.repo.owner;
                        contributor.repo_name = $scope.repo.repo;
                        contributor.gist_name = $scope.getGistName();
                        contributor.gist_url = $scope.gist.url;
                        contributor.gist_version = signature.gist_version;
                        contributor.signed_at = signature.created_at;

                            $scope.contributors.push(contributor);
                        getGithubUserData(signature.user).then(function(user){
                            contributor.html_url = user.html_url;
                            // $scope.contributors.push(user.value);

                        });
                    });
                }
            });
        };

        $scope.getGist = function(){
            $scope.loading = true;
            $RPCService.call('cla', 'getGist', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: gistArgs()}, function(err, data){
                if (!err && data.value) {
                    $scope.gist = data.value;
                }
                $scope.loading = false;
                $scope.gist.linked = true;
            });
        };

        $scope.getGistName = function(){
            var fileName = '';
            if ($scope.gist && $scope.gist.files) {
                fileName = Object.keys($scope.gist.files)[0];
                fileName = $scope.gist.files[fileName].filename ? $scope.gist.files[fileName].filename : fileName;
            }
            return fileName;
        };

        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };

        // var showErrorMessage = function(text) {
        //     var error = text;
        //     $timeout(function(){
        //         var i = $scope.errorMsg.indexOf(error);
        //         if (i > -1) {
        //             $scope.errorMsg.splice(i, 1);
        //         }
        //     }, 3000);

        //     $scope.errorMsg.push(error);
        // };

        $scope.update = function(){
            $scope.gistValid = $scope.isValid($scope.repo.gist);
            if ($scope.repo.gist && !$scope.gistValid) {
                return;
            }
            if ($scope.repo.gist) {
                $RPCService.call('webhook', 'create', {repo: $scope.repo.repo, owner: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = true;
                    }
                });
            } else {
                $RPCService.call('webhook', 'remove', {repo: $scope.repo.repo, user: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = false;
                    }
                });
            }
            $RPCService.call('repo', 'update', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: $scope.repo.gist}, function(err, data){
                if ($scope.repo.gist) {
                    // $scope.getUsers();
                    $scope.getGist();
                    $scope.getSignatures($scope.repo).then(function(signatures){
                        if (signatures && signatures.value) {
                            $scope.signatures = signatures.value;
                            $scope.contributors = signatures.value;
                        }
                    });
                }
            });
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };

        var report = function(claRepo) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/report.html',
                controller: 'ReportCtrl',
                windowClass: 'report',
                scope: $scope,
                resolve: {
                    repo: function(){ return claRepo; }
                }
            });
            // modal.result.then(function(args){});
        };

        $scope.getReport = function(){
            if ($scope.signatures.length > 0) {
                $scope.getContributors($scope.repo);
                report($scope.repo);
            }
        };

        if ($scope.repo.gist) {
            $scope.getGist();
            $scope.getSignatures($scope.repo).then(function(signatures){
                if (signatures && signatures.value) {
                    $scope.signatures = signatures.value;
                    $scope.contributors = signatures.value;
                }
            });
        }
    }
]);

module.directive('settings', [function(elem, attr){
    return {
        templateUrl: '/templates/settings.html',
        controller: 'SettingsCtrl',
        transclude: true,
        scope: {
            repo: '=',
            user: '='
        }
    };
}]);

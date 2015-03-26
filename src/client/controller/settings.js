// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPCService', '$window', '$sce', '$modal',
    function ($rootScope, $scope, $stateParams, $HUB, $RPCService, $window, $sce, $modal) {

        $scope.gist = {};
        $scope.gistIndex = 0;
        $scope.admin = false;
        $scope.users = [];
        $scope.errorMsg = [];
        $scope.loading = false;
        $scope.gistValid = true;

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

        $scope.getUsers = function(){
            return $RPCService.call('cla', 'getAll', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: gistArgs()}, function(err, data){
                $scope.users = [];
                if (!err && data.value) {
                    data.value.forEach(function(entry){
                        // $HUB.call('user', 'get', {user: entry.user}, function(err, user){
                        $HUB.call('user', 'getFrom', {user: entry.user}, function(e, user){
                            $scope.users.push(user.value);
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
            return $scope.gist && $scope.gist.files ? $scope.gist.files[Object.keys($scope.gist.files)[0]].filename : '';
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
                    $scope.getUsers();
                    $scope.getGist();
                }
            });
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };

        if ($scope.repo.gist) {
            $scope.getGist();
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

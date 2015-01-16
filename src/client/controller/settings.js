// *****************************************************
// Detail Controller
//
// tmpl: detail.html
// path: /detail/:ruser/:repo
// *****************************************************

module.controller('SettingsCtrl', ['$rootScope', '$scope', '$stateParams', '$HUB', '$RPC', '$window', '$sce', '$modal',
    function ($rootScope, $scope, $stateParams, $HUB, $RPC, $window, $sce, $modal) {

        $scope.repo = {};
        $scope.gist = {};
        $scope.gistIndex = 0;
        $scope.admin = false;
        $scope.users = [];
        $scope.errorMsg = [];

        function gistArgs () {
            var args = {gist_url: $scope.repo.gist};
            if ($scope.gist.history && $scope.gist.history.length > 0) {
                args.gist_version = $scope.gist.history[$scope.gistIndex].version;
            }
            return args;
        }

        function getCLA () {
            var args = {
                repo: $scope.repo.repo,
                owner: $scope.repo.owner
            };
            if ($scope.gist.history) {
                args.gist = gistArgs();
            }
            $RPC.call('cla', 'get', args, function(err, cla) {
                if(!err) {
                    $scope.claText = cla.value.raw;
                }
            });
        }

        $scope.getUsers = function(){
            $RPC.call('cla', 'getAll', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: gistArgs()}, function(err, data){
                $scope.users = [];
                if (!err && data.value) {
                    data.value.forEach(function(entry){
                        // $HUB.call('user', 'get', {user: entry.user}, function(err, user){
                        $HUB.call('user', 'getFrom', {user: entry.user}, function(err, user){
                            $scope.users.push(user.value);
                        });
                    });
                }
            });
        };

        $scope.getGist = function(){
            $RPC.call('cla', 'getGist', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: gistArgs()}, function(err, data){
                if (!err && data.value) {
                    $scope.gist = data.value;
                }
            });
        };

        var getRepo = function() {
            if ($rootScope.user.value.admin) {
                $scope.admin = true;
                $RPC.call('repo', 'get', {repo: $stateParams.repo, owner: $stateParams.user}, function(err, data){
                    if (!err && data.value) {
                        $scope.repo = data.value;
                        getCLA();
                        $scope.getUsers();
                        $scope.getGist();
                    }
                });
            }
        };

        // getRepo();

        $scope.$on('user', function(event, data){
            // getRepo();
        });

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
            $scope.repo = $scope.$parent.claRepo;

            $RPC.call('repo', 'update', {repo: $scope.repo.repo, owner: $scope.repo.owner, gist: $scope.repo.gist}, function(err, data){
                getRepo();
            });

            if ($scope.repo.gist) {
                $RPC.call('webhook', 'create', {repo: $scope.repo.repo, owner: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = true;
                    }
                });
            } else {
                $RPC.call('webhook', 'remove', {repo: $scope.repo.repo, user: $scope.repo.owner}, function(err, data){
                    if (!err) {
                        $scope.repo.active = false;
                    }
                });
            }
        };

        $scope.renderHtml = function(html_code)
        {
            return $sce.trustAsHtml(html_code);
        };

        $scope.info = function() {
            var modal = $modal.open({
                templateUrl: '/modals/templates/info_gist.html',
                controller: 'InfoCtrl'
            });
            // modal.result.then(function(args){});
        };

        $scope.gistVersion = function(index){
            $scope.gistIndex = index;
            getCLA();
            $scope.getUsers();
        };
    }
]);

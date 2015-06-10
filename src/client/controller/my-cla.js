// *****************************************************
// My-CLA Controller
//
// tmpl: my-cla.html.html
// path: /
// *****************************************************

module.controller('MyClaCtrl', ['$scope', '$filter', '$HUB', '$RAW', '$RPCService', '$HUBService', '$modal',
    function ($scope, $filter, $HUB, $RAW, $RPCService, $HUBService, $modal) {


      $scope.repos = [];
      $scope.gist = {};
      $scope.gists = [];
      $scope.claRepos = [];
      $scope.signedCLAs = [];
      $scope.users = [];
      $scope.user = {};
      $scope.defaultClas = [];

      var orderBy = $filter('orderBy');
      var githubGists = 'https://api.github.com/gists?per_page=100';
      var githubUserRepos = 'https://api.github.com/user/repos?per_page=100';

      $scope.logAdminIn = function(){
          $window.location.href = '/auth/github?admin=true';
      };

      function gistArgs (repo) {
          var args = {gist_url: repo.gist_url};
          if ($scope.gist.history && $scope.gist.history.length > 0) {
              args.gist_version = $scope.gist.history[$scope.gistIndex].version;
          }
          return args;
      }

      var getUser = function(){
          $scope.user = {value: {admin: false}};

          return $HUBService.call('user', 'get', {}, function(err, res){
              if (err) {
                  return;
              }

              $scope.user = res;
              $scope.user.value.admin = false;

              if (res.meta.scopes.indexOf('write:repo_hook') > -1) {
                  $scope.user.value.admin = true;
              }
              //$rootScope.user = $scope.user;
              //$rootScope.$broadcast('user');
          });
      };

      var getSignedCLA = function(){
        return $RPCService.call('cla', 'getSignedCLA', {user: $scope.user.value.login}, function(err, data){
          $scope.claRepos = data.value;
          for(var i = 0; i < $scope.claRepos.length; i++){
            $scope.getGist($scope.claRepos[i]);
          }
        });
      };

      $scope.getGist = function(repo){
          $RPCService.call('cla', 'getGist', {repo: repo.repo, owner: repo.owner, gist: gistArgs(repo)}, function(err, data){
              if (!err && data.value) {
                  repo.gistObj = data.value;
              }
          });
      };

      $scope.getGistName = function(gistObj){
          var fileName = '';
          if (gistObj && gistObj.files) {
              fileName = Object.keys(gistObj.files)[0];
              fileName = gistObj.files[fileName].filename ? gistObj.files[fileName].filename : fileName;
          }
          return fileName;
      };

      getUser().then(function(){
          getSignedCLA();
      });

      $scope.order = function(predicate, reverse){
        $scope.claRepos = orderBy($scope.claRepos, predicate, reverse);
      };

      var getGithubUserData = function(login){
          return $HUBService.call('user', 'getFrom', {user: login});
      };

      $scope.getDefaultClaFiles = function(){
          return $RAW.get('/static/cla-assistant.json').then(function(data){
            $scope.defaultClas = data['default-cla'];
          });
      };

      $scope.getClaView = function(claRepo) {
          var modal = $modal.open({
              templateUrl: '/modals/templates/claView.html',
              controller: 'ClaViewCtrl',
              scope: $scope,
              resolve: {
                  cla: function(){ return claRepo; }
              }
          });
      };


    }
  ]);

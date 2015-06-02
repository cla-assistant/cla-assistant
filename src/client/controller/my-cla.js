// *****************************************************
// My-CLA Controller
//
// tmpl: my-cla.html.html
// path: /
// *****************************************************

module.controller('MyClaCtrl', ['$rootScope', '$scope', '$document', '$HUB', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q', '$location', '$anchorScroll',
    function ($rootScope, $scope, $document, $HUB, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q, $location, $anchorScroll) {


      $scope.repos = [];
      $scope.claRepos = [];
      $scope.signedCLAs= [];
      $scope.users = [];
      $scope.user = {};
      $scope.defaultClas = [];

      var githubUserRepos = 'https://api.github.com/user/repos?per_page=100';

      $scope.logAdminIn = function(){
          $window.location.href = '/auth/github?admin=true';
      };

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

      var getRepos = function() {
          // var callBack = function(data){
          //     data.value.forEach(function(orgRepo){
          //             $scope.repos.push(orgRepo);
          //         });
          //     if (data.hasMore) {
          //         data.getMore();
          //     } else {
          //         updateScopeData();
          //     }
          // };

          if ($scope.user && $scope.user.value && $scope.user.value.admin) {
              $HUBService.direct_call(githubUserRepos).then(function(data){
                  data.value.forEach(function(orgRepo){
                          $scope.repos.push(orgRepo);
                      });
                  updateScopeData();
              });
          }
      };

      var getSignedCLA = function(){
        return $RPCService.call('cla', 'getSignedCLA', {user: $scope.user.value.login}, function(err, data){
          $scope.claRepos = data.value;
        });
      };

      getUser().then(function(){
          getRepos();
          getSignedCLA();
      });

      $scope.getSignatures = function(claRepo){
          return $RPCService.call('cla', 'getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}});
      };

      var updateScopeData = function(){
          var repoSet = [];
          $scope.repos.forEach(function(repo){
              repoSet.push({owner: repo.owner.login, repo: repo.name});
          });
          $RPCService.call('repo', 'getAll', {set: repoSet}, function(err, data){
          // $RPCService.call('repo', 'getAll', {owner: $rootScope.user.value.login}, function(err, data){
          //    $scope.claRepos = data.value;
          //    $scope.claRepos.forEach(function(claRepo){
          //        claRepo = mixRepoData(claRepo);
          //    });
          });
      };

      var mixRepoData = function(claRepo){
          $scope.repos.some(function(repo){
              if (claRepo.repo === repo.name && claRepo.owner === repo.owner.login) {
                  claRepo.fork = repo.fork;
                  return true;
              }
          });
          return claRepo;
      };

      $scope.isNotClaRepo = function(repo){
          var match = false;
          $scope.claRepos.some(function(claRepo){
              match = claRepo.repo === repo.name && claRepo.owner === repo.owner.login ? true : false;
              return match;
          });
          return !match;
      };

      $scope.getDefaultClaFiles = function(){
          return $RAW.get('/static/cla-assistant.json').then(function(data){
            $scope.defaultClas = data['default-cla'];
          });
      };

      var getGithubUserData = function(login){
          return $HUBService.call('user', 'getFrom', {user: login});
      };

      $scope.getUsers = function(claRepo){
          return $scope.getSignatures(claRepo).then(function(data){
              $scope.users = [];
              if (data && data.value) {
                  data.value.forEach(function(signature){
                      getGithubUserData(signature.user).then(function(user){
                          user.value.cla = signature;
                          $scope.users.push(user.value);

                      });
                  });
              }
          });
      };
    }
  ]);

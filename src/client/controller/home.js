// *****************************************************
// Home Controller
//
// tmpl: home.html
// path: /
// *****************************************************

module.controller('HomeCtrl', ['$rootScope', '$scope', '$document', '$HUB', '$RPCService', '$RAW', '$HUBService', '$window', '$modal', '$timeout', '$q', '$location', '$anchorScroll',
    function ($rootScope, $scope, $document, $HUB, $RPCService, $RAW, $HUBService, $window, $modal, $timeout, $q, $location, $anchorScroll) {

        $scope.repos = [];
        $scope.gists = [];
        $scope.claRepos = [];
        $scope.selectedRepo = {};
        $scope.selectedGist = {};
        $scope.query = {};
        $scope.errorMsg = [];
        $scope.openSettings = false;
        $scope.users = [];
        $scope.selectedIndex = -1;
        $scope.user = {};
        $scope.nextstep = {step1: true};
        $scope.active = 0;


        $scope.logAdminIn = function(){
            $window.location.href = '/auth/github?admin=true';
        };


        $scope.isNotClaRepo = function(repo){
            var match = false;
            $scope.claRepos.some(function(claRepo){
                match = claRepo.repo === repo.name && claRepo.owner === repo.owner.login ? true : false;
                return match;
            });
            return !match;
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

        var updateScopeData = function(){
            var repoSet = [];
            $scope.repos.forEach(function(repo){
                repoSet.push({owner: repo.owner.login, repo: repo.name});
            });
            $RPCService.call('repo', 'getAll', {set: repoSet}, function(err, data){
            // $RPCService.call('repo', 'getAll', {owner: $rootScope.user.value.login}, function(err, data){
                $scope.claRepos = data.value;
                $scope.claRepos.forEach(function(claRepo){
                    claRepo.active = claRepo.gist ? true : false;
                    claRepo = mixRepoData(claRepo);
                });
            });
        };

        var getUser = function(){
            $rootScope.user = {value: {admin: false}};

            return $HUBService.call('user', 'get', {}, function(err, res){
                if (err) {
                    return;
                }

                $scope.user = res;
                $scope.user.value.admin = false;

                if (res.meta.scopes.indexOf('write:repo_hook') > -1) {
                    $scope.user.value.admin = true;
                }
                $rootScope.user = $scope.user;
                $rootScope.$broadcast('user');
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
                $HUBService.direct_call('https://api.github.com/user/repos?per_page=100').then(function(data){
                    data.value.forEach(function(orgRepo){
                            $scope.repos.push(orgRepo);
                        });
                    updateScopeData();
                });
            }
        };

        var getGists = function(){
            $scope.gists = [];
            $HUBService.direct_call('https://api.github.com/gists?per_page=100').then(function(data){
                if (data && data.value) {
                    data.value.forEach(function(gist){
                        var gistFile = {};
                        gistFile.name = Object.keys(gist.files)[0];
                        gistFile.name = gist.files[gistFile.name].filename ? gist.files[gistFile.name].filename : gistFile.name;
                        gistFile.url = gist.html_url;
                        $scope.gists.push(gistFile);
                    });
                }
            });
        };

        var showErrorMessage = function(text) {
            var error = text;
            $timeout(function(){
                var i = $scope.errorMsg.indexOf(error);
                if (i > -1) {
                    $scope.errorMsg.splice(i, 1);
                }
            }, 3000);

            $scope.errorMsg.push(error);
        };

        var linkSuccess = function(){
            var modal = $modal.open({
                templateUrl: '/modals/templates/link-success.html',
                controller: 'LinkCtrl',
                windowClass: 'link-success',
                scope: $scope,
                resolve: {
                    selectedGist: function(){ return $scope.selectedGist;},
                    selectedRepo: function(){ return $scope.selectedRepo;}
                }
            });
        };

        var confirmAdd = function() {
            var modal = $modal.open({
                templateUrl: '/modals/templates/confirm.html',
                controller: 'ConfirmCtrl',
                windowClass: 'confirm-add',
                resolve: {
                    selectedGist: function(){ return $scope.selectedGist;},
                    selectedRepo: function(){ return $scope.selectedRepo;}
                }
            });
            modal.result.then(function(){
                $scope.linkStatus = null;
                linkSuccess();
                $scope.link().then(function(){
                    $timeout(function() {

                    $scope.linkStatus = 'linked';
                    }, 10000);
                }, function(){
                    $scope.linkStatus = 'failed';
                });
            });
        };

        getUser().then(function(){
            getRepos();
            getGists();
        });

        // $scope.$on('user', function(event, data){
        //     $scope.user = $rootScope.user;
        //     getRepos();
        // });
        $scope.clear = function($event) {
           $event.stopPropagation();
           // Replace the following line with the proper variable
           $scope.selectedGist.gist = undefined;
        };

        $scope.isValid = function(gist){
            var valid = false;
             // valid = value ? !!value.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)\/[a-zA-Z0-9]*$/) : false;
            valid = gist ? !!gist.match(/https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/) : false;
            return valid;
        };

        $scope.addWebhook = function(claRepo){
            // $scope.gistValid = $scope.isValid($scope.repo.gist);
            // if ($scope.repo.gist && !$scope.gistValid) {
            //     return;
            // }
            if (claRepo.gist) {
                $RPCService.call('webhook', 'create', {repo: claRepo.repo, owner: claRepo.owner}, function(err, data){
                    if (!err && data && data.value) {
                        claRepo.active = data.value.active;
                    }
                });
            }
        };

        $scope.removeWebhook = function(claRepo){
            $RPCService.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){
                if (!err) {
                    claRepo.active = false;
                }
            });
        };


        $scope.addRepo = function(){
            confirmAdd();
            // return;
        };

        $scope.link = function(){
            var newClaRepo = {repo: $scope.selectedRepo.repo.name, owner: $scope.selectedRepo.repo.owner.login, gist: $scope.selectedGist.gist.url, active: false};
            newClaRepo = mixRepoData(newClaRepo);
            var promise1 = $RPCService.call('repo', 'create', {repo: newClaRepo.repo, owner: newClaRepo.owner, gist: newClaRepo.gist}, function(err, data){
                if (err && err.err.match(/.*duplicate key error.*/)) {
                    showErrorMessage('This repository is already set up.');
                }
                if (err || !data.value) {
                    $scope.removeWebhook(newClaRepo);
                    var i = $scope.claRepos.indexOf(newClaRepo);
                    if (i > -1) {
                        $scope.claRepos.splice(i, 1);
                    }
                } else {
                    $scope.claRepos.push(newClaRepo);
                    $scope.query.text = '';
                }
            });

            var promise2 = $scope.addWebhook(newClaRepo);
            return $q.all([promise1, promise2]);
        };

        $scope.remove = function(claRepo){
            $RPCService.call('repo', 'remove', {repo: claRepo.repo, owner: claRepo.owner, gist: claRepo.gist}, function(err, data){
                if (!err) {
                    var i = $scope.claRepos.indexOf(claRepo);
                    if (i > -1) {
                        $scope.claRepos.splice(i, 1);
                    }
                }
            });

            // if (claRepo.gist) {
            //     $RPCService.call('webhook', 'create', {repo: claRepo.repo, owner: claRepo.owner}, function(err, data){
            //         if (!err) {
            //             claRepo.active = true;
            //         }
            //     });
            // } else {
                $RPCService.call('webhook', 'remove', {repo: claRepo.repo, user: claRepo.owner}, function(err, data){
                    if (!err) {
                        claRepo.active = false;
                    }
                });
            // }
        };

        $scope.getUsers = function(claRepo){
            return $RPCService.call('cla', 'getAll', {repo: claRepo.repo, owner: claRepo.owner, gist: {gist_url: claRepo.gist}}, function(err, data){
                $scope.users = [];
                if (!err && data.value) {
                    data.value.forEach(function(entry){
                        // $HUB.call('user', 'get', {user: entry.user}, function(err, user){
                        $HUB.call('user', 'getFrom', {user: entry.user}, function(err, user){
                            user.value.cla = entry;
                            $scope.users.push(user.value);
                        });
                    });
                }
            });
        };

        var report = function(claRepo) {
            var modal = $modal.open({
                templateUrl: '/modals/templates/report.html',
                controller: 'ReportCtrl',
                resolve: {
                    repo: function(){ return claRepo;},
                    users: function(){ return $scope.users; }
                }
            });
            // modal.result.then(function(args){});
        };

        $scope.getReport = function(claRepo){
            $scope.getUsers(claRepo).then(function(){
                report(claRepo);
            });
        };

        $scope.info = function() {
            $modal.open({
                templateUrl: '/modals/templates/info_gist.html',
                controller: 'InfoCtrl'
            });
        };

        $scope.scrollTo = function(id) {
            $document.scrollTopAnimated(0, 800);
        };

        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.url();
        };
    }
])
.directive('resize', ['$window', function($window){
    return {
        scope: {
            resize: '@'
        },
        link: function(scope, element, attrs){
            var el = element;
            var inititalElOffset;

            var positionElement = function(){
                if (scope.resize === 'height') {
                    el.css('height', $window.innerHeight + 'px');
                } else if (scope.resize === 'max-width'){
                    el.css('max-width', this.innerWidth - 100);
                }
            };

            angular.element($window).bind('resize', function(){
                positionElement();
                scope.$apply();
            });

            angular.element($window).bind('load', function(){
                positionElement();
                scope.$apply();
            });
        }
    };
}])
.directive('feature', ['$window', function($window){
    return {
        templateUrl: '/templates/feature.html',
        scope: {
            id: '@',
            iconSrc: '@',
            header: '@',
            text: '@'
        },
        link: function(scope, element, attrs){

        }
    };
}])
.directive('imgSlider', ['$window', '$timeout', function($window, $timeout){
    return {
        scope: true,
        controller: function($scope, $element){
            var children;
            var leadingImage;
            var nextImage;
            var arrow_left;
            var arrow_right;
            var startPoint;
            var step;
            var count = 0;
            $scope.maxWidth = $window.innerWidth - 100;

            var centerLeadingImage = function(){
                startPoint = (this.innerWidth - leadingImage.width()) / 2;
                leadingImage.css('margin-left', startPoint);

                var top = (leadingImage.height() - arrow_left.height()) / 2;
                var left = startPoint - arrow_left.width();
                arrow_left.css('top', top);
                arrow_left.css('left', left);

                left = startPoint + leadingImage.width();
                arrow_right.css('top', top);
                arrow_right.css('left', left);
            };

            var resize = function(){
                for (var i = children.length - 1; i >= 0; i--) {
                    angular.element(children[i]).css('max-width', this.innerWidth - 100);
                }
            };

            var init = function(){
                nextImage = angular.element(children[3]);
                arrow_left = angular.element(children[0]);
                arrow_right = angular.element(children[1]);

                centerLeadingImage();
                var margin_l = leadingImage.prop('offsetLeft');
                var margin_n = nextImage.prop('offsetLeft');
                step = margin_n - margin_l;
            };

            angular.element($window).bind('load resize', function(){
                children = $element.children();
                leadingImage = angular.element(children[2]);
                leadingImage.removeClass('lp-screenshot'); //risize without animation
                resize();
                init();
                leadingImage.addClass('lp-screenshot'); //animated class for user actions
            });

            $scope.left = function(){
                var new_margin = leadingImage.prop('offsetLeft');
                if (count < children.length - 3) {
                    new_margin -= step;
                    count++;
                } else {
                    new_margin = startPoint;
                    count = 0;
                }

                leadingImage.css('margin-left', new_margin);
            };

            $scope.right = function(){
                var new_margin = leadingImage.prop('offsetLeft');
                if (count > 0) {
                    new_margin += step;
                    count--;
                }

                leadingImage.css('margin-left', new_margin);
            };
        }
    };
}])
.directive('textSlider', ['$window', '$timeout', function($window, $timeout){
    return {
        scope: {
            time: '@',
            active: '='
        },
        link: function(scope, element, attrs){
            var children = element.children();
            var start = function(){
                $timeout(function(){
                    scope.active = scope.active + 1 === children.length ? 0 : scope.active + 1;
                    start();
                }, scope.time);
            };

            start();
        }
    };
}])
.directive('screenshot', ['$window', function($window){
    return {
        // template: '<img src="{{src}}" class="center-block " alt="Add repository" height="1000px">',
        scope: {
            stepId: '@',
            // src: '@',
            nextstep: '&'
        },
        link: function(scope, element, attrs){
            var screenshot = element;
            var inititalScreenshotOffset;

            var positionScreenshot = function(){
                screenshot.attr('height', $window.innerHeight + 'px');
                screenshot.parent().css('height', $window.innerHeight + 'px');
                screenshot.css('margin-left', ($window.innerWidth - screenshot[0].width) / 2 + 'px');

                inititalScreenshotOffset = screenshot.parent()[0].offsetTop;

            };

            angular.element($window).bind('scroll', function() {
                var threshold = this.pageYOffset - inititalScreenshotOffset;
                console.log(threshold);
                // console.log('pageYOffset: ', this.pageYOffset, ' offsetTop: ', offset);
                if(this.pageYOffset > inititalScreenshotOffset) {
                    screenshot.css('position', 'fixed');
                    screenshot.css('bottom', '0px');
                    // scope.visible = false;
                //      scope.boolChangeClass = true;
                } else {
                    screenshot.css('position', 'inherit');
                }

                if (threshold > 150) {
                    if (scope.stepId === 'step1') {
                        console.log(scope.nextstep());
                        scope.nextstep().step1 = true;
                    }
                } else {
                    if (scope.stepId === 'step1') {
                        scope.nextstep().step1 = false;
                    }
                }

                scope.$apply();

            });

            angular.element($window).bind('resize', function(){
                positionScreenshot();
                scope.$apply();
            });

            angular.element($window).bind('load', function(){
                positionScreenshot();
                scope.$apply();
            });
        }
    };
}]);

filters.filter('notIn', function() {
    return function(repos, arr) {

        if(arr.length === 0) {
            return repos;
        }

        var notMatched = [];

        repos.forEach(function(item){
            var found = false;
            arr.some(function(claRepo){
                found = claRepo.repo === item.name && claRepo.owner === item.owner.login ? true : false;
                return found;
            });
            if (!found) {
                notMatched.push(item);
            }
        });

        return notMatched;
    };
});

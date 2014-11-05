var module = angular.module('app',
    ['ui.utils',
     'ui.router',
     'ui.bootstrap']);

// *************************************************************
// Delay start
// *************************************************************

angular.element(document).ready(function() {
    angular.bootstrap(document, ['app']);
});

// *************************************************************
// States
// *************************************************************

module.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider) {

        $stateProvider

            //
            // Home state
            //
            .state('home', {
                url: '/',
                templateUrl: '/templates/home.html',
                controller: 'HomeCtrl'
            })

            // //
            // // Accepted CLA
            // //
            // .state('cla', {
            //     url: '/accept/:owner/:repoId',
            //     templateUrl: '/templates/cla.html',
            //     controller: 'ClaController'
            // })

            //
            // Repo state (abstract)
            //
            .state('repo', {
                abstract: true,
                url: '/:user/:repo?pullRequest',
                template: '<section ui-view></section>'
            })

            //
            // Repo cla
            //
            .state('repo.cla', {
                url: '',
                templateUrl: '/templates/cla.html',
                controller: 'ClaController'
            });

        $urlRouterProvider.otherwise('/');

        $locationProvider.html5Mode(true);

    }
])
.run(['$rootScope', '$state', '$stateParams',
    function($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    }
]);

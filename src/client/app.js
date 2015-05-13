var module = angular.module('app',
    ['cla.filters',
     'ui.utils',
     'ui.router',
     'ui.bootstrap',
     'ui.select',
     'ngSanitize',
     'ngAnimate']);

var filters = angular.module('cla.filters', []);
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

            //
            // Settings view
            //
            .state('home.settings', {
                // url: '/detail/:user/:repo',
                templateUrl: '/templates/settings.html',
                controller: 'SettingsCtrl',
                params: {'user': {}, 'owner': {}, 'repo': {}, 'gist': {}}
                // params: ['user', 'owner', 'repo', 'gist'] <-- was in older angular version
            })

            //
            // Detail view
            //
            .state('details', {
                url: '/detail/:user/:repo',
                templateUrl: '/templates/detail.html',
                controller: 'DetailCtrl'
            })

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

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
])
.run(['$rootScope', '$state', '$stateParams',
    function($rootScope, $state, $stateParams) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    }
]);

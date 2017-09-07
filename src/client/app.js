var module = angular.module('app', ['cla.filters',
    'cla.config',
    'ui.utils',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.popover',
    'ui.select',
    'ngSanitize',
    'ngAnimate',
    'ngCsv',
    'angulartics',
    'angulartics.google.analytics'
]);

var filters = angular.module('cla.filters', []);

angular.module('cla.config', [])
    .provider('$config', function () {

        function Config($http) {
            this.get = function (done) {
                $http.get('/config')
                    .success(function (data, status) {
                        done(data || {}, status);
                    });
            };
        }

        this.$get = ['$http',
            function ($http) {
                return new Config($http);
            }
        ];

        // var url = $.url();
        //
        // this.log = url.param('log') === 'true' || document.location.hostname === 'localhost';
    });
// *************************************************************
// Delay start
// *************************************************************

angular.element(document).ready(function () {
    angular.bootstrap(document, ['app']);
});

// *************************************************************
// States
// *************************************************************

module.config(['$stateProvider', '$urlRouterProvider', '$locationProvider',
        function ($stateProvider, $urlRouterProvider, $locationProvider) {

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
                params: {
                    'user': {},
                    'owner': {},
                    'repo': {},
                    'gist': {}
                }
                // params: ['user', 'owner', 'repo', 'gist'] <-- was in older angular version
            })

            //
            // My-CLA state
            //
            .state('cla', {
                abstract: true,
                url: '/my-cla',
                template: '<section ui-view></section>'
            })


            .state('cla.myCla', {
                url: '',
                templateUrl: '/templates/my-cla.html',
                controller: 'MyClaCtrl'
            })

            //
            // Repo state (abstract)
            //
            .state('repo', {
                abstract: true,
                url: '/:user/:repo?pullRequest&redirect',
                template: '<section ui-view></section>'
            })

            //
            // Repo cla
            //
            .state('repo.cla', {
                url: '',
                templateUrl: '/templates/cla.html',
                controller: 'ClaController'
            })

            //
            // 404 Error
            //
            .state('404', {
                url: '/404',
                templateUrl: '/templates/404.html'
            });

            $urlRouterProvider.otherwise('/404');

            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });
        }
    ])
    .run(['$rootScope', '$state', '$stateParams', '$config',
        function ($rootScope, $state, $stateParams, $config) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;

            $config.get(function (data) {
                $rootScope.$config = data;
                if (data.gacode) {
                    ga('create', data.gacode, 'auto');
                }
            });
        }
    ]);

// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

var module = angular.module('app', ['cla.filters',
    'ui.utils',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.popover',
    'ui.select',
    'ngSanitize',
    'ngAnimate',
    'ngCsv'
]);
// eslint-disable-next-line no-unused-vars
var filters = angular.module('cla.filters', []);

// *************************************************************
// Delay start
// *************************************************************

angular.element(document).ready(function () {
    angular.bootstrap(document, ['app']);
    angular.element(document.querySelectorAll('.needs-javascript')).removeClass('needs-javascript');
});

// *************************************************************
// States
// *************************************************************

module.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$compileProvider', '$qProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider) {

        $stateProvider
            //
            // Home state
            //
            .state('home', {
                url: '/',
                templateUrl: '/assets/templates/home.html',
                controller: 'HomeCtrl'
            })

            //
            // Settings view
            //
            .state('home.settings', {
                // url: '/detail/:user/:repo',
                templateUrl: '/assets/templates/settings.html',
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
                templateUrl: '/assets/templates/my-cla.html',
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
                templateUrl: '/assets/templates/cla.html',
                controller: 'ClaController'
            })

            //
            // 404 Error
            //
            .state('404', {
                url: '/404',
                templateUrl: '/assets/templates/404.html'
            });

        $urlRouterProvider.otherwise('/404');

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob|chrome-extension|data):/);
    }
]);

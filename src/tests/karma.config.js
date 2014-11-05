// Karma configuration

module.exports = function(config) {
    config.set({

        basePath: '../../',

        frameworks: ['mocha'],

        // list of files / patterns to load in the browser
        files: [
            // Testing libs
            // TODO: CDN
            'src/bower/should/should.js',

            // Angular
            'src/bower/angular/angular.js',

            'https://cdn.socket.io/socket.io-1.0.4.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.js',
            'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.1.1/js/bootstrap.min.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.20/angular-route.min.js',
            'https://ajax.googleapis.com/ajax/libs/angularjs/1.2.20/angular.min-animate.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui/0.4.0/angular-ui.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-utils/0.1.1/angular-ui-utils.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.2.10/angular-ui-router.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.10.0/ui-bootstrap-tpls.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.6.0/moment.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.0.1/js/bootstrap-switch.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min.js',
            'https://www.google-analytics.com/analytics.js',
            'src/bower/ngInfiniteScroll/build/ng-infinite-scroll.min.js',
            'src/bower/angulartics/dist/angulartics.min.js',
            'src/bower/angulartics/dist/angulartics-ga.min.js',

            // TODO: CDN
            'src/bower/angular-mocks/angular-mocks.js',
            'src/bower/angular-bootstrap-switch/dist/angular-bootstrap-switch.js',
            // 'src/bower/angular-loggly-logger/angular-loggly-logger.js',

            // Client code
            'src/client/modules/config.js',
            'src/client/app.js',
            'src/client/api.js',
            'src/client/controller/**/*.js',
            // 'src/client/directives/**/*.js',
            // 'src/client/filters/**/*.js',
            // 'src/client/interceptors/**/*.js',
            // 'src/client/services/**/*.js',

            // Client templates
            'src/client/**/*.html',

            // Tests
            'src/tests/client/**/*.js'
        ],


        // list of files to exclude
        exclude: [

        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/client/**/*.html': ['ng-html2js']
        },

        ngHtml2JsPreprocessor: {
            stripPrefix: 'src/client',
            moduleName: 'templates'
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};

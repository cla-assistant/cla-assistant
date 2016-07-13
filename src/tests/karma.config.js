// Karma configuration

module.exports = function(config) {
    config.set({

        basePath: '../../',

        frameworks: ['mocha'],

        // list of files / patterns to load in the browser
        files: [
            // Testing libs
            // CDN
            'http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.2.13/angular-ui-router.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.12.1/ui-bootstrap-tpls.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-select/0.11.2/select.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-utils/0.1.1/angular-ui-utils.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-scroll/0.6.5/angular-scroll.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular-animate.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular-route.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular.js/1.3.15/angular-sanitize.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/ng-csv/0.3.3/ng-csv.min.js',
            'http://www.google-analytics.com/analytics.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angulartics/0.17.2/angulartics.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angulartics/0.17.2/angulartics-ga.min.js',

            'http://cdnjs.cloudflare.com/ajax/libs/sinon.js/1.7.3/sinon-min.js',

            'src/bower/should/should.js',

            // Bower
            'src/bower/bootstrap-sass-official/assets/javascripts/bootstrap.js',
            'src/bower/angular-mocks/angular-mocks.js',

            // Client code
            'src/client/app.js',
            'src/client/api.js',
            'src/client/services/**/*.js',
            'src/client/controller/**/*.js',

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

        // to avoid DISCONNECTED messages
        browserDisconnectTimeout : 10000, // default 2000
        browserDisconnectTolerance : 1, // default 0
        browserNoActivityTimeout : 60000, //default 10000

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
        // browsers: ['Chrome'],
        plugins: [
            'karma-ng-html2js-preprocessor',
            'karma-mocha',
            'karma-phantomjs-launcher'
        ],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};

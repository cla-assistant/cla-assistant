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
            'src/bower/jquery/dist/jquery.js',
            'src/bower/bootstrap-sass-official/assets/javascripts/bootstrap.js',
            'src/bower/angular/angular.js',
            'src/bower/angular-route/angular-route.js',
            'src/bower/angular-ui-router/release/angular-ui-router.js',
            'src/bower/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'src/bower/angular-ui-select/dist/select.js',
            'src/bower/angular-ui-utils/ui-utils.min.js',
            'src/bower/angular-sanitize/angular-sanitize.js',

            // TODO: CDN
            'src/bower/angular-mocks/angular-mocks.js',
            'src/bower/angular-bootstrap-switch/dist/angular-bootstrap-switch.js',
            // 'src/bower/angular-loggly-logger/angular-loggly-logger.js',

            // Client code
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

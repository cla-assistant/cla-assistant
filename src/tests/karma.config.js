// Karma configuration

module.exports = function (config) {
    config.set({

        basePath: '../../',

        frameworks: ['mocha'],

        // list of files / patterns to load in the browser
        files: [
            // Testing libs
            // CDN
            'http://ajax.aspnetcdn.com/ajax/jQuery/jquery-2.1.3.min.js',

            // Bower
            'src/bower/should/should.js',
            'src/bower/angular/angular.min.js',
            'src/bower/angular-animate/angular-animate.min.js',
            'src/bower/angular-route/angular-route.js',
            'src/bower/angular-ui-router/release/angular-ui-router.min.js',
            'src/bower/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'src/bower/angular-ui-select/dist/select.min.js',
            'src/bower/angular-ui-utils/ui-utils.min.js',
            'src/bower/angular-sanitize/angular-sanitize.min.js',
            'src/bower/ng-csv/build/ng-csv.min.js',
            'src/bower/angulartics/dist/angulartics.min.js',
            'src/bower/angulartics/dist/angulartics-ga.min.js',
            'src/bower/bootstrap-sass-official/assets/javascripts/bootstrap.js',
            'src/bower/angular-mocks/angular-mocks.js',
            'src/bower/sinonjs/sinon.js',

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
        browserDisconnectTimeout: 10000, // default 2000
        browserDisconnectTolerance: 1, // default 0
        browserNoActivityTimeout: 60000, //default 10000

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
            // 'karma-chrome-launcher'
            'karma-phantomjs-launcher',
        ],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    });
};

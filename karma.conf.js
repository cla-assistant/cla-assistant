module.exports = function (config) {
  var testWebpackConfig = require('./webpack.test.js');

  config.set({

    basePath: '',

    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'intl-shim'],

    files: [
      './config/spec-bundle.js'
    ],
    exclude: [],

    preprocessors: { './config/spec-bundle.js': ['webpack', 'sourcemap'] },

    webpack: testWebpackConfig,

    mochaReporter: {
      colors: {
        success: 'green',
        info: 'cyan',
        warning: 'yellow',
        error: 'red'
      }
    },

    coverageReporter: {
      dir: 'coverage/client',
      // reporters: [
      //   { type: 'text-summary' },
      //   { type: 'json' },
      //   { type: 'html' }
      // ]
      reporters: [{
        type: 'json',
        dir: 'coverage/client',
        subdir: 'temp',
        file: 'coverage-final.json'
      }]
    },
    // remapIstanbulReporter: {
    //   src: 'coverage/client/jsonES5/coverage-final.json',
    //   reports: {
    //     html: 'coverage/client/htmlTS',
    //     'text': null
    //   },
    //   timeoutNotCreated: 1000, // default value
    //   timeoutNoMoreFiles: 1000 // default value
    // },

    webpackServer: { noInfo: true },


    reporters: ['mocha'],

    port: 9876,

    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    autoWatch: false,
    singleRun: true,


    browsers: [
      // Uncomment this to run the tests in Chrome
      //'Chrome',
      'PhantomJS'
    ],

    client: {
      captureConsole: true,
    }


  });

};
module.exports = function(grunt) {

    var config = {

        pkg: grunt.file.readJSON('package.json'),

        mocha_istanbul: {
            coverage: {
                src: 'src/tests/server',
                options: {
                    coverage: true,
                    mask: '**/*.js',
                    coverageFolder: 'output/coverage'
                }
            }
        },

        coveralls: {
            mocha: {
                src: 'output/coverage/lcov.info'
            }
        },

        // server tests
        mochaTest: {
            server: {
                src: ['src/tests/server/**/*.js']
            }
        },

        // client tests
        karma: {
            unit: {
                configFile: 'src/tests/karma.config.js'
            }
        },

        eslint: {
            // app: {
                options:{
                    config: '.eslintrc'
                },
                target: ['*.js', 'src']
            // }
        },

        scsslint: {
            allFiles: [
              'src/client/assets/styles/*.scss'
            ],
            options: {
              config: '.scss-lint.yml',
              colorizeOutput: true
            }
        }
    };

    // Initialize configuration
    grunt.initConfig(config);

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('lint', ['eslint', 'scsslint']);
    grunt.registerTask('coverage', ['mocha_istanbul', 'coveralls']);
    grunt.registerTask('default', ['eslint', 'mochaTest', 'karma']);
};

module.exports = function(grunt) {
    var appJsFiles = [
      'src/client/app.js',
      'src/client/api.js',
      'src/client/controller/**/*.js',
      'src/client/modals/**/*.js'
    ];

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
                options: {
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
        },

        watch: {
            uglify: {tasks: ['uglify'], files: appJsFiles},
            karma: {tasks: ['eslint', 'mochaTest', 'karma'], files: 'src/**/*.js'}
        },

        uglify: {
          options: {
            sourceMap: true,
            sourceMapIncludeSources: true,
            mangle: false
          },
          target: {
            files: {
              'src/client/app.min.js': appJsFiles
            }
          }
        }
    };

    // Initialize configuration
    grunt.loadNpmTasks('grunt-autowatch');
    grunt.initConfig(config);

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('lint', ['eslint', 'scsslint']);
    grunt.registerTask('coverage', ['mocha_istanbul', 'coveralls']);
    grunt.registerTask('default', ['uglify', 'eslint', 'mochaTest', 'karma', 'watch']);
};

const sass = require('sass');

module.exports = function (grunt) {
    let appJsFiles = [
        'src/client/src/app.js',
        'src/client/src/api.js',
        'src/client/src/controller/**/*.js',
        'src/client/src/modals/**/*.js',
        'src/client/src/services/**/*.js'
    ];

    let config = {

        pkg: grunt.file.readJSON('package.json'),

        coveralls: {
            target: {
                src: 'output/coverage/lcov.info'
            }
        },

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

        // server tests
        mochaTest: {
            server: {
                options: {
                    timeout: 1000
                },
                src: ['src/tests/server/**/*.js']
            },
            debugServer: {
                options: {
                    timeout: 400000
                },
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
            options: {
                configFile: './.eslintrc.js'
            },
            target: ['*.js', 'src']
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
            uglify: {
                tasks: ['uglify'],
                files: appJsFiles
            },
            eslint: {
                tasks: ['eslint'],
                files: ['src/**/*.js', '!src/client/dist/app.min.js']
            },
            mocha: {
                tasks: ['mochaTest:server'],
                files: ['src/server/**/*.js', 'src/tests/server/**/*.js', '!src/client/dist/app.min.js']
            },
            karma: {
                tasks: ['karma'],
                files: ['src/client/**/*.js', 'src/tests/client/**/*.js', '!src/client/dist/app.min.js']
            }
        },

        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true,
                mangle: false
            },
            target: {
                files: {
                    'src/client/dist/app.min.js': appJsFiles
                }
            }
        },

        sass: {
            options: {
                implementation: sass,
                sourceMap: true,
                outputStyle: 'compressed',
            },
            dist: {
                files: {
                    'src/client/dist/app.css': 'src/client/src/styles/app.scss'
                }
            }
        },
    };

    // Initialize configuration
    grunt.initConfig(config);

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('build', ['uglify', 'sass']);
    grunt.registerTask('lint', ['eslint', 'scsslint']);
    grunt.registerTask('coverage', ['mocha_istanbul']);
    grunt.registerTask('default', ['uglify', 'eslint', 'mochaTest:server', 'karma', 'watch']);
    grunt.registerTask('test', ['eslint', 'mochaTest:server', 'karma']);
    grunt.registerTask('debug_test', ['mochaTest:debugServer']);
};

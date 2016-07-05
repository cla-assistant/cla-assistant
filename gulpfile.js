'use strict';

const gulp = require('gulp');

const eslint = require('gulp-eslint');
//const tslint = require('gulp-tslint');

const nodemon = require('gulp-nodemon');
const env = require('gulp-env');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');
const plumber = require('gulp-plumber');
//const karma = require('karma').Server;
const join = require('path').join;

const tsc = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const tsProject = tsc.createProject('tsconfig.json');
const tslint = require('gulp-tslint');
const Builder = require('systemjs-builder');
// const tscOptions = tsc.createProject('tsconfig.json');
// const inlineNg2Template = require('gulp-inline-ng2-template');
// const assets = require('gulp-assets');
const sass = require('gulp-sass');
// const minify = require('gulp-minify');
// const rename = require('gulp-rename');
// const concat = require('gulp-concat');

const del = require('del');

gulp.task('source', () => {
  env('.env.json');
});

gulp.task('clean', (cb) => {
  return del(['./dist'], cb);
});

gulp.task('tslint', function () {
  return gulp.src('src/client/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('verbose', {
      emitError: false
    }));
});

gulp.task('compile-ts', ['tslint'], () => {
  let tsResult = gulp.src(['src/client/**/*.ts', 'typings/index.d.ts'])
    .pipe(sourcemaps.init())
    .pipe(tsc(tsProject));
  return tsResult.js
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/client'));
});
gulp.task('copy-resources', function () {
  return gulp.src(['src/client/**/*', '!**/*.scss', '!**/*.ts'])
    .pipe(gulp.dest('./dist/client'));
});
gulp.task('compile-css', function () {
  gulp.src('src/client/assets/styles/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/client/assets/styles'));
});
gulp.task('libs', () => {
  return gulp.src([
    'core-js/client/shim.min.js',
    'zone.js/dist/zone.js',
    'reflect-metadata/Reflect.js',
    'systemjs/dist/system.src.js',
    'jquery/dist/jquery.min.js',
    'bootstrap/dist/js/bootstrap.js',
  ], { cwd: 'node_modules/**' })
    .pipe(gulp.dest('./dist/client/lib'));
});
gulp.task('bundle', ['compile-ts'], function() {
    var builder = new Builder('', 'src/client/systemjs.config.js');
    return builder
        .buildStatic('app/main.js', 'dist/client/app/bundle.js', { minify: false, sourceMaps: true})
        .then(function() {
            console.log('Build complete');
        })
        .catch(function(err) {
            console.log('Build error');
            console.log(err);
        });
});
gulp.task('watch', function () {
  gulp.watch(['src/client/**/*.ts'], ['bundle']).on('change', function (e) {
    console.log('TypeScript file ' + e.path + ' has been changed. Compiling.');
  });
  gulp.watch(['src/client/assets/styles/*.scss'], ['compile-css']).on('change', function (e) {
    console.log('Scss file ' + e.path + ' has been changed. Compiling.');
  });
  gulp.watch(['src/client/**/*', '!**/*.scss', '!**/*.ts'], ['copy-resources']).on('change', function (e) {
    console.log('Resource file ' + e.path + ' has been changed. Updating.');
  });
});
gulp.task('build', ['bundle', 'copy-resources', 'compile-css', 'libs'], () => {
  console.log('Building the project ...');
});

// gulp.task('compress-lib', function () {
//   gulp.src(['node_modules/jquery/dist/jquery.min.js',
//     'node_modules/angular2/bundles/angular2-polyfills.js',
//     'node_modules/systemjs/dist/system.src.js',
//     'node_modules/rxjs/bundles/Rx.js',
//     'node_modules/angular2/bundles/angular2.dev.js',
//     'node_modules/angular2/bundles/http.js',
//     'node_modules/bootstrap/dist/js/bootstrap.js',
//     'src/client/assets/js/edge.5.0.1.min.js'])
//   gulp.src([
//     'core-js/client/shim.min.js',
//     'zone.js/dist/zone.js',
//     'reflect-metadata/Reflect.js',
//     'rxjs/bundles/Rx.js',
//     'systemjs/dist/system.src.js',
//     'jquery/dist/jquery.min.js',
//     'bootstrap/dist/js/bootstrap.js',
//     //  '@angular/**',
//     'rxjs/**'
//   ], { cwd: 'node_modules/**' })
//     .pipe(concat('concat.js'))
//     .pipe(gulp.dest('./dist/client'))
//     .pipe(rename('lib.js'))
//     .pipe(minify())
//     .pipe(gulp.dest('./dist/client'));
// });

// gulp.task('compile',function(){
//     //compile client files, use ng2template for now to support unit tests, should be separated later
//     let tsResult = gulp.src(['./src/client/**/**/*.ts'])
//         .pipe(inlineNg2Template({ base: '//src' }))
//         .pipe(tsc(tscOptions));

//     tsResult.js.pipe(gulp.dest('./dist/client'));

//     // compile assets
//     gulp.src(['./src/*.html','./src/**/*.html'])
//     .pipe(assets({
//         js: true,
//         css: false
//     }))
//     .pipe(gulp.dest('./dist/client'));
// });

// gulp.task('watch', function() {
//     gulp.watch(['./src/client/**/**/*', './src/client/**/**/*.spec.ts'], ['compile']);
// });

// gulp.task('start', ['source', 'copy-assets','compile','watch'], (cb) => {
//     require('./app.js');
//     process.on('SIGINT', () => {
//         process.exit();
//         cb();
//     });
// });

gulp.task('start-server', ['source'], () => {
  let stream = nodemon({
    script: './app.js',
    exec: 'node --debug',
    watch: 'src',
    ext: 'js json'
  }).on('restart', () => {
    console.log('restarted');
  });
  return stream;
});

gulp.task('eslint', () => {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format());
});



gulp.task('pre-test-server', function () {
  return gulp.src(['src/server/**/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('test-server', ['pre-test-server'], () => {
  gulp.src(['./src/tests/server/**/*.js'], {
    read: false
  })
    .pipe(plumber())
    .pipe(mocha())
    .pipe(istanbul.writeReports({
      dir: './coverage',
      reporters: ['lcovonly', 'html'],
      reportOpts: { dir: './coverage' }
    }));
  // Enforce a coverage of at least 90%
  // .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

gulp.task('test-server-watch', () => {
  gulp.watch(['./src/tests/server/**/*.js', './src/server/**/*.js'], ['test-server']);
});

// gulp.task('test-ui', ['compile'], function (done) {
//     karma.start({
//       configFile: join(process.cwd(), 'karma.conf.js'),
//       singleRun: true
//     }, done);
// });

gulp.task('default', ['restart']);
gulp.task('lint', ['eslint', 'tslint']);
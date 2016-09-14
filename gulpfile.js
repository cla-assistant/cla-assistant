'use strict';

const gulp = require('gulp');
const env = require('gulp-env');
const eslint = require('gulp-eslint');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const nodemon = require('gulp-nodemon');
const plumber = require('gulp-plumber');
const typedoc = require('gulp-typedoc')

const del = require('del');

gulp.task('source', () => {
  env('.env.json');
});

gulp.task('clean', (cb) => {
  return del(['./dist'], cb);
});

gulp.task('docs', () => {
  return gulp
    .src(["src/client/**/*.ts"])
    .pipe(typedoc({
      module: "commonjs",
      target: "es5",
      includeDeclarations: true,
      exclude: '**/*.spec.ts',
      out: "./out",

      externalPattern: 'node_modules',
      excludeExternals: true,

      // TypeDoc options (see typedoc docs) 
      name: "cla-assistant",
      ignoreCompilerErrors: false,
    }))
});

gulp.task('start-server-debug', ['source'], () => {
  let stream = nodemon({
    script: './app.js',
    exec: 'node --debug',
    watch: 'src/server',
    ext: 'js json'
  }).on('restart', () => {
    console.log('restarted');
  });
  return stream;
});
gulp.task('start-server-production', ['source'], () => {
  process.env.NODE_ENV = 'production';
  let stream = nodemon({
    script: './app.js',
    exec: 'node',
    watch: 'src/server',
    ext: 'js json'
  });
  return stream;
});

gulp.task('lint', () => {
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

gulp.task('default', ['start-server-production']);
// https://raw.githubusercontent.com/AngularClass/angular2-webpack-starter/master/config/spec-bundle.js
Error.stackTraceLimit = Infinity;

require('core-js/es6');
require( 'core-js/es7/reflect');

// Typescript emit helpers polyfill
require( 'ts-helpers');

require( 'zone.js/dist/zone');
require( 'zone.js/dist/long-stack-trace-zone');
require( 'zone.js/dist/async-test');
require( 'zone.js/dist/fake-async-test');
require( 'zone.js/dist/sync-test');
require( 'zone.js/dist/proxy');
require( 'zone.js/dist/jasmine-patch');

require( 'rxjs');

require('karma-intl-shim');
Intl.__addLocaleData(JSON.parse(require('./en-us.json')));

var testing = require('@angular/core/testing');
var browser = require('@angular/platform-browser-dynamic/testing');

testing.TestBed.initTestEnvironment(
  browser.BrowserDynamicTestingModule,
  browser.platformBrowserDynamicTesting()
);

require( '../src/client/app/app.module.ts');

jasmine.pp = function(obj) {
  return JSON.stringify(obj, undefined, 2);
};
var testContext = require.context('../src/client/app', true, /\.spec.ts/);

function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

var modules = requireAll(testContext);


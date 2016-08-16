// https://raw.githubusercontent.com/AngularClass/angular2-webpack-starter/master/config/spec-bundle.js
Error.stackTraceLimit = Infinity;

import 'core-js/es6';
import 'core-js/es7/reflect';

// Typescript emit helpers polyfill
import 'ts-helpers';

import 'zone.js/dist/zone';
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import 'zone.js/dist/sync-test';


import 'rxjs';

var testing = require('@angular/core/testing');
var browser = require('@angular/platform-browser-dynamic/testing');

testing.setBaseTestProviders(
  browser.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
  browser.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS
);

import '../src/client/app/app.module.ts';


var testContext = (<any>require).context('../src/client/app', true, /\.spec.ts/);

function requireAll(requireContext) {
  return requireContext.keys().map(requireContext);
}

var modules = requireAll(testContext);


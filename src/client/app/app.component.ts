import { Component, ViewEncapsulation } from '@angular/core';


const appStyle = require('../assets/styles/app.scss');
const ng2SelectStyle = require('../assets/styles/ng2-select.css');

/**
 * Top level component that provides a `router-outlet` which functions as a
 * container for the main routes. It also makes the necessary css files 
 * available for all components by adding `ViewEncapsulation.None`
 * 
 * The main routes are defined in app.routes.ts
 */
@Component({
  selector: 'app',
  styles: [appStyle, ng2SelectStyle],
  encapsulation: ViewEncapsulation.None,
  template: `
    <router-outlet></router-outlet>
    <template ngbModalContainer></template> 
  `
})
export class AppComponent {

}

import { Component } from '@angular/core';
import { ROUTER_DIRECTIVES }  from '@angular/router';

@Component({
  selector: 'app',
  directives: [ROUTER_DIRECTIVES],
  template: `
    <a [routerLink]="['/login']">Login</a>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {

}

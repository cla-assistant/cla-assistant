import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';

@Injectable()
export class AuthService {
  private loggedIn = false;

  public isLoggedIn() {
    return Observable.of(this.loggedIn);
  }

  public doLogin() {
    return Observable.of(true).delay(1000).do(val => this.loggedIn = true);
  }

  public doLogout() {
    this.loggedIn = false;
  }
}

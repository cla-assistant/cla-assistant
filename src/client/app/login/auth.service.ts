import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';

@Injectable()
export class AuthService {
  private loggedIn = false;

  constructor(
    private http: Http,
    private window: Window) { }

  public isLoggedIn() {
    return this.http.get('/loggedin').map((res) => {
      return res.text() !== '0';
    });
  }

  public doLogin(loginAs: string) {
    let url = `/auth/github?${loginAs}=true`;
    this.window.location.replace(url);
  }

  public doLogout() {
    this.window.location.replace('/logout');
  }
}

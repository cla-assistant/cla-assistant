import { Injectable, Inject } from '@angular/core';
import { Http } from '@angular/http';


@Injectable()
export class AuthService {
  private window: Window;
  constructor(
    private http: Http,
    @Inject('Window') window) {
      this.window = window;
    }

  public isLoggedIn() {
    return this.http.get('/loggedin').map((res) => {
      return res.text() !== '0';
    });
  }

  public doLogin(requestAdmin, requestOrgAdmin) {
    let url = `/auth/github?admin=${requestAdmin}&org_admin=${requestOrgAdmin}`;
    this.window.location.replace(url);
  }

  public doLogout() {
    this.window.location.replace('/logout');
  }
}

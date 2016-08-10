import { Injectable, Inject } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

/**
 * This Service handles the backend authentication of the user
 */
@Injectable()
export class AuthService {
  constructor(
    private http: Http,
    @Inject('Window') private window: Window) {
  }

  /**
   * Checks if the user is logged in
   * 
   * @returns returns an Observable that will emit true if the user is logged
   * in and false otherwise.
   */
  public isLoggedIn(): Observable<boolean> {
    return this.http.get('/loggedin').map((res) => {
      return res.text() !== '0';
    });
  }
  /**
   * Redirects the user to the github login page.
   * 
   * @param requestAdmin Indicates if the user should log in with admin rights
   * @param requestOrgAdmin Indicates if the user should log in with org admin 
   * rights (needed for creating organization webhooks)
   */
  public doLogin(requestAdmin: boolean, requestOrgAdmin: boolean): void {
    let url = `/auth/github?admin=${requestAdmin}&org_admin=${requestOrgAdmin}`;
    this.window.location.replace(url);
  }

  /**
   * Logs out the current user
   * 
   * @param noRedirect True if the user should not be redirected
   */
  public doLogout(): void {
      this.window.location.replace(`/logout`);
  }
}

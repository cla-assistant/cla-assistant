import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Can be used to guard a rout. If a user that ist not logged in will navigate
 * to a guarded route, he will be redirected to the login page
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  /**
   * Will be called when the user navigates to the guarded route.
   * Checks whether the user is logged in by using the [[AuthService]]
   */
  public canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.isLoggedIn().do((loggedIn: boolean) => {
      if (!loggedIn) { this.router.navigate(['/login']); }
    });
  }
}

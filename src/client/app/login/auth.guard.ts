import { Injectable } from '@angular/core';
import { CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.authService.isLoggedIn().do((loggedIn: boolean) => {
      if (!loggedIn) { this.router.navigate(['/login']); }
    });
  }
}

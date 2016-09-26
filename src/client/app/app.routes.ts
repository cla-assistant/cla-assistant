import { RouterModule, Route } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login';
import { SignClaComponent } from './sign-cla/sign-cla.component';
import { AuthGuard } from './login';

/**
 * Defines the main routes for the application:
 * - home page (guarded by the [[AuthGuard]])
 * - login page
 * - sign cla page
 */
export const routes: Route[] = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent},
  { path: ':user/:repo', component: SignClaComponent}
];

// exports the router service which will be bootstrapped in main.ts
export const AppRouterModule = RouterModule.forRoot(routes);

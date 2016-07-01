import { provideRouter, RouterConfig } from '@angular/router';
import { Home } from './home/home.component';
import { Login } from './login/login.component';
import { AuthGuard } from './login/auth.guard';
import { AuthService } from './login/auth.service';

export const routes: RouterConfig = [
  { path: '', component: Home, canActivate: [AuthGuard] },
  { path: 'login', component: Login}
];

export const APP_ROUTER_PROVIDERS = [
  AuthService,
  AuthGuard,
  provideRouter(routes)
];

import { provideRouter, RouterConfig } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './login/auth.guard';
import { AuthService } from './login/auth.service';

export const routes: RouterConfig = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent}
];

export const APP_ROUTER_PROVIDERS = [
  AuthService,
  AuthGuard,
  provideRouter(routes)
];

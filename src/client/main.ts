import { bootstrap }    from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { APP_ROUTER_PROVIDERS } from './app/app.routes';
import {provide} from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { GithubService } from './app/shared/github/github.service';




bootstrap(AppComponent, [
  APP_ROUTER_PROVIDERS,
  HTTP_PROVIDERS,
  GithubService,
  provide('Window', {useValue: window})])
.catch(err => console.error(err));

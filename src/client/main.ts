import { bootstrap }    from '@angular/platform-browser-dynamic';
import { provide, enableProdMode } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { BROWSER_SANITIZATION_PROVIDERS } from '@angular/platform-browser';

import { APP_ROUTER_PROVIDERS } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { GithubService } from './app/shared/github/github.service';
import { ClaBackendService } from './app/shared/claBackend/claBackend.service';

// enableProdMode();

bootstrap(AppComponent, [
  HTTP_PROVIDERS,
  BROWSER_SANITIZATION_PROVIDERS,
  APP_ROUTER_PROVIDERS,
  GithubService,
  ClaBackendService,
  provide('Window', {useValue: window})])
.catch(err => console.error(err));

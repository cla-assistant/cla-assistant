import { bootstrap }    from '@angular/platform-browser-dynamic';
import { AppComponent } from './app.component';
import { APP_ROUTER_PROVIDERS } from './app.routes';
import {provide} from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { GithubService } from './shared/github/github.service';

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/combineLatest';


bootstrap(AppComponent, [
  APP_ROUTER_PROVIDERS,
  HTTP_PROVIDERS,
  GithubService,
  provide(Window, {useValue: window})])
.catch(err => console.error(err));

import { bootstrap }    from '@angular/platform-browser-dynamic';
import { AppComponent } from './app.component';
import { APP_ROUTER_PROVIDERS } from './app.routes';
import {provide} from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';

bootstrap(AppComponent, [
  APP_ROUTER_PROVIDERS,
  provide(Window, {useValue: window}),
  HTTP_PROVIDERS])
.catch(err => console.error(err));

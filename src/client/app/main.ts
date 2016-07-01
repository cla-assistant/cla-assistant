import { bootstrap }    from '@angular/platform-browser-dynamic';
import { AppComponent } from './app.component';
import { APP_ROUTER_PROVIDERS } from './app.routes';
import {provide} from '@angular/core';

bootstrap(AppComponent, [APP_ROUTER_PROVIDERS, provide(Window, {useValue: window})])
.catch(err => console.error(err));

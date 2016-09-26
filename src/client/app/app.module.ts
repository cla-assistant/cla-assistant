/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../node_modules/rxjs/Rx.d.ts" />
/// <reference path="./test-utils/observableMatcher.d.ts" />
import { NgModule }       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRouterModule } from './app.routes';
import { SignClaModule } from './sign-cla';
import { LoginModule } from './login';
import { HomeModule } from './home';

import {
  GithubService,
  GithubCacheService
} from './shared/github';
import { ClaBackendService } from './shared/claBackend';

import { AppComponent }   from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    AppRouterModule,
    NgbModule,

    SignClaModule,
    LoginModule,
    HomeModule
  ],
  providers: [
    GithubService,
    GithubCacheService,
    ClaBackendService,
    { provide: 'Window', useValue: window }
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}

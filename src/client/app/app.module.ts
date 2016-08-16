/// <reference path="../../../typings/index.d.ts" />
/// <reference path="./test-utils/observableMatcher.d.ts" />
import { NgModule }       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import { AppComponent }   from './app.component';
import { LoginComponent } from './login';
import { HomeComponent } from './home/home.component';
import { SignClaComponent } from './sign-cla/sign-cla.component';

import { APP_ROUTER_MODULE } from './app.routes';
import { GithubService } from './shared/github/github.service';
import { ClaBackendService } from './shared/claBackend/claBackend.service';
import { LOGIN_PROVIDERS } from './login/';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    SignClaComponent
  ],
  providers: [
    LOGIN_PROVIDERS,
    GithubService,
    ClaBackendService,
    { provide: 'Window',  useValue: window }
  ],
  imports: [
    BrowserModule,
    HttpModule,
    APP_ROUTER_MODULE
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}

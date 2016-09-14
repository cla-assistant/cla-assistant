/// <reference path="../../../typings/index.d.ts" />
/// <reference path="../../../node_modules/rxjs/Rx.d.ts" />
/// <reference path="./test-utils/observableMatcher.d.ts" />
import { NgModule }       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';

import { AppComponent }   from './app.component';
import { AppFrameComponent } from './app-frame/app-frame.component';
import { LinkedItemListComponent } from './home/repo-list/linked-item-list.component';
import { LinkedItemRowComponent } from './home/repo-list/linked-item-row.component';
import { DropdownComponent } from './home/cla-link/dropdown.component';
import { InfoModal } from './home/cla-link/info.modal';
import { ConfirmAddModal } from './home/cla-link/confirm-add.modal';
import { ClaLinkComponent } from './home/cla-link/cla-link.component';
import { ClaLinkFormComponent } from './home/cla-link/cla-link-form.component';
import { LinkStatusModal } from './home/cla-link/link-status.modal';
import { ConfirmRemoveModal } from './home/repo-list/confirm-remove.modal';
import { RepoLink } from './home/repo-list/repo-link.component';
import { OrgLink } from './home/repo-list/org-link.component';
import { StatusIndicatorComponent } from './home/repo-list/status-indicator.component';
import { ReportModal } from './home/repo-list/report/report.modal';
import { VersionDropdownComponent } from './home/repo-list/report/version-dropdown.component'
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login';
import { SignClaComponent } from './sign-cla/sign-cla.component';
import { CustomFieldComponent } from './sign-cla/custom-field.component';

import { APP_ROUTER_MODULE } from './app.routes';
import { GithubService } from './shared/github/github.service';
import { ClaBackendService } from './shared/claBackend/claBackend.service';
import { LOGIN_PROVIDERS } from './login/';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';
import { TooltipModule } from 'ng2-tooltip';
import { PopoverModule } from 'ng2-popover';

import {SELECT_DIRECTIVES} from 'ng2-select';


@NgModule({
  declarations: [
    LinkedItemListComponent,
    LinkedItemRowComponent,
    AppComponent,
    AppFrameComponent,
    LoginComponent,
    HomeComponent,
    SignClaComponent,
    DropdownComponent,
    InfoModal,
    ConfirmAddModal,
    ClaLinkFormComponent,
    LinkStatusModal,
    ClaLinkComponent,
    ConfirmRemoveModal,
    RepoLink,
    OrgLink,
    StatusIndicatorComponent,
    ReportModal,
    VersionDropdownComponent,
    CustomFieldComponent,
    ...SELECT_DIRECTIVES
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
    APP_ROUTER_MODULE,
    Ng2Bs3ModalModule,
    TooltipModule,
    PopoverModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}

import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';

import { AppFrameComponent } from '../app-frame/app-frame.component';
import { HomeComponent } from './home.component';
import { HomeService } from './home.service';

import { AppFrameModule } from '../app-frame/app-frame.module';
import { ClaLinkModule } from './cla-link/cla-link.module';
import { RepoListModule } from './repo-list/repo-list.module';

@NgModule({
  imports: [
    CommonModule,
    AppFrameModule,
    ClaLinkModule,
    RepoListModule
  ],
  providers: [
    HomeService
  ],
  declarations: [
    HomeComponent
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule {

}

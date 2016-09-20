import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';

import { AppFrameComponent } from './app-frame.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    AppFrameComponent
  ],
  exports: [
    AppFrameComponent
  ]
})
export class AppFrameModule {

}

import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { AppFrameModule } from '../app-frame/app-frame.module';

import { SignClaComponent } from './sign-cla.component';
import { CustomFieldComponent } from './custom-field.component';


@NgModule({
  imports: [
    CommonModule,
    AppFrameModule
  ],
  declarations: [
    SignClaComponent,
    CustomFieldComponent
  ],
  exports: [
    SignClaComponent
  ]
})
export class SignClaModule {

}

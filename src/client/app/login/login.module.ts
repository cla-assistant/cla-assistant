import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';

import { LoginComponent } from './login.component';
import { FeatureComponent } from './feature.component';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    AuthGuard,
    AuthService
  ],
  declarations: [
    LoginComponent,
    FeatureComponent
  ],
  exports: [
    LoginComponent
  ]
})
export class LoginModule {

}

/**
 * This module is a workaround until the ng-select library updates to RC6 or higher
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {SELECT_DIRECTIVES} from 'ng2-select';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    ...SELECT_DIRECTIVES
  ],
  exports: [
    ...SELECT_DIRECTIVES
  ]
})
export class SelectModule {

}

import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { SelectModule } from 'ng2-select';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { ClaLinkComponent } from './cla-link.component';
import { ClaLinkFormComponent } from './cla-link-form.component';
import { ConfirmAddModal } from './confirm-add.modal';
import { DropdownComponent } from './dropdown.component';
import { InfoModal } from './info.modal';
import { LinkStatusModal } from './link-status.modal';



@NgModule({
  imports: [
    CommonModule,
    SelectModule,
    NgbModule
  ],
  declarations: [
    ClaLinkComponent,
    ClaLinkFormComponent,
    ConfirmAddModal,
    DropdownComponent,
    InfoModal,
    LinkStatusModal
  ],
  exports: [
    ClaLinkComponent
  ]
})
export class ClaLinkModule {

}

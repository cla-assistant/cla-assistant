import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { SelectModule } from '../../select.module';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';

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
    Ng2Bs3ModalModule
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

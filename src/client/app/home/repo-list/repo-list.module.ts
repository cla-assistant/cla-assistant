import { NgModule } from '@angular/core';
import { CommonModule }       from '@angular/common';

import { SelectModule } from '../../select.module';
import { TooltipModule } from 'ng2-tooltip';
import { PopoverModule } from 'ng2-popover';
import { Ng2Bs3ModalModule } from 'ng2-bs3-modal/ng2-bs3-modal';

import { ConfirmRemoveModal } from './confirm-remove.modal';
import { GetBadgeModal } from './get-badge.modal';
import { LinkedItemListComponent } from './linked-item-list.component';
import { LinkedItemRowComponent } from './linked-item-row.component';
import { OrgLink } from './org-link.component';
import { RepoLink } from './repo-link.component';
import { StatusIndicatorComponent } from './status-indicator.component';

import { CsvDownloadService } from './report/csv-download.service';
import { ReportModal } from './report/report.modal';
import { VersionDropdownComponent } from './report/version-dropdown.component';


@NgModule({
  imports: [
    CommonModule,
    SelectModule,
    TooltipModule,
    PopoverModule,
    Ng2Bs3ModalModule
  ],
  providers: [
    CsvDownloadService
  ],
  declarations: [
    ConfirmRemoveModal,
    ConfirmRemoveModal,
    GetBadgeModal,
    LinkedItemListComponent,
    LinkedItemRowComponent,
    OrgLink,
    RepoLink,
    StatusIndicatorComponent,

    ReportModal,
    VersionDropdownComponent
  ],
  exports: [
    LinkedItemListComponent
  ]
})
export class RepoListModule {

}

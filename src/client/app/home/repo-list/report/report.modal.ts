import { Component, ViewChild, Input } from '@angular/core';
import { MODAL_DIRECTIVES, ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { SelectComponent } from 'ng2-select';

import { LinkedItem, Signature } from '../../../shared/claBackend';
import { VersionDropdownComponent } from './version-dropdown.component';
import { ClaBackendService } from '../../../shared/claBackend/claBackend.service';

@Component({
  selector: 'report-modal',
  directives: [MODAL_DIRECTIVES, VersionDropdownComponent],
  templateUrl: './report.modal.html'
})
export class ReportModal {
  @Input() private claItem: LinkedItem;
  @Input() private gist;
  @ViewChild('reportModal')
  private modal: ModalComponent;

  private contributors: Signature[];
  private selectedVersion: string;
  private visible: boolean = false;
  private reverse: boolean;
  private column: string;

  constructor(private claBackendService: ClaBackendService) { }

  public open() {
    this.contributors = null;
    this.reverse = false;
    this.column = 'user_name';
    this.visible = true;
    this.modal.open();
  }

  public close() {
    this.visible = false;
    this.modal.close();
  }

  private loading() {
    return this.contributors === null;
  }

  private getGistName() {
    return this.gist.fileName;
  }

  private onVersionSelected(versionObj) {
    this.contributors = null;
    this.claBackendService.getClaSignatures(this.claItem, versionObj.version).subscribe(
      signatures => {
        this.contributors = [];
        if (signatures && signatures.length > 0) {
          this.contributors = signatures;
        }
      }
    );
  }
}

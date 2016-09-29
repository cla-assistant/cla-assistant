import { Component, ViewChild, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectComponent } from 'ng2-select';

import { CsvDownloadService } from './csv-download.service';
import { LinkedItem, Signature } from '../../../shared/claBackend';
import { VersionDropdownComponent } from './version-dropdown.component';
import { ClaBackendService } from '../../../shared/claBackend';
import { Gist } from '../../../shared/github';

@Component({
  selector: 'report-modal',
  templateUrl: './report.modal.html'
})
export class ReportModal {
  @Input() private claItem: LinkedItem;
  @Input() private gist: Gist;
  @ViewChild('modalContent')
  private content;

  private contributors: Signature[];
  private selectedVersion: string;
  private reverse: boolean;
  private column: string;

  constructor(
    private claBackendService: ClaBackendService,
    private csvDownloadService: CsvDownloadService,
    private modalService: NgbModal
  ) { }

  public open() {
    this.contributors = null;
    this.reverse = false;
    this.column = 'user_name';
    this.modalService.open(this.content).result.catch(() => false);
  }

  private exportAsCsv() {
    if (!this.contributors || this.contributors.length === 0) {
      return;
    }
    let fields =
      ['user_name', 'repo_owner', 'repo_name', 'gist_name', 'gist_url', 'gist_version', 'signed_at', 'org_cla'];
    let fieldHeader =
      ['User Name', 'Repository Owner', 'Repository Name', 'CLA Title', 'Gist URL', 'Gist Version', 'Signed At', 'Signed for Organisation'];
    Object.keys(this.contributors[0].custom_fields).forEach(key => {
      fields.push(key);
      fieldHeader.push(key);
      this.contributors.forEach(obj => obj[key] = obj.custom_fields[key]);
    });
    this.csvDownloadService.downloadAsCsv(
      'cla-assistant.csv',
      this.contributors,
      fields,
      fieldHeader
    );
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
        if (signatures) {
          this.contributors = signatures;
          this.contributors.forEach(obj => obj.gist_name = this.getGistName());
        }
      }
    );
  }
}

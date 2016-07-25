import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { ClaBackendService } from '../../shared/claBackend/claBackend.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { RepoLink } from './repo-link.component';

@Component({
  selector: 'linked-item-row',
  directives: [RepoLink],
  templateUrl: 'linked-item-row.component.html'
})

export class LinkedItemRowComponent implements OnInit {
  @Input() public item: LinkedItem;
  @Output() public onUnlink: EventEmitter<LinkedItem>;

  private gist: any = {
    fullName: '',
    html_url: '',
    updated_at: null
  };
  private gistValid: boolean = false;
  private webhookValid: boolean = false;
  private signatures = [];

  constructor(private claBackendService: ClaBackendService) {
    this.onUnlink = new EventEmitter<LinkedItem>();
  }

  public ngOnInit() {
    this.claBackendService.getGistInfo(this.item).subscribe(
      (gist) => {
        if (gist) {
          this.gist = gist;
          this.normalizeGistName(this.gist);
          this.gistValid = !!this.gist.id;
          this.getClaSignatures(gist.history[0].version);
        }
      },
      (error) => {
        console.log(error);
      }
    );
    this.claBackendService.getWebhook(this.item).subscribe(
      webhook => {
        if (webhook) { this.webhookValid = webhook.active; }
      },
      () => this.webhookValid = false
    );
  }

  private getClaSignatures(version: string) {
    this.claBackendService.getClaSignatures(this.item, version).subscribe(
      signatures => this.signatures = signatures
    );
  }


  public isValid() {
    return this.gistValid && this.webhookValid;
  }

  private normalizeGistName(gist) {
    if (!gist.fileName && gist.files) {
      let fileName = Object.keys(gist.files)[0];
      fileName = gist.files[fileName].filename ? gist.files[fileName].filename : fileName;
      gist.fileName = fileName;
    }
  }

}

import {Component, Input, Output, EventEmitter, OnInit, ViewChild} from '@angular/core';

import { RepoLink } from './repo-link.component';
import { OrgLink } from './org-link.component';
import { StatusIndicatorComponent } from './status-indicator.component';
import { ReportModal } from './report/report.modal';
import { GetBadgeModal } from './get-badge.modal';

import {
  GithubCacheService,
  Gist
} from '../../shared/github';
import {
  ClaBackendService,
  LinkedItem
} from '../../shared/claBackend';

@Component({
  selector: 'linked-item-row',
  templateUrl: 'linked-item-row.component.html'
})

export class LinkedItemRowComponent implements OnInit {
  @Input() public item: LinkedItem;
  @Output() public onUnlink: EventEmitter<LinkedItem>;
  @ViewChild(GetBadgeModal) private getBadgeModal;

  private gist: Gist = {
    fileName: '',
    url: '',
    updatedAt: null,
    history: []
  };
  private gistValid: boolean = false;
  private webhookValid: boolean = false;
  private numOfSignatures = 0;

  constructor(
    private claBackendService: ClaBackendService,
    private githubCacheService: GithubCacheService
  ) {
    this.onUnlink = new EventEmitter<LinkedItem>();
  }

  public ngOnInit() {
    this.githubCacheService.getGistInfo(this.item.gist).subscribe(
      (gist: Gist) => {
        if (gist) {
          this.gist = gist;
          this.gistValid = true;
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
      signatures => this.numOfSignatures = signatures.length
    );
  }

  public isValid() {
    return this.gistValid && this.webhookValid;
  }

  public recheckPR() {
    this.claBackendService.validatePullRequest(this.item).subscribe(() => {
    });
  }

  public getBadge() {
    this.getBadgeModal.open();
  }

  notImplemented(){
  }
}

import { Component, Input, ViewChild } from '@angular/core';

import { ClaLinkFormComponent } from './cla-link-form.component';
import { User } from '../../shared/github/user';
import { HomeService } from '../home.service';
import { LinkStatusModal } from './link-status.modal';

@Component({
  selector: 'cla-link',
  templateUrl: './cla-link.component.html'
})
export class ClaLinkComponent {
  @Input() public user: User = null;
  @ViewChild(LinkStatusModal)
  private linkStatusModal: LinkStatusModal;
  private linkFormVisible: boolean = false;

  constructor(private homeService: HomeService) { }

  public toggleLinkForm() {
    this.linkFormVisible = !this.linkFormVisible;
  }

  public link(e) {
    this.linkStatusModal.open(e.selectedGist, e.selectedRepoOrOrg);
    this.homeService
      .link(e.selectedGist, e.selectedRepoOrOrg)
      .subscribe(
        () => {
          this.linkStatusModal.linkSuccess();
          this.toggleLinkForm();
        },
        (error) => this.linkStatusModal.linkFailed()
      );
  }

}

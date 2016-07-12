import { Component, Input } from '@angular/core';

import { ClaLinkForm } from './claLinkForm.component';
import { User } from '../../shared/github/user';
import { HomeService } from '../home.service';

@Component({
  selector: 'cla-link',
  directives: [ClaLinkForm],
  templateUrl: './claLink.html'
})
export class ClaLink {
  @Input() public user: User = null;
  private linkFormVisible: boolean = false;

  constructor(private homeService: HomeService) { }

  public toggleLinkForm() {
    this.linkFormVisible = !this.linkFormVisible;
  }

  public link(e) {
    this.homeService.link(e.selectedGist, e.selectedRepoOrOrg);
    this.toggleLinkForm();
  }

}

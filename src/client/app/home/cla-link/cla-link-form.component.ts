import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Gist } from '../../shared/github/gist';
import { GithubRepo } from '../../shared/github/repo';
import { Org } from '../../shared/github/org';
import { AuthService } from '../../login/auth.service';
import { GistsDropdownComponent } from './gist-dropdown.component';
import { RepoOrgDropdownComponent } from './repo-org-dropdown.component';
import { InfoModal } from './info.modal';
import { ConfirmAddModal } from './confirm-add.modal';


interface Link {
  selectedGist: Gist;
  selectedRepoOrOrg: GithubRepo | Org;
}

@Component({
  selector: 'cla-link-form',
  directives: [GistsDropdownComponent, RepoOrgDropdownComponent, InfoModal, ConfirmAddModal],
  templateUrl: './cla-link-form.component.html'
})
export class ClaLinkFormComponent {
  @Input() public isUserOrgAdmin: boolean;
  @Output() public onClose: EventEmitter<void>;
  @Output() public onLink: EventEmitter<Link>;
  @ViewChild(GistsDropdownComponent) public gistsDropdown: GistsDropdownComponent;
  @ViewChild(RepoOrgDropdownComponent) public repoOrgDropdown: RepoOrgDropdownComponent;
  @ViewChild(ConfirmAddModal)
  public confirmAddModal: ConfirmAddModal;

  private selectedGist: Gist;
  private selectedRepoOrOrg: GithubRepo | Org;

  constructor(private authService: AuthService) {
    this.onClose = new EventEmitter<void>();
    this.onLink = new EventEmitter<Link>();
    this.clearSelectedGist();
  }

  public clear() {
    this.gistsDropdown.clear();
    this.repoOrgDropdown.clear();
    this.clearSelectedGist();
  }

  public link() {
    this.confirmAddModal.open().subscribe(
      confirmed => confirmed && this.confirmAddClosed()
    );
  }
  public confirmAddClosed() {
    this.onLink.emit({
      selectedGist: this.selectedGist,
      selectedRepoOrOrg: this.selectedRepoOrOrg
    });
    this.clear();
  }


  public handleGistSelected(event) {
    if (event) {
      this.selectedGist = event;
    } else {
      this.clearSelectedGist();
    }
  }

  public handleRepoOrOrgSelected(event) {
    this.selectedRepoOrOrg = event;
  }

  public info() {
    console.log('Not implemented');
  }

  public addScope() {
    this.authService.doLogin(true, true);
  }

  public validateInput() {
    const urlRegEx = /https:\/\/gist\.github\.com\/([a-zA-Z0-9_-]*)/;
    return this.selectedRepoOrOrg && urlRegEx.test(this.selectedGist.url);
  }

  private clearSelectedGist() {
    this.selectedGist = {
      name: null,
      url: ''
    };
  }
}

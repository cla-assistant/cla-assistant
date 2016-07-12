import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Gist } from '../../shared/github/gist';
import { GithubRepo } from '../../shared/github/repo';
import { Org } from '../../shared/github/org';
import { AuthService } from '../../login/auth.service';
import { GistsDropdown } from './gistsDropdown.component';
import { RepoOrgDropdown } from './repoOrgDropdown.component';

interface Link {
  selectedGist: Gist;
  selectedRepoOrOrg: GithubRepo | Org;
}

@Component({
  selector: 'cla-link-form',
  directives: [GistsDropdown, RepoOrgDropdown],
  templateUrl: './claLinkForm.html'
})
export class ClaLinkForm {
  @Input() public isUserOrgAdmin: boolean;
  @Output() public onClose: EventEmitter<void>;
  @Output() public onLink: EventEmitter<Link>;
  @ViewChild(GistsDropdown) public gistsDropdown: GistsDropdown;
  @ViewChild(RepoOrgDropdown) public repoOrgDropdown: RepoOrgDropdown;
  

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

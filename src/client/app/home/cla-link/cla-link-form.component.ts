import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import {
  GithubCacheService,
  GithubRepo,
  GithubOrg,
  Gist
} from '../../shared/github';
import {
  LinkedRepo,
  LinkedOrg
} from '../../shared/claBackend';
import { HomeService } from '../home.service';
import { AuthService } from '../../login';
import { DropdownComponent } from './dropdown.component';
import { InfoModal } from './info.modal';
import { ConfirmAddModal } from './confirm-add.modal';


import { Observable } from 'rxjs/Observable';


interface Link {
  selectedGist: Gist;
  selectedRepoOrOrg: GithubRepo | GithubOrg;
}

@Component({
  selector: 'cla-link-form',
  // directives: [DropdownComponent, InfoModal, ConfirmAddModal],
  templateUrl: './cla-link-form.component.html'
})
export class ClaLinkFormComponent {
  @Input() public isUserOrgAdmin: boolean;
  @Output() public onClose: EventEmitter<void>;
  @Output() public onLink: EventEmitter<Link>;
  @ViewChild('gistDropdown')
  public gistsDropdown: DropdownComponent;
  @ViewChild('repoOrgDropdown')
  public repoOrgDropdown: DropdownComponent;
  @ViewChild(ConfirmAddModal)
  public confirmAddModal: ConfirmAddModal;

  private selectedGist: Gist;
  private selectedRepoOrOrg: GithubRepo | GithubOrg;

  constructor(
    private githubCacheService: GithubCacheService,
    private homeService: HomeService,
    private authService: AuthService
  ) {
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
    this.confirmAddModal.open().then(
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

  public getGistCategories() {
    return [
      {
        title: 'Default CLAs',
        items: this.getDefaultClas(),
        getItemText: (item: Gist) => item.fileName
      },
      {
        title: 'My Gist Files',
        items: this.getGistFiles(),
        getItemText: (item: Gist) => item.fileName
      }
    ];
  }
  public getDefaultClas() {
    return this.githubCacheService.getDefaultGists();
  }
  public getGistFiles() {
    return this.githubCacheService.getCurrentUserGists();
  }

  public getRepoOrgCategories() {
    const categories: any = [
      {
        title: 'Repositories',
        items: this.getGithubRepos(),
        getItemText: this.generateRepoHtml
      }
    ];
    if (this.isUserOrgAdmin) {
      categories.unshift({
        title: 'Organizations',
        items: this.getGithubOrgs(),
        getItemText: this.generateOrgHtml
      });
    }
    return categories;
  }
  private generateRepoHtml(repo: GithubRepo) {
    return `
      <span class="octicon ${repo.fork ? 'octicon-repo-forked' : 'octicon-repo'}"></span>
      <span> ${repo.fullName} </span>
    `;
  }
  private generateOrgHtml(org: GithubOrg) {
    return `
      <img src="${org.avatarUrl}" alt="" style="width:20px">
      <span> ${org.login} </span>
    `;
  }

  public getGithubRepos() {
    return this.removeUnwanted(
      this.githubCacheService.getCurrentUserRepos(),
      this.homeService.getLinkedRepos()
    );
  }
  public getGithubOrgs() {
    return this.removeUnwanted(
      this.githubCacheService.getCurrentUserOrgs(),
      this.homeService.getLinkedOrgs()
    );
  }
  private removeUnwanted(
    itemsObervable: Observable<{ id: number }[]>,
    unwantedObservable: Observable<{ id: string }[]>
  ): Observable<any> {
    return itemsObervable.combineLatest(unwantedObservable, (items, unwanted) => {
      return items.filter(item => !unwanted.some(unwantedItem => unwantedItem.id === item.id.toString()));
    });
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
      fileName: null,
      url: '',
      updatedAt: '',
      history: []
    };
  }
}

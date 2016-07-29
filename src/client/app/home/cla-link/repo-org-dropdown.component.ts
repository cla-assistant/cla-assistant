import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { SelectComponent } from 'ng2-select';

import { HomeCacheService } from '../home-cache.service';
import { HomeService } from '../home.service';
import { GithubRepo } from '../../shared/github/repo';
import { GithubOrg } from '../../shared/github/org';
import { LinkedRepo, LinkedOrg } from '../../shared/claBackend/linkedItem';

@Component({
  selector: 'repo-org-dropdown',
  directives: [SelectComponent],
  host: {
    'class': 'form-group has-feedback',
    'style': 'display:block'
  },
  template: `
    <ng-select 
      [allowClear]="true"
      [items]="dropdownItems"
      (selected)="selected($event)"
      (removed)="removed($event)"
      placeholder="select">
    </ng-select>
  `
})
export class RepoOrgDropdownComponent implements OnInit {
  private static REPO_ID = 1;
  private static ORG_ID = 2;

  @Input() public isUserOrgAdmin: boolean;
  @Output() public onSelect: EventEmitter<GithubRepo | GithubOrg>;
  @ViewChild(SelectComponent) public selectComp: SelectComponent;

  private repos: GithubRepo[];
  private orgs: GithubOrg[];
  private dropdownItems: any[] = [];
  private repoItems: any[] = [];
  private orgItems: any[] = [];

  constructor(
    private homeCacheService: HomeCacheService,
    private homeService: HomeService) {
    this.onSelect = new EventEmitter<GithubRepo | GithubOrg>();
    this.updateDropdownItems();
  }

  public clear() {
    this.selectComp.remove(null);
  }

  public ngOnInit() {
    this.requestRepos();
    if (this.isUserOrgAdmin) {
      this.requestOrgs();
    }
  }

  public selected(event) {
    if (event.parent.id === RepoOrgDropdownComponent.REPO_ID) {
      this.onSelect.emit(this.repos[event.id - 1]);
    } else if (event.parent.id === RepoOrgDropdownComponent.ORG_ID) {
      this.onSelect.emit(this.orgs[event.id - 1]);
    }
  }
  public removed() {
    this.onSelect.emit(null);
  }

  private requestRepos() {
    this.homeCacheService.currentUserRepos
      .combineLatest(this.homeService.getLinkedRepos(), (ghRepos: GithubRepo[], claRepos: LinkedRepo[]) => {
        return ghRepos.filter(ghRepo => !claRepos.some(claRepo => claRepo.id === ghRepo.id.toString()));
      })
      .subscribe(repos => {
        this.repos = repos;
        this.repoItems = repos.map((repo, index) => ({
          id: index + 1,
          text: repo.fullName
        }));
        this.updateDropdownItems();
      });
  }

  private requestOrgs() {
    this.homeCacheService.currentUserOrgs
      .combineLatest(this.homeService.getLinkedOrgs(), (ghOrgs: GithubOrg[], claOrgs: LinkedOrg[]) => {
        return ghOrgs.filter(ghOrg => !claOrgs.some(claOrg => claOrg.id === ghOrg.id.toString()));
      })
      .subscribe(orgs => {
        this.orgs = orgs;
        this.orgItems = orgs.map((org, index) => ({
          id: index + 1,
          text: org.login
        }));
        this.updateDropdownItems();
      });
  }

  private updateDropdownItems() {
    this.dropdownItems = [];
    if (this.orgItems.length > 0) {
      this.dropdownItems.push({
        id: RepoOrgDropdownComponent.ORG_ID,
        text: 'Organizations',
        children: this.orgItems
      });
    }
    if (this.repoItems.length > 0) {
      this.dropdownItems.push({
        id: RepoOrgDropdownComponent.REPO_ID,
        text: 'Repositories',
        children: this.repoItems
      });
    }
  }


}

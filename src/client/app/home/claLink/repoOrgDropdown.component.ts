import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { SelectComponent } from 'ng2-select';
import { HomeCacheService } from '../homeCache.service';
import { HomeService } from '../home.service';
import { GithubRepo } from '../../shared/github/repo';
import { Org } from '../../shared/github/org';
import { ClaRepo } from '../../shared/claBackend/repo';

@Component({
  selector: 'repo-org-dropdown',
  directives: [SelectComponent],
  host: {
    'class': 'form-group has-feedback'
  },
  template: `
    <ng-select 
      [allowClear]="true"
      [items]="dropdownItems"
      (selected)="selected($event)"
      (removed)="removed($event)"
      placeholder="Select Gist">
    </ng-select>
  `
})
export class RepoOrgDropdown implements OnInit {
  private static REPO_ID = 1;
  private static ORG_ID = 2;

  @Input() public isUserOrgAdmin: boolean;
  @Output() public onSelect: EventEmitter<GithubRepo | Org>;
  @ViewChild(SelectComponent) public selectComp: SelectComponent;

  private repos: GithubRepo[];
  private orgs: Org[];
  private dropdownItems: any[] = [];
  private repoItems: any[] = [];
  private orgItems: any[] = [];

  constructor(
    private homeCacheService: HomeCacheService,
    private homeService: HomeService) {
    this.onSelect = new EventEmitter<GithubRepo | Org>();
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
    if (event.parent.id === RepoOrgDropdown.REPO_ID) {
      this.onSelect.emit(this.repos[event.id - 1]);
    } else if (event.parent.id === RepoOrgDropdown.ORG_ID) {
      this.onSelect.emit(this.orgs[event.id - 1]);
    }
  }
  public removed() {
    this.onSelect.emit(null);
  }

  private requestRepos() {
    this.homeCacheService.currentUserRepos
      .combineLatest(this.homeService.getLinkedRepos(), (ghRepos: GithubRepo[], claRepos: ClaRepo[]) => {
        return ghRepos.filter(ghRepo => !claRepos.some(claRepo => claRepo.repoId === ghRepo.id.toString()));
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
    this.homeCacheService.currentUserOrgs.subscribe(orgs => {
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
        id: RepoOrgDropdown.ORG_ID,
        text: 'Organizations',
        children: this.orgItems
      });
    }
    if (this.repoItems.length > 0) {
      this.dropdownItems.push({
        id: RepoOrgDropdown.REPO_ID,
        text: 'Repositories',
        children: this.repoItems
      });
    }
  }


}

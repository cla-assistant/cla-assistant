import { Component, OnInit } from '@angular/core';
import { AuthService } from '../login';
import { AppFrameComponent } from '../app-frame/app-frame.component';
import { LinkedItemListComponent } from './repo-list/linked-item-list.component';
import { GithubCacheService } from '../shared/github';
import { HomeService } from './home.service';
import { ClaLinkComponent } from './cla-link/cla-link.component';
import { User } from '../shared/github/user';


/**
 * The HomeComponent is the top-level Component of the home screen. It is wrapped
 * in an [[AppFrameComponent]], which will add header and footer. It contains one 
 * [[ClaLinkComponent]] which provides the link form and two 
 * [[LinkedItemListComponents]] displaying the already linked orgs and repos.
 */
@Component({
  selector: 'home',
 // directives: [AppFrameComponent, ClaLinkComponent, LinkedItemListComponent],
  template: `
  <app-frame [user] = "user" (logout)="handleLogout()">
    <div *ngIf="user" id="activated_cla" class="row content-block">
      <cla-link [user]="user"></cla-link>
      <linked-item-list 
        *ngIf="user.roles.orgAdmin"
        [itemType]="'org'"
        [claItems]="homeService.getLinkedOrgs() | async">
      </linked-item-list>
      <linked-item-list 
        [itemType]="'repo'"
        [claItems]="homeService.getLinkedRepos() | async">
      </linked-item-list>
    </div>  
  </app-frame>
  `
})
export class HomeComponent implements OnInit {
  private user: User = null;

  constructor(
    private authService: AuthService,
    private githubCacheService: GithubCacheService,
    private homeService: HomeService) { }

  public ngOnInit() {
    this.githubCacheService.getCurrentUser().subscribe(
      (user) => {
        this.user = user;
      });

  }

  /**
   * Handles the logout button
   */
  public handleLogout() {
    this.authService.doLogout();
  }
}

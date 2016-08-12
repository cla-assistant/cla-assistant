import { Component, OnInit } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { AppFrameComponent } from '../app-frame/app-frame.component';
import { RepoListComponent } from './repo-list/linked-item-list.component';
import { GithubCacheService } from '../shared/github';
import { HomeService } from './home.service';
import { ClaLinkComponent } from './cla-link/cla-link.component';
import { User } from '../shared/github/user';


@Component({
  selector: 'home',
  directives: [AppFrameComponent, ClaLinkComponent, RepoListComponent],
  providers: [GithubCacheService, HomeService],
  template: `
  <app-frame [user] = "user" (logout)="handleLogout()">
    <div *ngIf="user" id="activated_cla" class="row content-block">
      <cla-link [user]="user"></cla-link>
      <linked-item-list [itemType]="'org'"></linked-item-list>
      <linked-item-list [itemType]="'repo'"></linked-item-list>
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
    this.homeService.requestReposFromBackend();
    this.homeService.requestOrgsFromBackend();
  }

  public handleLogout() {
    this.authService.doLogout();
  }
}

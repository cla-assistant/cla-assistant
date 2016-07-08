import { Component, OnInit } from '@angular/core';
import { AuthService } from '../login/auth.service';
import { AppFrame } from '../appFrame/appFrame.component';
import { GithubService } from '../shared/github/github.service';
import { ClaLink } from './claLink/claLink.component';
import { User } from '../shared/github/user';

@Component({
  selector: 'home',
  directives: [AppFrame, ClaLink],
  template: `
  <app-frame [user] = "user" (logout)="onLogout()">
    <div class="container-fluid home-content-outer">
      <div class="home-content-inner">
        <section class="col-md-8 col-md-offset-2">
          <cla-link></cla-link>
        </section>
      </div>
    </div>    
  </app-frame>
  `
})
export class Home implements OnInit {
  private user: User = null;

  constructor(
    private authService: AuthService,
    private githubService: GithubService) { }

  public ngOnInit() {
    this.githubService.getUser().subscribe(
      (user) => {
        this.user = user;
      },
      (error) => {
        console.log(error);
      });
  }

  public onLogout() {
    this.authService.doLogout();
  }
}

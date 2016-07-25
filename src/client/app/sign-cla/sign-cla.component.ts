import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizationService, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { LinkedItem } from '../shared/claBackend/linkedItem';
import { User } from '../shared/github/user';
import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { GithubService } from '../shared/github/github.service';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'sign-cla',
  templateUrl: 'sign-cla.component.html'
})
export class SignClaComponent implements OnInit {
  private loggedInUser: User;
  private hasCustomFields = false;
  private signed = false;
  private claText: SafeHtml = null;
  private noLinkedItemError: string = null;
  private userName: string = null;
  private repoName: string = null;
  private pullRequest: string = null;
  private fullRepoName: string = null;


  constructor(
    private route: ActivatedRoute,
    private claBackendService: ClaBackendService,
    private githubService: GithubService,
    private authService: AuthService,
    @Inject('Window') private window: Window,
    private domSanitizationService: DomSanitizationService ) { }

  public ngOnInit() {
    this.userName = this.route.snapshot.params['user'];
    this.repoName = this.route.snapshot.params['repo'];
    this.pullRequest = this.route.snapshot.params['pullRequest'];
    this.fullRepoName = `${this.userName}/${this.repoName}`;

    this.claBackendService.getLinkedItem(this.userName, this.repoName).subscribe(
      linkedItem => {
        this.getClaText(linkedItem);
      },
      err => this.noLinkedItemError = err
    );

    this.githubService.getUser().subscribe(
      user => {
        this.loggedInUser = user;
        this.checkCla();
      },
      () => { this.loggedInUser = null; }
    );
  }

  private checkCla() {
    this.claBackendService.checkCla(this.userName, this.repoName).subscribe(
      hasSigned => {
        this.signed = hasSigned;
        if (hasSigned) { this.redirect(); }
      },
      () => { this.signed = false; });
  }
  private getClaText(linkedItem: LinkedItem) {
    this.claBackendService.getGistContent(linkedItem).subscribe(
      claText => {
        this.claText = this.domSanitizationService.bypassSecurityTrustHtml(claText)
      },
      err => this.noLinkedItemError = err
    );
  }

  private redirect() {
    let redirectUrl = `https://github.com/${this.userName}/${this.repoName}`;
    if (this.pullRequest) {
      redirectUrl += `/pull/${this.pullRequest}`;
    }
    this.authService.doLogout(true);
    setTimeout(function () {
      this.window.location.href = redirectUrl;
    }, 5000);
  }

  public agree(): void {
    let acceptUrl = `/accept/${this.userName}/${this.repoName}`;
    acceptUrl = this.pullRequest ? acceptUrl + `;pullRequest=${this.pullRequest}` : acceptUrl;
    this.window.location.href = acceptUrl;
  }

}

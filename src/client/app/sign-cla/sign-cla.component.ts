import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizationService, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { AppFrameComponent } from '../app-frame/app-frame.component';
import { CustomFieldComponent } from './custom-field.component';
import { LinkedItem } from '../shared/claBackend/linkedItem';
import { User } from '../shared/github/user';
import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { GithubService } from '../shared/github/github.service';
import { AuthService } from '../login/auth.service';


@Component({
  selector: 'sign-cla',
  directives: [AppFrameComponent, CustomFieldComponent],
  templateUrl: 'sign-cla.component.html'
})
export class SignClaComponent implements OnInit {
  private loggedInUser: User;
  private signed = false;
  private claText: SafeHtml = null;
  private noLinkedItemError: string = null;
  private userName: string = null;
  private repoName: string = null;
  private redirect: boolean = false;
  private pullRequest: string = null;
  private fullRepoName: string = null;

  private hasCustomFields = false;
  private customFields = null;
  private customKeys: any[] = null;
  private customValues: any = {};
  private customFieldsValid: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private claBackendService: ClaBackendService,
    private githubService: GithubService,
    private authService: AuthService,
    @Inject('Window') private window: Window,
    private domSanitizationService: DomSanitizationService) { }

  public ngOnInit() {
    this.userName = this.route.snapshot.params['user'];
    this.repoName = this.route.snapshot.params['repo'];
    this.pullRequest = this.route.snapshot.params['pullRequest'];
    this.redirect = this.route.snapshot.params['redirect'];
    this.fullRepoName = `${this.userName}/${this.repoName}`;

    Observable.forkJoin([
      this.getClaData(this.userName, this.repoName),
      this.checkCla()
    ]).subscribe(
      ([claData, hasSigned]: any[]) => {
        this.claText = this.domSanitizationService.bypassSecurityTrustHtml(claData.claText);
        this.hasCustomFields = claData.hasCustomFields;
        this.customFields = claData.customFields;
        this.customKeys = claData.customKeys;
        this.customKeys.forEach((key) => this.customValues[key] = '');
        this.checkCustomFields();

        this.signed = hasSigned;
        if (hasSigned) {
          if (this.redirect) {
            this.doRedirect();
          } else {
            this.getSignedValues();
          }
        } else {
          this.getGithubValues();
        }
      },
      err => this.noLinkedItemError = err);


    this.githubService.getUser().subscribe(
      user => {
        this.loggedInUser = user;
      },
      () => { this.loggedInUser = null; }
    );
  }

  private getSignedValues() {
    this.claBackendService
      .getSignatureValues(this.userName, this.repoName)
      .subscribe(customFields => {
        if (customFields) {
          this.customKeys.forEach(key => {
            this.customValues[key] = customFields[key];
          });
        }
      });
  }

  private getGithubValues() {
    if (this.hasCustomFields && this.loggedInUser && !this.signed) {
      this.customKeys.forEach((key) => {
        const githubKey = this.customFields[key].githubKey;
        if (githubKey) {
          this.customValues[key] = this.loggedInUser[githubKey] || '';
          if (githubKey === 'email' && !this.loggedInUser.email) {
            this.githubService.getPrimaryEmail().subscribe(email => {
              this.customValues[key] = email;
            });
          }
        }
      });
    }
  }

  private checkCla() {
    return this.claBackendService
      .checkCla(this.userName, this.repoName)
      .catch(() => Observable.of(false));
  }
  private getClaData(userName: string, repoName: string) {
    return this.claBackendService
      .getLinkedItem(userName, repoName)
      .flatMap((item) => this.claBackendService.getGistContent(item));
  }
  private onChange(key, value) {
    this.customValues[key] = value;
    this.customFieldsValid = this.checkCustomFields();
  }

  private doRedirect() {
    let redirectUrl = `https://github.com/${this.userName}/${this.repoName}`;
    if (this.pullRequest) {
      redirectUrl += `/pull/${this.pullRequest}`;
    }
    this.authService.doLogout(true);
    setTimeout(function () {
      this.window.location.href = redirectUrl;
    }, 5000);
  }

  private checkCustomFields() {
    return this.customKeys.reduce((isValid, key) => {
      const value = this.customValues[key];
      const field = this.customFields[key];
      if (field.required) {
        return isValid && value !== '' && value !== false && value !== null;
      }
      return isValid;
    });
  }

  private signIn(): void {
    let signinUrl = `/signin/${this.userName}/${this.repoName}`;
    signinUrl = this.pullRequest ? signinUrl + `?pullRequest=${this.pullRequest}` : signinUrl;
    this.window.location.href = signinUrl;
  }

  private agree(): void {
    if (!this.hasCustomFields) {
      let acceptUrl = `/accept/${this.userName}/${this.repoName}`;
      acceptUrl = this.pullRequest ? acceptUrl + `?pullRequest=${this.pullRequest}` : acceptUrl;
      this.window.location.href = acceptUrl;
    } else if (this.loggedInUser) {
      this.claBackendService
        .signCla(this.userName, this.repoName, this.customValues)
        .subscribe(signed => {
          this.signed = signed;
          if (signed) {
            this.doRedirect();
          }
        });
    }
  }
}

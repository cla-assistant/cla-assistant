import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';

import { AppFrameComponent } from '../app-frame/app-frame.component';
import { CustomFieldComponent } from './custom-field.component';
import { GithubCacheService, User } from '../shared/github/';
import { ClaBackendService, LinkedItem } from '../shared/claBackend';
import { AuthService } from '../login';


@Component({
  selector: 'sign-cla',
  // directives: [AppFrameComponent, CustomFieldComponent],
  templateUrl: 'sign-cla.component.html'
})
export class SignClaComponent implements OnInit {
  private loggedInUser: User = null;
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
  private customKeys: any[] = [];
  private customValues: any = {};
  private customFieldsValid: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private claBackendService: ClaBackendService,
    private githubCacheService: GithubCacheService,
    @Inject('Window') private window: Window,
    private domSanitizer: DomSanitizer) { }

  public ngOnInit() {
    this.userName = this.route.snapshot.params['user'];
    this.repoName = this.route.snapshot.params['repo'];
    this.pullRequest = this.route.snapshot.params['pullRequest'];
    this.redirect = this.route.snapshot.params['redirect'];
    this.fullRepoName = `${this.userName}/${this.repoName}`;

    Observable.forkJoin([
      this.claBackendService.getGistContentByName(this.userName, this.repoName),
      this.claBackendService.checkCla(this.userName, this.repoName),
      this.githubCacheService.getCurrentUser().catch(() => Observable.of(null))
    ]).subscribe(
      ([claData, hasSigned, user]: any[]) => {
        this.loggedInUser = user;

        this.claText = this.domSanitizer.bypassSecurityTrustHtml(claData.claText);
        this.hasCustomFields = claData.hasCustomFields;
        this.customFields = claData.customFields;
        this.customKeys = claData.customKeys;
        if (this.customKeys) {
          this.customKeys.forEach((key) => this.customValues[key] = '');
          this.customFieldsValid = this.checkCustomFields();
        }

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
  }

  public isUserSignedIn() {
    return this.loggedInUser != null;
  }

  private getSignedValues() {
    if (this.hasCustomFields) {
      this.claBackendService
        .getSignatureValues(this.userName, this.repoName)
        .subscribe(customFields => {
          if (customFields) {
            this.customKeys.forEach(key => {
              this.customValues[key] = customFields[key];
            });
            this.customFieldsValid = this.checkCustomFields();
          }
        });
    }
  }

  private getGithubValues() {
    if (this.hasCustomFields && this.loggedInUser) {
      this.customKeys
        .filter(key => this.customFields[key] !== undefined)
        .forEach(key => {
          const githubKey = this.customFields[key].githubKey;
          this.setCustomValueByGithubKey(key, githubKey);
        });
    }
  }

  private setCustomValueByGithubKey(key: string, githubKey: string) {
    const value = this.loggedInUser[githubKey];
    this.customValues[key] = value !== undefined ? value : '';
    if (githubKey === 'email' && !this.loggedInUser.email) {
      this.githubCacheService.getCurrentUserPrimaryEmail().subscribe(email => {
        this.customValues[key] = email;
      });
    }
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
    setTimeout(() => {
      this.window.location.replace(redirectUrl);
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
    }, true);
  }

  private signIn(): void {
    let signinUrl = `/signin/${this.userName}/${this.repoName}`;
    signinUrl = this.pullRequest ? signinUrl + `?pullRequest=${this.pullRequest}` : signinUrl;
    this.window.location.replace(signinUrl);
  }

  private agree(e: Event): void {
    e.preventDefault();
    if (!this.hasCustomFields) {
      let acceptUrl = `/accept/${this.userName}/${this.repoName}`;
      acceptUrl = this.pullRequest ? acceptUrl + `?pullRequest=${this.pullRequest}` : acceptUrl;
      this.window.location.replace(acceptUrl);
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

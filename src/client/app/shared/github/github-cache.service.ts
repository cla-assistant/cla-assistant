import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { GithubService } from './github.service';
import { User } from './user';
import { Gist } from './gist';
import { GithubRepo } from './repo';
import { GithubOrg } from './org';

@Injectable()
export class GithubCacheService {

  constructor(
    private githubService: GithubService,
    private router: Router,
    private http: Http) {
  }


  private _currentUser = null;
  public getCurrentUser(): Observable<User> {
    if (!this._currentUser) {
      this._currentUser = this.githubService
        .getUser()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._currentUser;
  }

  private _currentUserGists = null;
  public getCurrentUserGists(): Observable<Gist[]> {
    if (!this._currentUserGists) {
      this._currentUserGists = this.githubService
        .getUserGists()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._currentUserGists;
  }

  private _defaultGists = null;
  public getDefaultGists(): Observable<Gist[]> {
    if (!this._defaultGists) {
      this._defaultGists = this.githubService
        .getDefaultGist()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._defaultGists;
  }

  private _currentUserRepos = null;
  public getCurrentUserRepos(): Observable<GithubRepo[]> {
    if (!this._currentUserRepos) {
      this._currentUserRepos = this.githubService
        .getUserRepos()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._currentUserRepos;
  }

  private _currentUserOrgs = null;
  public getCurrentUserOrgs(): Observable<GithubOrg[]> {
    if (!this._currentUserOrgs) {
      this._currentUserOrgs = this.githubService
        .getUserOrgs()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._currentUserOrgs;
  }

  private _gistInfos: Dict<Observable<Gist>> = {};
  public getGistInfo(gistUrl: string): Observable<Gist> {
    if (!this._gistInfos[gistUrl]) {
      this._gistInfos[gistUrl] = <Observable<Gist>>this.githubService
        .getGistInfo(gistUrl)
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._gistInfos[gistUrl];
  }

  private _currentUserPrimaryEmail = null;
  public getCurrentUserPrimaryEmail(): Observable<string> {
    if (!this._currentUserPrimaryEmail) {
      this._currentUserPrimaryEmail = this.githubService
        .getPrimaryEmail()
        .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this._currentUserPrimaryEmail;
  }

  private handle401(err): Observable<{}> {
    if (err.status === 401) {
      this.router.navigate(['login']);
      return Observable.empty();
    }
    return Observable.throw(err);
  }


}

import { Injectable } from '@angular/core';
import { GithubService } from '../shared/github/github.service';
import { Observable } from 'rxjs';
import { Http } from '@angular/http';


import { User } from '../shared/github/user';
import { Gist } from '../shared/github/gist';
import { GithubRepo } from '../shared/github/repo';
import { Org } from '../shared/github/org';

@Injectable()
export class HomeCacheService {

  constructor(private githubService: GithubService, private http: Http) {
  }

  private _currentUser = null;
  public get currentUser(): Observable<User> {
    if (!this._currentUser) {
      this._currentUser = this.githubService.getUser().cache(1);
    }
    return this._currentUser;
  }

  private _currentUserGists = null;
  public get currentUserGists(): Observable<Gist[]> {
    if (!this._currentUserGists) {
      this._currentUserGists = this.githubService.getUserGists().cache(1);
    }
    return this._currentUserGists;
  }

  private _defaultGists = null;
  public get defaultGists(): Observable<Gist[]> {
    if (!this._defaultGists) {
      this._defaultGists =
        this.http.get('/static/cla-assistant.json')
          .map(res => {
            return res.json();
          })
          .map(data => data['default-cla'])
          .cache(1);
    }
    return this._defaultGists;
  }

  private _currentUserRepos = null;
  public get currentUserRepos(): Observable<GithubRepo[]> {
    if (!this._currentUserRepos) {
      this._currentUserRepos = this.githubService.getUserRepos().cache(1);
    }
    return this._currentUserRepos;
  }

  private _currentUserOrgs = null;
  public get currentUserOrgs(): Observable<Org[]> {
    if (!this._currentUserOrgs) {
      this._currentUserOrgs = this.githubService.getUserOrgs().cache(1);
    }
    return this._currentUserOrgs;
  }

  // private invalidateCache() {
  //   this._currentUser = null;
  //   this._currentUserGists = null;
  //   this._defaultGists = null;
  //   this._currentUserRepos = null;
  // }



}

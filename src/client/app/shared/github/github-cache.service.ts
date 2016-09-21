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

  private cache: Dict<any> = {};

  private getValue(name: string, requestValue: () => Observable<any>) {
    if (!this.cache[name]) {
      this.cache[name] = requestValue()
        // .catch((err) => this.handle401(err))
        .cache(1);
    }
    return this.cache[name];
  }

  public getCurrentUser(): Observable<User> {
    return this.getValue('currentUser', () => this.githubService.getUser());
  }

  public getCurrentUserGists(): Observable<Gist[]> {
    return this.getValue('currentUserGists', () => this.githubService.getUserGists());
  }

  public getDefaultGists(): Observable<Gist[]> {
    return this.getValue('defaultGists', () => this.githubService.getDefaultGist());
  }

  public getCurrentUserRepos(): Observable<GithubRepo[]> {
    return this.getValue('currentUserRepos', () => this.githubService.getUserRepos());
  }

  public getCurrentUserOrgs(): Observable<GithubOrg[]> {
    return this.getValue('currentUserOrgs', () => this.githubService.getUserOrgs());
  }

  public getCurrentUserPrimaryEmail(): Observable<string> {
    return this.getValue('currentUserPrimaryEmail', () => this.githubService.getPrimaryEmail());
  }

  private _gistInfos: Dict<Observable<Gist>> = {};
  public getGistInfo(gistUrl: string): Observable<Gist> {
    return this.getValue('gistInfo-' + gistUrl, () => this.githubService.getGistInfo(gistUrl));
  }

  // private handle401(err): Observable<{}> {
  //   if (err.status === 401) {
  //     this.router.navigate(['login']);
  //     return Observable.empty();
  //   }
  //   return Observable.throw(err);
  // }
}

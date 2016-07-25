import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { User, createUserFromApiResponse } from './user';
import { Gist, createGistsFromApiResponse } from './gist';
import { GithubRepo, createReposFromApiResponse } from './repo';
import { Org, createOrgsFromApiResponse } from './org';


@Injectable()
export class GithubService {

  constructor(
    private http: Http,
    private router: Router) {}
  // TODO: handle errors
  public getUser(): Observable<User> {
    const requestBody = {
      obj: 'users',
      fun: 'get',
      arg: {}
    };
    return this
      .call(requestBody)
      .map(createUserFromApiResponse);
  }
  public getUserGists(): Observable<Gist[]> {
    const args = { per_page: 100 };
    const requestBody = {
      obj: 'gists',
      fun: 'getAll',
      arg: args
    };
    return this.callAndGetMore(requestBody)
      .map(createGistsFromApiResponse)
      .scan((result: Gist[], part: Gist[]) => result.concat(part), []);
  }
  // public getUserRepos(): Observable<GithubRepo[]> {
  //   // TODO add ,organization_member
  //   const args = { user:'facebook', per_page: 100, affiliation: 'owner' };
  //   const requestBody = {
  //     obj: 'repos',
  //     fun: 'getForUser',
  //     arg: args
  //   };

  //   return this.callAndGetMore(requestBody)
  //     .map(createReposFromApiResponse)
  //     .scan((result: GithubRepo[], part: GithubRepo[]) => result.concat(part), []);
  // }
  public getUserRepos(): Observable<GithubRepo[]> {
    // TODO add ,organization_member
    const args = { per_page: 100, affiliation: 'owner' };
    const requestBody = {
      obj: 'repos',
      fun: 'getAll',
      arg: args
    };

    return this.callAndGetMore(requestBody)
      .map(createReposFromApiResponse)
      .scan((result: GithubRepo[], part: GithubRepo[]) => result.concat(part), []);
  }
  public getUserOrgs(): Observable<Org[]> {
    const args = { per_page: 100 };
    const requestBody = {
      obj: 'orgs',
      fun: 'getOrganizationMemberships',
      arg: args
    };
    return this.callAndGetMore(requestBody)
      .map(createOrgsFromApiResponse)
      .scan((result: Org[], part: Org[]) => result.concat(part), []);
  }


  private callAndGetMore(requestBody: { obj: string, fun: string, arg: any }, page = 1) {
    requestBody.arg.page = page;
    // return this.call(requestBody)
    //   .flatMap(res => {
    //     if (res.meta && res.meta.hasMore) {
    //       return this.callAndGetMore(requestBody, page + 1).startWith(res);
    //     } else {
    //       return Observable.of(res);
    //     }
    //   });
    return this.call(requestBody)
      .expand(res => {
        if (res.meta && res.meta.hasMore) {
          requestBody.arg.page = page + 1;
          return this.call(requestBody);
        }
        return Observable.empty();
      });
  }
  private call(requestBody: { obj: string, fun: string, arg: Object }): Observable<any> {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');

    let body = JSON.stringify(requestBody);
    return this.http.post('/api/github/call', body, { headers: headers })
      // .catch((err) => {
      //   if (err.status === 401) {
      //     this.router.navigate(['login']);
      //     return Observable.empty();
      //   }
      //   return Observable.throw(err);
      // })
      .map(res => {
        return res.json();
      });
  }
}


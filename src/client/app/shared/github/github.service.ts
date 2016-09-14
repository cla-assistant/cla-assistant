import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { User, createUserFromApiResponse } from './user';
import {
  Gist,
  createGistArrayFromApiResponse,
  createGistFromApiResponse
} from './gist';
import { GithubRepo, createReposFromApiResponse } from './repo';
import { GithubOrg, createOrgsFromApiResponse } from './org';

/**
 * Provides methods for making backend requests to the GitHub API
 */
@Injectable()
export class GithubService {

  constructor(private http: Http) { }

  /**
   * Requests the currently logged in user.
   * 
   * @returns Observable that emits a user object. 
   * If no user is logged in, the Observable will terminate with an 401 error
   */
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

  /**
   * Requests all gists of the logged in user.
   * 
   * @returns Observable that emits a gist array. Multiple gist arrays will be
   * emitted if more than one page needs to be loaded (100 gists per page). Each
   * of these arrays will contain all gists that have already been loaded. 
   * (first array contains page 1, second array contains page 1 and 2, etc.).
   * When all pages are loaded the Observable will terminate.
   * If no user is logged in, the Observable will terminate with an 401 error.
   */
  public getUserGists(): Observable<Gist[]> {
    const args = { per_page: 100 };
    const requestBody = {
      obj: 'gists',
      fun: 'getAll',
      arg: args
    };
    return this.callAndGetMore(requestBody)
      .map(createGistArrayFromApiResponse)
      // Use scan to concat all pages that have already been loaded
      .scan((result: Gist[], part: Gist[]) => result.concat(part), []);
  }

  public getDefaultGist(): Observable<Gist[]> {
    return this.http.get('/static/cla-assistant.json')
      .map(res => res.json())
      .map(data => data['default-cla']);
  }

  /**
   * Requests all repos where the logged in user has owner or 
   * organization_member rights
   * 
   * @returns Observable that emits a repo array. If multiple pages need to be
   * loaded it will behave like [[getUserGists]]
   * If no user is logged in, the Observable will terminate with an 401 error
   */
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
      // Use scan to concat all pages that have already been loaded
      .scan((result: GithubRepo[], part: GithubRepo[]) => result.concat(part), []);
  }

  /**
   * Requests all orgs where the logged in user is a member
   * 
   * @returns Observable that emits a Org array. If multiple pages need to be
   * loaded it will behave like [[getUserGists]]
   * If no user is logged in, the Observable will terminate with an 401 error
   */
  public getUserOrgs(): Observable<GithubOrg[]> {
    const args = { per_page: 100 };
    const requestBody = {
      obj: 'orgs',
      fun: 'getOrganizationMemberships',
      arg: args
    };
    return this.callAndGetMore(requestBody)
      .map(createOrgsFromApiResponse)
      // Use scan to concat all pages that have already been loaded
      .scan((result: GithubOrg[], part: GithubOrg[]) => result.concat(part), []);
  }

  /**
   * Requests information for a specific gist
   * 
   * @param gistUrl The url of the gist
   * @returns Observable that emits a Gist object containing the gist info
   */
  public getGistInfo(gistUrl: string): Observable<Gist> {
    const id = this.extractGistId(gistUrl);
    if (!id) {
      return Observable.throw(`The gist url ${gistUrl} seems to be invalid`);
    }
    const requestBody = {
      obj: 'gists',
      fun: 'get',
      arg: {
        id: id
      }
    };
    return this.call(requestBody).map(createGistFromApiResponse);
  }
  /**
   * Helper function that extracts the gist id from a gist url
   * 
   * @param gistUrl url to extract id from
   * @returns gist id on success, undefined on failure
   */
  private extractGistId(gistUrl: string) {
    // Example url: https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29
    const urlParts = gistUrl.slice(gistUrl.indexOf('gist.github.com')).split('/')
    return urlParts.length >= 2 ? urlParts[urlParts.length - 1] : undefined;
  }

  public getPrimaryEmail(): Observable<string> {
    const requestBody = {
      obj: 'users',
      fun: 'getEmails',
      arg: {}
    };
    return this.call(requestBody).map(response => {
      if (response.data.length === 0) { return ''; }
      const emailObj = response.data.find(email => email.primary) || response.data[0];
      return emailObj.email;
    });
  }

  /**
   * Makes an API call with the provided request body. If the `hasMore` flag in 
   * the meta data of the response is set, the next page will be requested until
   * there is no more data.
   * 
   * @param requestBody The request body that will be used for the API call
   * @returns Observable that will emit the response of each page request
   */
  private callAndGetMore(requestBody: RequestBody) {
    requestBody.arg.page = 1;
    return this.call(requestBody)
      // The function passed to expand will be called recursively for all responses
      .expand(res => {
        if (res.meta && res.meta.hasMore) {
          requestBody.arg.page++;
          // Request next page
          return this.call(requestBody);
        }
        // No more pages -> end recursion by returning empty Observable 
        return Observable.empty();
      });
  }

  /**
   * Makes an API call with the provided request body. 
   *
   * @param requestBody The request body that will be used for the API call
   * @returns Observable that will emit the received response
   */
  private call(requestBody: RequestBody): Observable<any> {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    let body = JSON.stringify(requestBody);
    return this.http.post('/api/github/call', body, { headers: headers })
      .map(res => {
        return res.json();
      });
  }
}

/**
 * Represents the body of an API request
 */
type RequestBody = {
  /** Object to work with */
  obj: string;
  /** Function to apply on the object */
  fun: string;
  /** Options object used in the function */
  arg: any;
};


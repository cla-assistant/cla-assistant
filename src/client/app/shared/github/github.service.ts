import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { User } from './user';
import { Gist } from './gist';


@Injectable()
export class GithubService {
  constructor(private http: Http) { }

  public getUser(): Observable<User> {
    return this.call('users', 'get', {});
  }

  public getUserGists(): Observable<Gist[]> {
    function transformGist(gist): Gist {
      return {
        name: gist.files[Object.keys(gist.files)[0]].filename || Object.keys(gist.files)[0],
        url: gist.html_url
      };
    }
    return this
      .call('gists', 'getAll', {})
      .map(gists => gists.map(transformGist));
  }
  public getDefaultGists(): Observable<Gist[]> {
    return this.http.get('/static/cla-assistant.json')
      .map(res => {
        return res.json();
      })
      .map(data => data['default-cla'])
      .do((params) => {
        console.log(params);
      });
  }

  private call(obj: string, fun: string, args: Object): Observable<any> {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');

    let body = JSON.stringify({ obj: obj, fun: fun, arg: args });
    return this.http.post('/api/github/call', body, { headers: headers })
      .map(res => {
        return res.json().data;
      });
  }
}

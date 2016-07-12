import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { GithubRepo } from '../github/repo';
import { ClaRepo } from './repo';

@Injectable()
export class ClaBackendService {

  constructor(private http: Http) { }

  public getLinkedRepos(githubRepos: GithubRepo[]) {
    const repoSet = githubRepos.map(repo => ({ repoId: repo.id }));
    return this.call('repo', 'getAll', {set: repoSet});
  }

  public linkClaToRepo(repo: ClaRepo) {
    return this.call('repo', 'create', repo);
  }

  private call(obj, fun, arg): Observable<any> {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');

    let body = JSON.stringify(arg);
    return this.http.post(`/api/${obj}/${fun}`, body, { headers: headers })
      .map(res => {
        return res.json();
      });
  }
}

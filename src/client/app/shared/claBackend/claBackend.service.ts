import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { GithubRepo } from '../github/repo';
import { ClaRepo } from './repo';

@Injectable()
export class ClaBackendService {

  constructor(private http: Http) { }

  public getLinkedRepos(githubRepos: GithubRepo[]) {
    const repoSet = githubRepos.map(repo => ({
      repoId: repo.id,
      owner: repo.owner.login,
      repo: repo.name
    }));
    function isFork(claRepo: ClaRepo) {
      const result = githubRepos.find(ghRepo => ghRepo.id.toString() === claRepo.repoId);
      return result && result.fork;
    }
    return this
      .call('repo', 'getAll', { set: repoSet })
      .map(repos => repos.map(repo => Object.assign({}, repo, {fork: isFork(repo)})));
  }

  public linkClaToRepo(repo: ClaRepo) {
    return this.call('repo', 'create', repo);
  }

  public unlinkClaFromRepo(repo: ClaRepo) {
    return this.call('repo', 'remove', { repoId: repo.repoId });
  }

  public getGistInfo(repo: ClaRepo) {
    return this.call('cla', 'getGist', {
      repo: repo.repo,
      owner: repo.owner,
      gist: { gist_url: repo.gist }
    });
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

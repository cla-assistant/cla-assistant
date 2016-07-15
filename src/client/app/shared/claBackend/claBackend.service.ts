import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { GithubRepo } from '../github/repo';
import { ClaRepo } from './repo';
import { LinkedItem, LinkedRepo } from './linkedItem';

@Injectable()
export class ClaBackendService {

  constructor(private http: Http) { }

  public getLinkedRepos(githubRepos: GithubRepo[]): Observable<LinkedRepo[]> {
    const repoSet = githubRepos.map(repo => ({
      repoId: repo.id,
      owner: repo.owner.login,
      repo: repo.name
    }));
    function isFork(claRepo: ClaRepo): boolean {
      const result = githubRepos.find(ghRepo => ghRepo.id.toString() === claRepo.repoId);
      return result && result.fork;
    }
    return this
      .call('repo', 'getAll', { set: repoSet })
      // Add fork property
      .map(repos => repos.map(repo => Object.assign({}, repo, { fork: isFork(repo) })))
      // Create LinkedRepo instance
      .map(repos => repos.map(repo => new LinkedRepo(repo)));
  }

  public linkCla(item: LinkedItem): Observable<LinkedRepo> {
    return this.call(item.getType(), 'create', item.getCompleteObject());
  }

  public unlinkCla(item: LinkedItem) {
    return this.call(item.getType(), 'remove', item.getIdObject());
  }

  public getGistInfo(item: LinkedItem) {
    return this.call('cla', 'getGist', {
      gist: { gist_url: item.gist }
    });
  }

  public getClaSignatures(item: LinkedItem, version: string) {
    const arg = Object.assign(item.getIdObject(), {
      gist: {
        gist_url: item.gist,
        gist_version: version
      }
    });
    return this.call('cla', 'getAll', arg);
  }

  public addWebhook(item: LinkedItem) {
    return this.call('webhook', 'create', item.getCompleteObject());
  }
  public removeWebhook(item: LinkedItem) {
    return this.call('webhook', 'remove', item.getNameObject());
  }
  public getWebhook(item: LinkedItem) {
    return this.call('webhook', 'get', item.getNameObject());
  }

  private call(obj, fun, arg): Observable<any> {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');

    let body = JSON.stringify(arg);
    return this.http.post(`/api/${obj}/${fun}`, body, { headers: headers })
      .map(res => {
        return res.text() === '' ? null : res.json();
      });
  }
}

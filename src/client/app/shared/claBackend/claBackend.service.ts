import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { GithubRepo } from '../github/repo';
import { GithubOrg } from '../github/org';
import { ClaRepo } from './repo';
import { ClaOrg } from './org';
import { LinkedItem, LinkedRepo, LinkedOrg } from './linkedItem';

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

  public getLinkedOrgs(githubOrgs: GithubOrg[]): Observable<LinkedOrg[]> {
    function getAvatar(claOrg: ClaOrg) {
      const result = githubOrgs.find(ghOrg => ghOrg.id.toString() === claOrg.orgId);
      return result ? result.avatarUrl : '';
    }
    return this
      .call('org', 'getForUser', {})
      // Add avatarUrl property
      .map(orgs => orgs.map(org => Object.assign({}, org, { avatarUrl: getAvatar(org) })))
      // Create LinkedOrg instance
      .map(orgs => orgs.map(org => new LinkedOrg(org)));
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

  public getLinkedItem(userName: string, repoName: string): Observable<LinkedItem> {
    return this.call('cla', 'getLinkedItem', {
      owner: userName,
      repo: repoName
    }).map((linkedItem) => {
      if (linkedItem.repoId) {
        return new LinkedRepo(linkedItem);
      } else {
        return new LinkedOrg(linkedItem);
      }
    });
  }

  public getGistContent(linkedItem: LinkedItem, gistUrl?, gistVersion?): Observable<string> {
    const arg = linkedItem.getIdObject();
    if (gistUrl) {
      arg.gist = {
        gist_url: gistUrl,
        gist_version: gistVersion
      };
    }
    return this.call('cla', 'get', arg).map(
      claText => claText.raw
    );
  }

  public checkCla(userName: string, repoName: string): Observable<boolean> {
    return this.call('cla', 'check', {
      owner: userName,
      repo: repoName
    });
  }

  private call(obj, fun, arg): Observable<any> {
    let headers = new Headers();

    headers.append('Content-Type', 'application/json');

    let body = JSON.stringify(arg);
    return this.http.post(`/api/${obj}/${fun}`, body, { headers: headers })
      .catch(this.handleError)
      .map(res => {
        return res.text() === '' ? null : res.json();
      });
  }

  private handleError(error: any) {
    let errMsg;
    if (error.message) {
      errMsg = error.message;
    }
    else {
      try {
        errMsg = error.json();
      } catch (e) {
        errMsg = error.status ? `${error.status} - ${error.statusText}` : 'Server error';
      }
    }
    return Observable.throw(errMsg);
  }
}

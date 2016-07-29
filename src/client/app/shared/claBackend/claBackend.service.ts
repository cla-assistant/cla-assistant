import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import { ClaRepo, fromGithubRepo } from './repo';
import { ClaOrg, fromGithubOrg } from './org';
import { Signature, createSignaturesFromApiResponse } from './signature';
import { LinkedItem, LinkedRepo, LinkedOrg } from './linkedItem';

import { GithubRepo, GithubOrg, Gist } from '../github';


/**
 * Provides methods for making Backend requests that read/write from the 
 * internal cla database.
 */
@Injectable()
export class ClaBackendService {

  constructor(private http: Http) { }

  /**
   * Requests all repositories that have a cla linked to them. Only repositories
   * that are included in the provided GitHub repos will be included.
   * 
   * @param githubRepos An array of GitHub repos to filter the response
   * @returns Observable that will emit an array of all linked repos. The array 
   * will contain only linked repos that are included in the [[githubRepos]] parameter
   */
  public getLinkedRepos(githubRepos: GithubRepo[]): Observable<LinkedRepo[]> {
    const repoSet = githubRepos.map(repo => ({
      repoId: repo.id,
      owner: repo.owner.login,
      repo: repo.name
    }));
    function isFork(claRepo: ClaRepo): boolean {
      const result = githubRepos.find(
        ghRepo => ghRepo.id.toString() === claRepo.repoId
      );
      return result && result.fork;
    }
    return this
      .call('repo', 'getAll', { set: repoSet })
      // Add fork property
      .map(repos => repos.map(
        repo => Object.assign({}, repo, { fork: isFork(repo) })
      ))
      // Create LinkedRepo instance
      .map(repos => repos.map(repo => new LinkedRepo(repo)));
  }

  /**
   * Requests all organizations that have a cla linked to them. Only organizations
   * that are included in the provided GitHub orgs will be included.
   * 
   * @param githubOrgs An array of GitHub orgs to filter the response
   * @returns Observable that will emit an array of all linked repos. The array 
   * will contain only linked orgs that are included in the [[githubOrgs]] parameter
   */
  public getLinkedOrgs(githubOrgs: GithubOrg[]): Observable<LinkedOrg[]> {
    function getAvatar(claOrg: ClaOrg) {
      const result = githubOrgs.find(
        ghOrg => ghOrg.id.toString() === claOrg.orgId
      );
      return result ? result.avatarUrl : '';
    }
    return this
      .call('org', 'getForUser', {})
      // Add avatarUrl property
      .map(orgs => orgs.map(
        org => Object.assign({}, org, { avatarUrl: getAvatar(org) })
      ))
      // Create LinkedOrg instance
      .map(orgs => orgs.map(org => new LinkedOrg(org)));
  }

  /**
   * Links a GitHub repo to a cla(gist).
   * 
   * @param repo Repository that should be linked
   * @param cla The gist that contains the cla information
   * @returns Observable that emits the [[LinkedItem]] if linking was successful.
   * Otherwise it will terminate with the received error response
   */
  public linkRepo(repo: GithubRepo, cla: Gist): Observable<LinkedItem> {
    const item = new LinkedRepo(fromGithubRepo(repo, cla.url));
    return this.linkItem(item)
      .map(() => item); // Ignore response and return linked repo;
  }
  /**
   * Links a GitHub org to a cla(gist).
   * 
   * @param org Organization that should be linked
   * @param cla The gist that contains the cla information
   * @returns Observable that emits the [[LinkedItem]] if linking was successful.
   * Otherwise it will terminate with the received error response
   */
  public linkOrg(org: GithubOrg, cla: Gist): Observable<LinkedOrg> {
    const item = new LinkedOrg(fromGithubOrg(org, cla.url));
    return this.linkItem(item)
      .map(() => item); // Ignore response and return linked repo;
  }
  /**
   * Helper function that will make the Api call to link an item.
   */
  private linkItem(item: LinkedItem) {
    return this.call(
      item.getType(),
      'create',
      item.getCompleteObject()
    );
  }

  /**
   * Takes a linked item and unlinks it, so it will no longer be managed 
   * by cla-assistant.
   * 
   * @param item The item (repo or org) to unlink.
   * @returns Observable that will emit the http response or an error
   */
  public unlinkCla(item: LinkedItem): Observable<{}> {
    return this.call(item.getType(), 'remove', item.getIdObject());
  }

  public getClaSignatures(
    item: LinkedItem,
    version: string
  ): Observable<Signature[]> {
    const arg = Object.assign(item.getIdObject(), {
      gist: {
        gist_url: item.gist,
        gist_version: version
      }
    });
    return this.call('cla', 'getAll', arg)
      .map(createSignaturesFromApiResponse);
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

import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';

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
   * @returns Observable that emits the http response or an error
   */
  public unlinkCla(item: LinkedItem): Observable<{}> {
    return this.call(item.getType(), 'remove', item.getIdObject());
  }

  /**
   * Requests all signatures of the cla belonging to the linked item. 
   * Only counts the signatures of the specified cla version.
   * 
   * @param item The item the cla belongs to
   * @param version The version of the cla
   * @returns Observable that emits an array of [[Signature]] objects  
   */
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

  /**
   * Will register a webhook on GitHub for the linked item.
   * 
   * @param item A webhook for this item will be registered
   * @returns Observable that emits the http response or an error
   */
  public addWebhook(item: LinkedItem) {
    return this.call('webhook', 'create', item.getCompleteObject());
  }
  /**
   * Will remove a webhook on GitHub for the linked item.
   * 
   * @param item The corresponding webhook of this item will be removed
   * @returns Observable that emits the http response or an error
   */
  public removeWebhook(item: LinkedItem) {
    return this.call('webhook', 'remove', item.getNameObject());
  }
  /**
   * Requests the status of the webhook corresponding to the linked item.
   * 
   * @param item The corresponding webhook of this item will be removed
   * @returns Observable that emits the status of the webhook
   */
  public getWebhook(item: LinkedItem): Observable<{ active: boolean }> {
    return this.call('webhook', 'get', item.getNameObject());
  }

  /**
   * Requests a linked item given a user and repo name
   * 
   * @param userName repo owner's name (organization or individual user) 
   * @param repoName name of the repo
   * @returns Observable that emits a [[LinkedItem]]
   */
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

  /**
   * Requests the content of a gist. The content will be rendered as html by the
   * GitHub markdown engine and is sanitized.
   * 
   * @param linkedItem The linked item whose gist will be returned 
   * 
   */
  public getGistContent(linkedItem: LinkedItem, gistUrl?, gistVersion?): Observable<any> {
    const arg = linkedItem.getIdObject();
    if (gistUrl) {
      arg.gist = {
        gist_url: gistUrl,
        gist_version: gistVersion
      };
    }
    return this.call('cla', 'get', arg).map(
      claData => {
        let gistContent: any = {};
        gistContent.claText = claData.raw;
        if (claData.meta) {
            const metaString = claData.meta.replace(/<p>|<\/p>|\n|\t/g, '');
            gistContent.customFields = JSON.parse(metaString);
            gistContent.customKeys = Object.keys(gistContent.customFields);
            gistContent.hasCustomFields = true;
        }
        return gistContent;
      }
    );
  }

  public getGistContentByName(userName: string, repoName: string): Observable<any> {
    return this.getLinkedItem(userName, repoName)
      .flatMap((item) => this.getGistContent(item));
  }


  /**
   * Checks whether the current user has signed the cla belonging to the
   * specified user and repo name.
   * 
   * @param userName repo owner's name (organization or individual user) 
   * @param repoName name of the repo
   * @returns Observable that emits a boolean indicating whether the cla has
   * been signed   
   */
  public checkCla(userName: string, repoName: string): Observable<boolean> {
    return this.call('cla', 'check', {
      owner: userName,
      repo: repoName
    }).catch(() => Observable.of(false));
  }

  public getSignatureValues(userName: string, repoName: string): Observable<Dict<any>> {
    return this.call('cla', 'getLastSignature', {
      owner: userName,
      repo: repoName
    }).map(response =>
      response.custom_fields ? JSON.parse(response.custom_fields) : null
    );
  }

  public signCla(userName: string, repoName: string, customFields: any): Observable<boolean> {
    return this.call('cla', 'sign', {
      owner: userName,
      repo: repoName,
      custom_fields: JSON.stringify(customFields)
    });
  }

  public validatePullRequest(linkedItem: LinkedItem) {
    if (linkedItem instanceof LinkedOrg) {
      return this.call('cla', 'validateOrgPullRequests', linkedItem.getNameObject());
    }else {
      return this.call('cla', 'validatePullRequests', linkedItem.getNameObject());
    }
  }

  /**
   * Helper method that makes an http call to the github endpoint. It is 
   * constructed from the provided parameters
   * 
   * @param obj The object which the request works with
   * @param fun The function that will be applied to the object
   * @param arg An object containing additional arguments 
   * @returns An Observable that emits the body of the http response. It will be 
   * parsed as json. If an empty response is received, null gets emitted
   */
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

  /**
   * Will be called when an http request threw an error.
   * The error message will be extracted and a new Observable error will be 
   * returned, so the subscriber can handle the error
   */
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

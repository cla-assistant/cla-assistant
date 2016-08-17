import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


import {  } from '../shared/claBackend';
import {
  GithubCacheService,
  GithubRepo,
  GithubOrg,
  Gist
} from '../shared/github';
import {
  ClaBackendService,
  LinkedItem,
  LinkedRepo,
  LinkedOrg
} from '../shared/claBackend';

/**
 *  This Service manages a List of linked repos and linked orgs. A BehaviorSubject
 * is used, which will return the last value to any observer that subscribes. 
 * It provides methods to link repos and orgs to an cla. It can also load all 
 * existing clas from the backend. When either of these happen all subscribers will
 * receive the updated list of linked items.
 */
@Injectable()
export class HomeService {
  private linkedRepos: BehaviorSubject<LinkedRepo[]>;
  private linkedOrgs: BehaviorSubject<LinkedOrg[]>;

  /**
   * When the service gets instantiated the already linked items will be 
   * requested from the backend.   
   */
  constructor(
    private githubCacheService: GithubCacheService,
    private claBackendService: ClaBackendService) {
    this.linkedRepos = new BehaviorSubject<LinkedRepo[]>([]);
    this.linkedOrgs = new BehaviorSubject<LinkedOrg[]>([]);
    this.requestReposFromBackend();
    this.requestOrgsFromBackend();
  }
  /**
   * @returns Observable that emits the list of linked repos each time it changes
   */
  public getLinkedRepos(): Observable<LinkedRepo[]> {
    return this.linkedRepos.asObservable();
  }
  /**
   * @returns Observable that emits the list of linked orgs each time it changes
   */
  public getLinkedOrgs(): Observable<LinkedOrg[]> {
    return this.linkedOrgs.asObservable();
  }
  /**
   * Links a repo or an org with an cla.
   * @param gist The gist which contains the cla
   * @param repoOrOrg A [[GithubRepo]] or [[GithubOrg]] which will be linked
   * @returns Observable that emits the newly [[LinkedItem]]
   */
  public link(gist: Gist, repoOrOrg: GithubRepo | GithubOrg): Observable<LinkedItem> {
    function isRepo(obj) {
      return obj.fullName !== undefined;
    }
    if (isRepo(repoOrOrg)) {
      return this.linkRepo(gist, repoOrOrg as GithubRepo);
    } else {
      return this.linkOrg(gist, repoOrOrg as GithubOrg);
    }
  }
  /**
   * Internal Method that links a repo
   */
  private linkRepo(gist: Gist, repo: GithubRepo): Observable<LinkedRepo> {
    return new Observable<LinkedRepo>(
      (observer: Observer<LinkedRepo>) => {
        this.claBackendService.linkRepo(repo, gist).subscribe(
          (linkedRepo: LinkedRepo) => {
            this.claBackendService.addWebhook(linkedRepo).subscribe(
              () => {
                this.addLinkedRepos([linkedRepo]);
                observer.next(linkedRepo);
              },
              (error) => observer.error(error),
              () => observer.complete()
            );
          },
          (errBody) => {
            if (errBody.errmsg.match(/.*duplicate key error.*/)) {
              console.log('This repository is already set up.');
            } else {
              console.log(errBody.errmsg);
            }
            observer.error(errBody);
          }
        );
      }
    );
  }
  /**
   * Internal Method that links an org
   */
  private linkOrg(gist: Gist, org: GithubOrg): Observable<LinkedOrg> {
    return new Observable<LinkedOrg>(
      (observer: Observer<LinkedOrg>) => {
        this.claBackendService.linkOrg(org, gist).subscribe(
          (linkedOrg: LinkedOrg) => {
            this.claBackendService.addWebhook(linkedOrg).subscribe(
              () => {
                this.addLinkedOrgs([linkedOrg]);
                observer.next(linkedOrg);
              },
              (error) => observer.error(error),
              () => observer.complete()
            );
          },
          (errBody) => {
            if (errBody.errmsg.match(/.*duplicate key error.*/)) {
              console.log('This organization is already set up.');
            } else {
              console.log(errBody.errmsg);
            }
            observer.error(errBody);
          }
        );
      }
    );
  }
  /**
   * Unlinks a linked item, so it will no longer be managed by cla-assistant
   * @param item The [[LinkedItem]] to unlink
   */
  public unlinkItem(item: LinkedItem) {
    this.claBackendService.unlinkCla(item).subscribe(
      () => {
        this.claBackendService.removeWebhook(item).subscribe();
        if (item instanceof LinkedRepo) {
          this.removeLinkedRepo(item);
        } else if (item instanceof LinkedOrg) {
          this.removeLinkedOrg(item);
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }
  /**
   * Internal method that adds newly linked repos to the list of linked repos. It  
   * notify all observers.
   * @param newRepos new repos that will be added to the list
   */
  private addLinkedRepos(newRepos: LinkedRepo[]): void {
    this.linkedRepos.next(this.linkedRepos.value.concat(newRepos));
  }
  /**
   * Analogous to to [[addLinkedRepos]]
   */
  private addLinkedOrgs(newOrgs: LinkedOrg[]): void {
    this.linkedOrgs.next(this.linkedOrgs.value.concat(newOrgs));
  }
  /**
   * Removes a single repo from the list of linked repos
   * @param removedRepo repo that will be removed
   */
  private removeLinkedRepo(removedRepo: LinkedRepo): void {
    const nextValue = this.linkedRepos.value.filter((linkedRepo) => {
      return linkedRepo.id !== removedRepo.id;
    });
    this.linkedRepos.next(nextValue);
  }
  /**
   * Analogous to to [[removeLinkedRepo]]
   */
  private removeLinkedOrg(removedOrg: LinkedOrg): void {
    const nextValue = this.linkedOrgs.value.filter((linkedOrg) => {
      return linkedOrg.id !== removedOrg.id;
    });
    this.linkedOrgs.next(nextValue);
  }

  /**
   * Will request the already linked repos form the cla backend. These repos will
   * be added to the list of linked repos which causes all observers to be notified
   */
  public requestReposFromBackend() {
    let githubRepos = null;
    this.githubCacheService.getCurrentUserRepos().subscribe(
      repos => githubRepos = repos,
      error => console.log(error),
      () => {
        this.claBackendService.getLinkedRepos(githubRepos).subscribe((data) => {
          this.addLinkedRepos(data);
        });
      }
    );
  }
  /**
   * Analogous to to [[requestReposFromBackend]]
   */
  public requestOrgsFromBackend() {
    let githubOrgs = null;
    this.githubCacheService.getCurrentUserOrgs().subscribe(
      orgs => githubOrgs = orgs,
      error => console.log(error),
      () => {
        this.claBackendService.getLinkedOrgs(githubOrgs).subscribe((data) => {
          this.addLinkedOrgs(data);
        });
      }
    );
  }
}

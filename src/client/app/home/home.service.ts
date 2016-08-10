import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';


import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { HomeCacheService } from './home-cache.service';
import { GithubRepo } from '../shared/github/repo';
import { GithubOrg } from '../shared/github/org';
import { Gist } from '../shared/github/gist';
import { LinkedItem, LinkedRepo, LinkedOrg } from '../shared/claBackend/linkedItem';

@Injectable()
export class HomeService {
  private linkedRepos: BehaviorSubject<LinkedRepo[]>;
  private linkedOrgs: BehaviorSubject<LinkedOrg[]>;

  constructor(
    private homeCacheService: HomeCacheService,
    private claBackendService: ClaBackendService) {
    this.linkedRepos = new BehaviorSubject<LinkedRepo[]>([]);
    this.linkedOrgs = new BehaviorSubject<LinkedOrg[]>([]);
  }

  public getLinkedRepos(): Observable<LinkedRepo[]> {
    return this.linkedRepos.asObservable();
  }
  public getLinkedOrgs(): Observable<LinkedOrg[]> {
    return this.linkedOrgs.asObservable();
  }
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
  public unlinkItem(item: LinkedItem) {
    this.claBackendService.unlinkCla(item).subscribe(
      () => {
        this.claBackendService.removeWebhook(item).subscribe();
        if (item instanceof LinkedRepo) {
          this.removeLinkedRepo(item);
        }else if (item instanceof LinkedOrg) {
          this.removeLinkedOrg(item);
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }
  private addLinkedRepos(newRepos: LinkedRepo[]): void {
    this.linkedRepos.next(this.linkedRepos.value.concat(newRepos));
  }
  private addLinkedOrgs(newOrgs: LinkedOrg[]): void {
    this.linkedOrgs.next(this.linkedOrgs.value.concat(newOrgs));
  }
  private removeLinkedRepo(removedRepo: LinkedRepo): void {
    const nextValue = this.linkedRepos.value.filter((linkedRepo) => {
      return linkedRepo.id !== removedRepo.id;
    });
    this.linkedRepos.next(nextValue);
  }
  private removeLinkedOrg(removedOrg: LinkedOrg): void {
    const nextValue = this.linkedOrgs.value.filter((linkedOrg) => {
      return linkedOrg.id !== removedOrg.id;
    });
    this.linkedOrgs.next(nextValue);
  }


  public requestReposFromBackend() {
    let githubRepos = null;
    this.homeCacheService.currentUserRepos.subscribe(
      repos => githubRepos = repos,
      error => console.log(error),
      () => {
        this.claBackendService.getLinkedRepos(githubRepos).subscribe((data) => {
          this.addLinkedRepos(data);
        });
      }
    );
  }
  public requestOrgsFromBackend() {
    let githubOrgs = null;
    this.homeCacheService.currentUserOrgs.subscribe(
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

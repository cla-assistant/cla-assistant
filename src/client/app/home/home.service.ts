import { Injectable } from '@angular/core';
import { Observable, Observer, BehaviorSubject } from 'rxjs';

import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { HomeCacheService } from './homeCache.service';
import { GithubRepo } from '../shared/github/repo';
import { Org } from '../shared/github/org';
import { Gist } from '../shared/github/gist';
import { fromGithubRepo } from '../shared/claBackend/repo';
import { LinkedItem, LinkedRepo } from '../shared/claBackend/linkedItem';

@Injectable()
export class HomeService {
  private linkedRepos: BehaviorSubject<LinkedRepo[]>;

  constructor(
    private homeCacheService: HomeCacheService,
    private claBackendService: ClaBackendService) {
    this.linkedRepos = new BehaviorSubject<LinkedRepo[]>([]);
  }

  public getLinkedRepos(): Observable<LinkedRepo[]> {
    return this.linkedRepos.asObservable();
  }
  public link(gist: Gist, repoOrOrg: GithubRepo | Org): Observable<LinkedItem> {
    function isRepo(obj) {
      return obj.fullName !== undefined;
    }
    if (isRepo(repoOrOrg)) {
      return this.linkRepo(gist, repoOrOrg as GithubRepo);
    }
  }
  private linkRepo(gist: Gist, repo: GithubRepo): Observable<LinkedRepo> {
    return new Observable<LinkedRepo>(
      (observer: Observer<LinkedRepo>) => {
        const linkedRepo = new LinkedRepo(fromGithubRepo(repo, gist.url));
        this.claBackendService.linkCla(linkedRepo).subscribe(
          () => {
            this.claBackendService.addWebhook(linkedRepo).subscribe(
              () => {
                this.addLinkedRepos([linkedRepo]);
                observer.next(linkedRepo);
              },
              (error) => observer.error(error),
              () => observer.complete()
            );
          },
          (error) => {
            const errBody = error.json();
            if (errBody.errmsg.match(/.*duplicate key error.*/)) {
              console.log('This repository is already set up.');
            } else {
              console.log(errBody.errmsg);
            }
          }
        );
      }
    );
  }
  public unlinkRepo(repo: LinkedRepo) {
    this.claBackendService.unlinkCla(repo).subscribe(
      () => {
        this.claBackendService.removeWebhook(repo).subscribe();
        this.removeLinkedRepo(repo);
      },
      (error) => {
        console.log(error);
      }
    );
  }
  private linkOrg(gist, repo) {

  }
  private addLinkedRepos(newRepos: LinkedRepo[]): void {
    this.linkedRepos.next(this.linkedRepos.value.concat(newRepos));
  }
  private removeLinkedRepo(removedRepo: LinkedRepo): void {
    const nextValue = this.linkedRepos.value.filter((linkedRepo) => {
      return linkedRepo.id !== removedRepo.id;
    });
    this.linkedRepos.next(nextValue);
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
}

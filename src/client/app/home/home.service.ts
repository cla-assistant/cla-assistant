import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

import { ClaBackendService } from '../shared/claBackend/claBackend.service';
import { HomeCacheService } from './homeCache.service';
import { GithubRepo } from '../shared/github/repo';
import { Org } from '../shared/github/org';
import { Gist } from '../shared/github/gist';
import { ClaRepo, fromGithubRepo} from '../shared/claBackend/repo';

@Injectable()
export class HomeService {
  private linkedRepos: BehaviorSubject<ClaRepo[]>;

  constructor(
    private homeCacheService: HomeCacheService,
    private claBackendService: ClaBackendService) {
    this.linkedRepos = new BehaviorSubject<ClaRepo[]>([]);
    this.requestReposFromBackend();
  }

  public getLinkedRepos(): Observable<ClaRepo[]> {
    return this.linkedRepos.asObservable();
  }
  public link(gist: Gist, repoOrOrg: GithubRepo | Org) {
    function isRepo(obj) {
      return obj.fullName !== undefined;
    }
    if (isRepo(repoOrOrg)) {
      this.linkRepo(gist, repoOrOrg as GithubRepo);
    }
  }
  public linkRepo(gist: Gist, repo: GithubRepo) {
    const claRepo: ClaRepo = fromGithubRepo(repo, gist.url);
    this.claBackendService.linkClaToRepo(claRepo).subscribe(
      () => this.addLinkedRepos([claRepo]),
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
  public unlinkRepo(repo: ClaRepo) {
    this.claBackendService.unlinkClaFromRepo(repo).subscribe(
      () => {
        this.removeLinkedRepo(repo);
      },
      (error) => {
        console.log(error);
      }
    );
  }
  private linkOrg(gist, repo) {

  }
  private addLinkedRepos(newRepos: ClaRepo[]): void {
    this.linkedRepos.next(this.linkedRepos.value.concat(newRepos));
  }
  private removeLinkedRepo(removedRepo: ClaRepo): void {
    const nextValue = this.linkedRepos.value.filter((linkedRepo) => {
      return linkedRepo.repoId !== removedRepo.repoId;
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

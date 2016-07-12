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
      () => this.addLinkedRepo(claRepo),
      (error) => console.log(error)
    );
  }
  private linkOrg(gist, repo) {

  }
  private addLinkedRepo(newRepo: ClaRepo): void {
    this.linkedRepos.next([...this.linkedRepos.value, newRepo]);
  }


  public requestReposFromBackend() {
    let githubRepos = null;
    this.homeCacheService.currentUserRepos.subscribe(
      repos => githubRepos = repos,
      error => console.log(error),
      () => {
        this.claBackendService.getLinkedRepos(githubRepos).subscribe((data) => {
          this.addLinkedRepo(data);
        });
      }
    );
  }
}

import {Component, Input} from '@angular/core';
import { HomeService } from '../home.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { Observable } from 'rxjs';
import { LinkedItemRow } from './claRepoRow.component';
//import {ContributorsModal} from './contributors.modal';

@Component({
  selector: 'repo-list',
  directives: [LinkedItemRow],
  templateUrl: './repoList.html'
})
export class RepoList {
  private claRepos: Observable<LinkedItem[]>;
  constructor(private homeService: HomeService) {
    this.claRepos = homeService
      .getLinkedRepos();

  }

  public unlinkRepo(repo) {
    this.homeService.unlinkRepo(repo);
  }
}

import { Component, Input, ViewChild } from '@angular/core';
import { HomeService } from '../home.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { Observable } from 'rxjs';
import { LinkedItemRow } from './claRepoRow.component';
import { ConfirmRemoveModal } from './confirmRemoveModal.component';
// import {ContributorsModal} from './contributors.modal';

@Component({
  selector: 'repo-list',
  directives: [LinkedItemRow, ConfirmRemoveModal],
  templateUrl: './repoList.html'
})
export class RepoList {
  @ViewChild(ConfirmRemoveModal)
  private confirmRemoveModal: ConfirmRemoveModal;

  private claRepos: Observable<LinkedItem[]>;
  constructor(private homeService: HomeService) {
    this.claRepos = homeService
      .getLinkedRepos();

  }

  public unlinkRepo(repo) {
    this.confirmRemoveModal.open().subscribe(
      confirmed => confirmed && this.homeService.unlinkRepo(repo)
    );
  }
}

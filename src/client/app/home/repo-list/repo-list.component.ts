import { Component, Input, ViewChild } from '@angular/core';
import { HomeService } from '../home.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { Observable } from 'rxjs';
import { LinkedItemRowComponent } from './linked-item-row.component';
import { ConfirmRemoveModal } from './confirm-remove.modal';
// import {ContributorsModal} from './contributors.modal';

@Component({
  selector: 'repo-list',
  directives: [LinkedItemRowComponent, ConfirmRemoveModal],
  templateUrl: './repo-list.component.html'
})
export class RepoListComponent {
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

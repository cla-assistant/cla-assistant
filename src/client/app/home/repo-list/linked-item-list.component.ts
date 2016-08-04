import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { HomeService } from '../home.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { Observable } from 'rxjs';
import { LinkedItemRowComponent } from './linked-item-row.component';
import { ConfirmRemoveModal } from './confirm-remove.modal';
// import {ContributorsModal} from './contributors.modal';

@Component({
  selector: 'linked-item-list',
  directives: [LinkedItemRowComponent, ConfirmRemoveModal],
  templateUrl: './linked-item-list.component.html'
})
export class RepoListComponent implements OnInit {
  @Input() private itemType: string;
  @ViewChild(ConfirmRemoveModal)
  private confirmRemoveModal: ConfirmRemoveModal;
  private claItems: LinkedItem[] = [];

  constructor(private homeService: HomeService) { }

  public ngOnInit() {
    const setClaItems = (claItems: LinkedItem[]) => {
      this.claItems = claItems.sort((a: LinkedItem, b: LinkedItem) => {
        return a.getFullName().localeCompare(b.getFullName());
      });
    };
    if (this.itemType === 'repo') {
      this.homeService.getLinkedRepos().subscribe(setClaItems);
    } else {
      this.homeService.getLinkedOrgs().subscribe(setClaItems);
    }
  }

  public unlinkItem(repo) {
    this.confirmRemoveModal.open().subscribe(
      confirmed => confirmed && this.homeService.unlinkItem(repo)
    );
  }
}

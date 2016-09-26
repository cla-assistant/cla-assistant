import { Component, Input, ViewChild } from '@angular/core';
import { HomeService } from '../home.service';
import { LinkedItem } from '../../shared/claBackend/linkedItem';
import { Observable } from 'rxjs/Observable';
import { LinkedItemRowComponent } from './linked-item-row.component';
import { ConfirmRemoveModal } from './confirm-remove.modal';
// import {ContributorsModal} from './contributors.modal';

@Component({
  selector: 'linked-item-list',
  //directives: [LinkedItemRowComponent, ConfirmRemoveModal],
  templateUrl: './linked-item-list.component.html'
})
export class LinkedItemListComponent {
  @Input() public set claItems(items: LinkedItem[]) {
    this.sortedClaItems = items.sort((a: LinkedItem, b: LinkedItem) => {
      return a.getFullName().localeCompare(b.getFullName());
    });
  }
  @Input() private itemType: string;
  @ViewChild(ConfirmRemoveModal)
  private confirmRemoveModal: ConfirmRemoveModal;
  private sortedClaItems: LinkedItem[] = [];

  constructor(private homeService: HomeService) { }

  public unlinkItem(repo) {
    this.confirmRemoveModal.open().then(
      confirmed => confirmed && this.homeService.unlinkItem(repo)
    );
  }
}

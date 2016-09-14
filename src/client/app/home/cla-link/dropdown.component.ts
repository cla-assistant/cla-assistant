import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SelectComponent } from 'ng2-select';

import { HomeService } from '../home.service';
import {
  GithubRepo,
  GithubOrg
} from '../../shared/github';


@Component({
  selector: 'dropdown',
//  directives: [SelectComponent],
  host: {
    'class': 'form-group has-feedback',
    'style': 'display:block'
  },
  template: `
    <ng-select 
      [allowClear]="true"
      [items]="dropdownItems"
      (selected)="selected($event)"
      (removed)="removed($event)"
      placeholder="select">
    </ng-select>
  `
})
export class DropdownComponent implements OnInit {

  @Input() public categories: Array<{
    title: string,
    items: Observable<any>
    getItemText: (item) => string
  }>;
  @Output() public onSelect: EventEmitter<any>;
  @ViewChild(SelectComponent) public selectComp: SelectComponent;

  private dropdownItems: any[];

  constructor() {
    this.onSelect = new EventEmitter<any>();
  }

  public clear() {
    this.selectComp.remove(null);
  }

  public ngOnInit() {
    this.dropdownItems = new Array(this.categories.length);
    this.categories.forEach((category, categoryId) => {
      category.items.subscribe(items => {
        let children = items.map((item, index) => ({
          id: index + 1,
          text: category.getItemText(item),
          item: item
        }));
        // Workaround, cause empty children array is not allowed
        if (children.length === 0) {
          children = [{
            id: -1,
            text: 'no results'
          }];
        }
        this.dropdownItems[categoryId] = {
          id: categoryId + 1,
          text: category.title,
          children
        };
        // Trigger change detection
        this.dropdownItems = this.dropdownItems.slice();
      });
    });
  }

  public selected(event) {
    if (event.id === -1) { this.clear(); return; }
    this.onSelect.emit(this.dropdownItems[event.parent.id - 1].children[event.id - 1].item);
  }
  public removed() {
    this.onSelect.emit(null);
  }
}

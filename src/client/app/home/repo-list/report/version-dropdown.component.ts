import { Component, OnChanges, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SelectComponent } from 'ng2-select';

@Component({
  selector: 'version-dropdown',
  directives: [SelectComponent],
  host: {
    'class': 'form-group new-link-select-gist-dd-outer'
  },
  template: `
    <ng-select 
      [items]="historyDropdownItems"
      (selected)="selected($event)"
      placeholder="Select Version">
    </ng-select>
  `
})
export class VersionDropdownComponent implements OnChanges {
  @Input() private gist;
  @Output() public versionSelected: EventEmitter<{}>;
  @ViewChild(SelectComponent) public selectComp: SelectComponent;

  private historyDropdownItems: any[] = [];

  constructor() {
    this.versionSelected = new EventEmitter<{}>();
  }

  public ngOnChanges(changes) {
    if (changes.gist) {
      this.historyDropdownItems =
        this.createDropdownItems(changes.gist.currentValue.history);
    }
  }


  public clear() {
    this.selectComp.remove(null);
  }

  public selected(event) {
    if (event.id - 1 === this.gist.history.length) {
      this.versionSelected.emit({});
    }
    this.versionSelected.emit(this.gist.history[event.id - 1]);
  }

  private createDropdownItems(history) {
    const items = history.map((version, index) => ({
      id: index + 1,
      text: new Date(version.committed_at).toLocaleString()
    }));
    items.push({
      id: history.length + 1,
      text: 'All versions'
    });
    return items;
  }


}

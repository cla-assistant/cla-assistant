import { Component, OnChanges, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SelectComponent } from 'ng2-select';

@Component({
  selector: 'version-dropdown',
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
          this.createDropdownItems(this.gist.history);
      this.selectComp.active = [this.historyDropdownItems[0]];
      this.selectComp.ngOnInit(); // Workaround to set selected value
      this.selected(this.historyDropdownItems[0]);
    }
  }

  public clear() {
    this.selectComp.remove(null);
  }

  public selected(event) {
    if (event.id - 1 === this.gist.history.length) {
      this.versionSelected.emit({});
      return;
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

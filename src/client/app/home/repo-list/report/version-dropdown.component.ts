import { Component, OnChanges, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SelectComponent } from 'ng2-select';
import { Gist } from '../../../shared/github';

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
export class VersionDropdownComponent {
  private _gist: Gist;
  @Input() private set gist(value) {
    this._gist = value;
    if (this._gist) {
      this.historyDropdownItems =
        this.createDropdownItems(this._gist.history);
      this.selectComp.active = [this.historyDropdownItems[0]];
      this.selectComp.ngOnInit(); // Workaround to set selected value
      this.selected(this.historyDropdownItems[0]);
    }
  };
  @Output() public versionSelected: EventEmitter<{}>;
  @ViewChild(SelectComponent) public selectComp: SelectComponent;

  private historyDropdownItems: any[] = [];

  constructor() {
    this.versionSelected = new EventEmitter<{}>();
  }

  public clear() {
    this.selectComp.remove(null);
  }

  public selected(event) {
    if (event.id - 1 === this._gist.history.length) {
      this.versionSelected.emit({});
      return;
    }
    this.versionSelected.emit(this._gist.history[event.id - 1]);
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

import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CustomFieldData } from './custom-field-data';

@Component({
  selector: 'custom-field',
  templateUrl: 'custom-field.component.html'
})
export class CustomFieldComponent {
  @Input() public value: any;
  @Input() public data: CustomFieldData;
  @Input() public name: string;
  @Input() public disabled: boolean = false;
  @Output() public valueChange: EventEmitter<any>;

  constructor() {
    this.valueChange = new EventEmitter<any>();
  }

  private getType(): string {
    const type: any = this.data.type;
    if (type === 'boolean') {
      return 'checkbox';
    } else if (type.enum) {
      return 'enum';
    } else {
      return type;
    }
  }

  private onChange(event) {
    let value;
    if (this.getType() === 'checkbox') {
      value = event.target.checked;
    } else if (this.getType() === 'number') {
      value = parseInt(event.target.value, 10);
      if (isNaN(value)) {
        value = null;
      }
    }
    else {
      value = event.target.value;
    }
    return this.valueChange.emit(value);
  }
}

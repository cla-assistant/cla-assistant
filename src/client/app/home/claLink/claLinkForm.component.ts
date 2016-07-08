import { Component, Output, EventEmitter } from '@angular/core';
import { GistsDropdown } from './gistsDropdown.component';
import { Gist } from '../../shared/github/gist';

@Component({
  selector: 'cla-link-form',
  directives: [GistsDropdown],
  templateUrl: './claLinkForm.html'
})
export class ClaLinkForm {
  @Output() public onClose: EventEmitter<void>;

  private selectedGist: Gist;

  constructor() {
    this.onClose = new EventEmitter<void>();
    this.clearSelectedGist();
  }

  public handleGistSelected(event) {
    if (event) {
      this.selectedGist = event;
    } else {
      this.clearSelectedGist();
    }
  }

  public info() {
    console.log('Not implemented');
  }

  private clearSelectedGist() {
    this.selectedGist = {
      name: null,
      url: ''
    };
  }
}

import { Component } from '@angular/core';

import { ClaLinkForm } from './claLinkForm.component';

@Component({
  selector: 'cla-link',
  directives: [ClaLinkForm],
  templateUrl: './claLink.html'
})
export class ClaLink {
  private linkFormVisible: boolean = false;

  constructor() { }

  public toggleLinkForm() {
    this.linkFormVisible = !this.linkFormVisible;
  }

}

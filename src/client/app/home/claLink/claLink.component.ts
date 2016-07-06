import { Component, OnInit } from '@angular/core';

import { ClaLinkForm } from './claLinkForm.component';

@Component({
  selector: 'cla-link',
  directives: [ClaLinkForm],
  templateUrl: './claLink.html'
})
export class ClaLink implements OnInit {
  private linkFormVisible: boolean = false;
  

  constructor() { }

  public ngOnInit() {
    
  }

  public toggleLinkForm() {
    this.linkFormVisible = !this.linkFormVisible;
  }

  public info() {

  }

}

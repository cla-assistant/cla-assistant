import { Component, OnInit } from '@angular/core';
import { GistsDropdown } from './gistsDropdown.component';

@Component({
  selector: 'cla-link-form',
  directives: [GistsDropdown],
  templateUrl: 'app/home/claLink/claLinkForm.html'
})
export class ClaLinkForm implements OnInit {

  constructor() { }

  public ngOnInit() {
    
  }

}

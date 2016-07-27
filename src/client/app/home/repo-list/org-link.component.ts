import { Component, Input } from '@angular/core';
import { ClaOrg } from '../../shared/claBackend/org';

@Component({
  selector: 'organization-link',
  template: `
  <a href="https://github.com/{{ orgItem.org }}" target="space">
      <img src="{{orgItem.avatarUrl}}" alt="" class="org">&nbsp; {{ orgItem.org }}
  </a>`
})
export class OrgLink {
  @Input() public orgItem: ClaOrg;
}

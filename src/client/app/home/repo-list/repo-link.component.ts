import { Component, Input } from '@angular/core';
import { ClaRepo } from '../../shared/claBackend/repo';

@Component({
  selector: 'repository-link',
  template: `
  <a  bind-href="'https://github.com/'+repo.owner+'/'+ repo.repo" target="space">
      <i class="octicon" [ngClass]="{false:'octicon-repo', true:'octicon-repo-forked'}[repo.fork]"></i> 
      &nbsp; {{ repo.owner }} / {{ repo.repo }}
  </a>`
})
export class RepoLink {
  @Input() public repo: ClaRepo;
}

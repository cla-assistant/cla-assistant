import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { GithubService } from '../../shared/github/github.service';
import { Observable } from 'rxjs';
import { SELECT_DIRECTIVES } from 'ng2-select';
import { Gist } from '../../shared/github/gist';


@Component({
  selector: 'gists-dropdown',
  directives: [SELECT_DIRECTIVES],
  host: {
    'class': 'form-group new-link-select-gist-dd-outer'
  },
  template: `
    <ng-select 
      [allowClear]="true"
      [items]="gistsDropdownItems"
      (selected)="selected($event)"
      (removed)="removed($event)"
      placeholder="Select Gist">
    </ng-select>
  `
})
export class GistsDropdown implements OnInit {
  @Output() public onGistSelected: EventEmitter<Gist>;

  private gists: any[] = [];
  private gistsDropdownItems: any[] = [];

  constructor(private githubService: GithubService) {
    this.onGistSelected = new EventEmitter<Gist>();
  }

  public ngOnInit() {
    Observable.combineLatest(
      this.githubService.getUserGists(),
      this.githubService.getDefaultGists(),
      (userGists: Gist[], defaultGists: Gist[]) => ({
        gists: defaultGists.concat(userGists),
        dropDownItems: this.createDropdownItems(defaultGists, userGists)
      })
    ).subscribe(
      result => {
        this.gists = result.gists;
        this.gistsDropdownItems = result.dropDownItems;
      },
      error => console.error(error)
    );
  }

  public selected(event) {
    this.onGistSelected.emit(this.gists[event.id - 1]);
  }
  public removed() {
    this.onGistSelected.emit(null);
  }

  private createDropdownItems(defaultGists: Gist[], userGists: Gist[]) {
    function createChildItems(gists: Gist[], idOffset: number) {
      return gists.map((gist, index) => ({
        id: idOffset + index + 1, // id 0 is an invalid id
        text: gist.name
      }));
    }
    return [
      {
        text: 'Default CLAs',
        children: createChildItems(defaultGists, 0)
      },
      {
        text: 'My Gist Files',
        children: createChildItems(userGists, defaultGists.length)
      }
    ];
  }


}

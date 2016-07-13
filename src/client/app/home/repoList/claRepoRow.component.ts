import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import { ClaBackendService } from '../../shared/claBackend/claBackend.service';
import { ClaRepo } from '../../shared/claBackend/repo';
@Component({
  selector: 'cla-repo-row',
  templateUrl: 'claRepoRow.html'
})

export class ClaRepoRow implements OnInit {
  @Input() public repo: ClaRepo;
  @Output() public onUnlink: EventEmitter<ClaRepo>;

  private loading: boolean = true;
  private gist: any = {
    fullName: '',
    html_url: '',
    updated_at: null
  };
  private gistValid: boolean = false;

  constructor(private claBackendService: ClaBackendService) {
    this.onUnlink = new EventEmitter<ClaRepo>();
  }

  public ngOnInit() {
    this.claBackendService.getGistInfo(this.repo).subscribe(
      (gist) => {
        this.loading = false;
        if (gist) {
          this.gist = gist;
          this.normalizeGistName(this.gist);
          this.gistValid = !!this.gist.id;
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }


  public isLinkActive() {
    return true;
  }

  private normalizeGistName(gist) {
    if (!gist.fileName && gist.files) {
      let fileName = Object.keys(gist.files)[0];
      fileName = gist.files[fileName].filename ? gist.files[fileName].filename : fileName;
      gist.fileName = fileName;
    }
  }

}

import { Injectable } from '@angular/core';
import { Gist } from '../../shared/github/gist';
import { GithubRepo } from '../../shared/github/repo';
import { Org } from '../../shared/github/org';

@Injectable()
export class ClaLinkService {
  public createLink(selectedGist: Gist, selectedRepoOrOrg: GithubRepo | Org) {

  }
}
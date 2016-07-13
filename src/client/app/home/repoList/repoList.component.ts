import {Component, Input} from '@angular/core';
import { HomeService } from '../home.service';
import { ClaRepo } from '../../shared/claBackend/repo';
import { Observable } from 'rxjs';
import { ClaRepoRow } from './claRepoRow.component';
//import {ContributorsModal} from './contributors.modal';

@Component({
    selector: 'repo-list',
    directives: [ClaRepoRow],
    templateUrl: './repoList.html',
})

export class RepoList {
    private claRepos: Observable<ClaRepo[]>;
    constructor(private homeService: HomeService) {
        this.claRepos = homeService.getLinkedRepos();
    }

    public unlinkRepo(repo) {
        this.homeService.unlinkRepo(repo);
    }
}

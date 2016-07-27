import { ClaRepo } from './repo';
import { ClaOrg } from './org';

export abstract class LinkedItem {
  constructor(public id: string, public gist: string) { }

  public abstract getType(): string;
  public abstract getFullName(): string;
  public abstract getIdObject(): any;
  public abstract getNameObject(): any;
  public abstract getCompleteObject(): any;
}

export class LinkedRepo extends LinkedItem {
  constructor(private repo: ClaRepo) {
    super(repo.repoId, repo.gist);
  }

  public getType(): string {
    return 'repo';
  }
  public getFullName(): string {
    return `${this.repo.owner}/${this.repo.repo}`;
  }
  public getIdObject(): Object {
    return { repoId: this.repo.repoId };
  }
  public getNameObject(): Object {
    return {
      repo: this.repo.repo,
      user: this.repo.owner
    };
  }
  public getCompleteObject(): ClaRepo {
    return this.repo;
  }
}

export class LinkedOrg extends LinkedItem {
  constructor(private org: ClaOrg) {
    super(org.orgId, org.gist);
  }

  public getType(): string {
    return 'org';
  }
  public getFullName(): string {
    return this.org.org;
  }
  public getIdObject(): Object {
    return { orgId: this.org.orgId };
  }
  public getNameObject(): Object {
    return {
      org: this.org.org
    };
  }
  public getCompleteObject(): ClaOrg {
    return this.org;
  }
}

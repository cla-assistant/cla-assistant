import { ClaRepo } from './repo';
import { ClaOrg } from './org';

/**
 * An abstract representation of a linked item. The linked item contains 
 * information about the item that is linked and the cla(gist) it is linked to.
 */
export abstract class LinkedItem {
  constructor(public id: string, public gist: string) { }

  /**
   * Returns the type of the linked item as a string.
   */
  public abstract getType(): string;
  /**
   * Returns a string containing the full name of the linked item.
   */
  public abstract getFullName(): string;
  /**
   * Returns an object containing a single attribute which holds the items id.
   * The name of the attribute depends on the type of the linked item.
   */
  public abstract getIdObject(): any;
  /**
   * Returns an object containing the name of the linked object. The structure 
   * of the object depends on the type of the linked item.
   */
  public abstract getNameObject(): any;
  /**
   * Returns the complete underlying object which depends on the type of the
   * linked item.
   */
  public abstract getCompleteObject(): any;
}

/**
 * Represents a repository that is linked to a cla. 
 */
export class LinkedRepo extends LinkedItem {
  constructor(private repo: ClaRepo) {
    super(repo.repoId, repo.gist);
  }
  /**
   * Returns the type 'repo'
   */
  public getType(): string {
    return 'repo';
  }
  /**
   * Returns the full name of the repo: owner/repoName
   */
  public getFullName(): string {
    return `${this.repo.owner}/${this.repo.repo}`;
  }
  /**
   * Returns the repo id
   */
  public getIdObject(): { repoId: string } {
    return { repoId: this.repo.repoId };
  }
  /**
   * Returns the name object consisting of the repo and user name
   */
  public getNameObject(): { repo: string, user: string, owner: string } {
    return {
      repo: this.repo.repo,
      owner: this.repo.owner,
      user: this.repo.owner // Owner is called user in webhook API calls 
    };
  }
  /**
   * Returns the complete [[ClaRepo]] object
   */
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

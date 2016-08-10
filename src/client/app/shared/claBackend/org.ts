import { GithubOrg } from '../github/org';

export interface ClaOrg {
  orgId: string;
  org: string;
  gist: string;
  avatarUrl: string;
}

export function fromGithubOrg(
  githubOrg: GithubOrg,
  gistUrl: string): ClaOrg {
  return {
    orgId: githubOrg.id.toString(),
    org: githubOrg.login,
    gist: gistUrl,
    avatarUrl: githubOrg.avatarUrl
  };
}

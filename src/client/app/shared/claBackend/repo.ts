import { GithubRepo } from '../github/repo';

export interface ClaRepo {
  repoId: string;
  repo: string;
  owner: string;
  gist: string;
  fork: boolean;
}

export function fromGithubRepo(
  githubRepo: GithubRepo,
  gistUrl: string): ClaRepo {
  return {
    repoId: githubRepo.id.toString(),
    repo: githubRepo.name,
    owner: githubRepo.owner.login,
    gist: gistUrl,
    fork: githubRepo.fork
  };
}

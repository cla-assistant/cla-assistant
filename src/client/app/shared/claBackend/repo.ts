import { GithubRepo } from '../github/repo';

export interface ClaRepo {
  repoId: number;
  repo: string;
  owner: string;
  gist: string;
  fork: boolean;
}

export function fromGithubRepo(
  githubRepo: GithubRepo,
  gistUrl: string): ClaRepo {
  return {
    repoId: githubRepo.id,
    repo: githubRepo.name,
    owner: githubRepo.owner.login,
    gist: gistUrl,
    fork: githubRepo.fork
  };
}

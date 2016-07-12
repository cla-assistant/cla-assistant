

export interface GithubRepo {
  id: number;
  fullName: string;
  name: string;
  fork: boolean;
  owner: {
    login: string;
    avatarUrl: string;
  };
}
export function createReposFromApiResponse(response): GithubRepo[] {
  return response.data.map(repo => ({
    id: repo.id,
    fullName: repo.full_name,
    name: repo.name,
    fork: repo.fork,
    owner: {
      login: repo.owner.login,
      avatarUrl: repo.owner.avatar_url
    }
  }));
}

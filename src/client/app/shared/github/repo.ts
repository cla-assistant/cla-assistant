/**
 * Definition of the necessary attributes of an GitHub Api repo response
 */
export interface GithubRepo {
  id: number;
  name: string;
  /** owner/name */
  fullName: string;
  fork: boolean;
  owner: {
    login: string;
  };
}

/**
 * Type definition of GitHub Api repo response
 */
type ApiRepoResponse = {
  data: Array<{
    id: number,
    name: string
    full_name: string,
    fork: boolean,
    owner: { login: string }
  }>
}
/**
 * Maps the GitHub API response to the attributes defined in [[GithubRepo]].
 * 
 * @param response The GitHub response returned from an API call
 * @returns Repo array with necessary repo information
 */
export function createReposFromApiResponse(response: ApiRepoResponse): GithubRepo[] {
  return response.data.map(repo => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    fork: repo.fork,
    owner: {
      login: repo.owner.login
    }
  }));
}

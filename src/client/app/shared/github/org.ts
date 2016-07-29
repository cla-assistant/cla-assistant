/**
 * Definition of the necessary attributes of an GitHub Api org response
 */
export interface GithubOrg {
  id: number;
  login: string;
  avatarUrl: string;
}

/**
 * Type definition of GitHub Api org response
 */
type ApiOrgResponse = {
  data: Array<{
    role: string,
    organization: {
      id: number,
      login: string,
      avatar_url: string
    }
  }>
}
/**
 * Maps the GitHub API response to the attributes defined in [[GithubOrg]].
 * Orgs where the user does not have admin rights will be filtered out
 * 
 * @param response The GitHub response returned from an API call
 * @returns Org array with necessary org information
 */
export function createOrgsFromApiResponse(response: ApiOrgResponse): GithubOrg[] {
  return response.data
    .filter(membership => membership.role === 'admin')
    .map(membership => ({
      id: membership.organization.id,
      login: membership.organization.login,
      avatarUrl: membership.organization.avatar_url
    }));
}

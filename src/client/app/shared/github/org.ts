export interface GithubOrg {
  login: string;
  id: number;
  avatarUrl: string;
}

export function createOrgsFromApiResponse(response): GithubOrg[] {
  return response.data
    .filter(membership => membership.role === 'admin')
    .map(membership => ({
      id: membership.organization.id,
      login: membership.organization.login,
      avatarUrl: membership.organization.avatar_url
    }));
}

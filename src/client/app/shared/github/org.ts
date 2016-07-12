export interface Org {
  login: string;
}

export function createOrgsFromApiResponse(response): Org[] {
  return response.data
    .filter(membership => membership.role === 'member')
    .map(membership => ({
      login: membership.organization.login
    }));
}

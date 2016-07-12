export interface User {
  htmlUrl: string;
  avatarUrl: string;
  login: string;
  roles: {
    admin: boolean;
    orgAdmin: boolean;
  };
}

export function createUserFromApiResponse(response): User {
  let admin = false;
  let orgAdmin = false;
  if (response.meta && response.meta.scopes) {
    admin = response.meta.scopes.indexOf('write:repo_hook') > -1 ? true : false;
    orgAdmin = response.meta.scopes.indexOf('admin:org_hook') > -1 ? true : false;
  }
  return {
    htmlUrl: response.data.html_url,
    avatarUrl: response.data.avatar_url,
    login: response.data.login,
    roles: {
      admin,
      orgAdmin
    }
  };
}

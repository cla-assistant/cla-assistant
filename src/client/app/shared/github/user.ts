/**
 * Definition of the necessary attributes of an GitHub Api user response
 */
export interface User {
  htmlUrl: string;
  avatarUrl: string;
  login: string;
  email?: string;
  roles: {
    admin: boolean;
    orgAdmin: boolean;
  };
}

/**
 * Type definition of GitHub Api repo response
 */
type ApiUserResponse = {
  data: {
    html_url: string,
    avatar_url: string,
    login: string,
    email?: string
  }
  meta: {
    scopes: string
  }
}
/**
 * Maps the GitHub API response to the attributes defined in [[User]].
 * 
 * @param response The GitHub response returned from an API call
 * @returns User with necessary org information
 */
export function createUserFromApiResponse(response: ApiUserResponse): User {
  let admin = false;
  let orgAdmin = false;
  if (response.meta && response.meta.scopes) {
    admin = response.meta.scopes.indexOf('write:repo_hook') > -1 ? true : false;
    orgAdmin = response.meta.scopes.indexOf('admin:org_hook') > -1 ? true : false;
  }
  const user: User = {
    htmlUrl: response.data.html_url,
    avatarUrl: response.data.avatar_url,
    login: response.data.login,
    email: response.data.email,
    roles: {
      admin,
      orgAdmin
    }
  };
  // Mix original response into the user data, because the custom fields can
  // reference them via the githubKey property. The data can only be accessed
  // via the index operator (user[githubKey]).
  return Object.assign({}, response.data, user);
}

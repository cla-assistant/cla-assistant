/**
 * Definition of the necessary attributes of an GitHub Api gist response
 */
export interface Gist {
  /** Filename */
  fileName: string;
  /** Gist url */
  url: string;
  updatedAt: string;
  history: Array<{
    version: string;
  }>;
}

/**
 * Type definition of GitHub Api gist response
 */
type ApiGistResponse = {
  data: GistData
};
type ApiGistArrayResponse = {
  data: Array<GistData>
};
type GistData = {
  html_url: string,
  updated_at: string;
  files: {
    [fileName: string]: { filename: string }
  }
  history: [{
    version: string;
  }];
};


/**
 * Maps the GitHub API response to the attributes defined in [[Gist]].
 * 
 * @param response The GitHub response returned from an API call
 * @returns Gist array with necessary gist information
 */
export function createGistFromApiResponse(response: ApiGistResponse): Gist {
  return createGist(response.data);
}
export function createGistArrayFromApiResponse(response: ApiGistArrayResponse): Gist[] {
  return response.data.map(createGist);
}
function createGist(gistData) {
  return {
    fileName: extractFileName(gistData),
    url: gistData.html_url,
    updatedAt: gistData.updated_at,
    history: gistData.history
  };
}
function extractFileName(gist): string {
  let fileName = Object.keys(gist.files)[0];
  return gist.files[fileName].filename || fileName;
}

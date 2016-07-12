export interface Gist {
  name: string;
  url: string;
}
export function createGistsFromApiResponse(response) {
  return response.data.map(gist => ({
    name: gist.files[Object.keys(gist.files)[0]].filename || Object.keys(gist.files)[0],
    url: gist.html_url
  }));
}

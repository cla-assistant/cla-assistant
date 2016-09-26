export interface Signature {
  repo_name: string;
  repo_owner: string;
  user_name: string;
  gist_url: string;
  gist_name?: string;
  gist_version: string;
  signed_at: string;
  org_cla: boolean;
  custom_fields: any;
}

type SignatureApiResponse = Array<{
  repo: string,
  repoId: string,
  owner: string,
  ownerId: string,
  user: string,
  userId: string,
  gist_url: string,
  gist_version: string,
  created_at: string,
  org_cla: boolean,
  custom_fields: any;
}>

export function createSignaturesFromApiResponse(
  response: SignatureApiResponse
): Signature[] {
  return response.map(signature => ({
    repo_name: signature.repo,
    repo_owner: signature.owner,
    user_name: signature.user,
    gist_url: signature.gist_url,
    gist_version: signature.gist_version,
    signed_at: signature.created_at,
    org_cla: signature.org_cla,
    custom_fields: signature.custom_fields ? JSON.parse(signature.custom_fields) : {}
  }));
}

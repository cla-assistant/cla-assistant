export interface CustomFieldData {
  title: string;
  type: 'string' | 'number' | 'boolean' | { enum: string[] };
  required: boolean;
  description: string;
  maximum: number;
  minimum: number;
  githubKey: string;
}

import api from './axios';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  active: boolean;
  lastUsed?: string;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  rawKey: string;
}

export const getApiKeys = (): Promise<ApiKey[]> =>
  api.get('/api-keys').then((r) => r.data);

export const createApiKey = (name: string): Promise<ApiKeyCreated> =>
  api.post('/api-keys', { name }).then((r) => r.data);

export const revokeApiKey = (id: string): Promise<void> =>
  api.delete(`/api-keys/${id}`).then((r) => r.data);

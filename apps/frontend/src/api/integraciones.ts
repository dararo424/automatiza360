import api from './axios';

export interface InstagramStatus {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  connectedAt: string | null;
}

export function getInstagramStatus(): Promise<InstagramStatus> {
  return api.get('/instagram/status').then((r) => r.data);
}

export function getInstagramConnectUrl(): Promise<{ url: string }> {
  return api.get('/instagram/connect-url').then((r) => r.data);
}

export function disconnectInstagram(): Promise<{ disconnected: boolean }> {
  return api.delete('/instagram/disconnect').then((r) => r.data);
}

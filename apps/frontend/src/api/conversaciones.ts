import api from './axios';

export interface Conversation {
  id: string;
  clientPhone: string;
  clientName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  _count: { messages: number };
}

export interface Message {
  id: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
  createdAt: string;
}

export interface ConversationDetail extends Omit<Conversation, '_count'> {
  messages: Message[];
}

export interface UsageInfo {
  used: number;
  limit: number | null;
  plan: string;
}

export const getConversaciones = (): Promise<Conversation[]> =>
  api.get('/conversaciones').then((r) => r.data);

export const getConversacion = (id: string): Promise<ConversationDetail> =>
  api.get(`/conversaciones/${id}`).then((r) => r.data);

export const marcarLeida = (id: string): Promise<void> =>
  api.patch(`/conversaciones/${id}/leer`).then((r) => r.data);

export const getUso = (): Promise<UsageInfo> =>
  api.get('/conversaciones/uso').then((r) => r.data);

export const ingestMessage = (data: {
  clientPhone: string;
  clientName?: string;
  body: string;
  direction: 'INBOUND' | 'OUTBOUND';
}): Promise<any> => api.post('/conversaciones/ingest', data).then((r) => r.data);

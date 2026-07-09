const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Stats {
  total_batches: number;
  total_sent: number;
  total_failed: number;
  total_recipients: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  configured: boolean;
  requiredEnv: string[];
}

export interface Batch {
  id: string;
  provider: string;
  subject: string;
  md_file: string;
  from_email: string;
  from_name: string;
  total: number;
  sent: number;
  failed: number;
  tags: string;
  status: string;
  created_at: string;
  finished_at: string | null;
}

export interface SendRow {
  id: number;
  batch_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  success: number;
  message_id: string;
  error: string;
  provider: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  subject: string;
  md_content: string;
  created_at: string;
  updated_at: string;
}

export interface ContactFile {
  name: string;
  filename: string;
  path: string;
  count: number;
  size: number;
}

export interface MessageFile {
  name: string;
  filename: string;
  path: string;
  size: number;
  preview: string;
}

export const api = {
  getStats: () => fetchJson<Stats>('/stats'),
  getProviders: () => fetchJson<ProviderInfo[]>('/providers'),
  getConfig: () => fetchJson<Record<string, string>>('/config'),
  saveConfig: (config: Record<string, string>) =>
    fetchJson<{ success: boolean }>('/config', { method: 'POST', body: JSON.stringify(config) }),
  getBatches: () => fetchJson<Batch[]>('/batches'),
  getBatch: (id: string) => fetchJson<{ batch: Batch; sends: SendRow[] }>(`/batches/${id}`),
  getTemplates: () => fetchJson<Template[]>('/templates'),
  saveTemplate: (name: string, subject: string, mdContent: string) =>
    fetchJson<{ success: boolean }>('/templates', { method: 'POST', body: JSON.stringify({ name, subject, mdContent }) }),
  deleteTemplate: (name: string) =>
    fetchJson<{ success: boolean }>(`/templates/${name}`, { method: 'DELETE' }),
  preview: (content: string, subject: string, data?: Record<string, any>, isHtml = false) =>
    fetchJson<{ html: string }>('/preview', {
      method: 'POST',
      body: JSON.stringify(isHtml ? { htmlContent: content, subject, data } : { mdContent: content, subject, data }),
    }),
  previewWithTemplate: (htmlContent: string, subject: string, data: Record<string, any>, templateId: string) =>
    fetchJson<{ html: string }>('/preview', {
      method: 'POST',
      body: JSON.stringify({ htmlContent, subject, data, templateId }),
    }),
  send: (payload: any) =>
    fetchJson<any>('/send', { method: 'POST', body: JSON.stringify(payload) }),
  getContacts: () => fetchJson<ContactFile[]>('/contacts'),
  getContact: (name: string) => fetchJson<{ name: string; content: string }>(`/contacts/${name}`),
  saveContact: (name: string, content: string, ext: string) =>
    fetchJson<{ success: boolean }>('/contacts', { method: 'POST', body: JSON.stringify({ name, content, ext }) }),
  deleteContact: (name: string) =>
    fetchJson<{ success: boolean }>(`/contacts/${name}`, { method: 'DELETE' }),
  getMessages: () => fetchJson<MessageFile[]>('/messages'),
  getMessage: (name: string) => fetchJson<{ name: string; content: string }>(`/messages/${name}`),
  saveMessage: (name: string, content: string) =>
    fetchJson<{ success: boolean }>('/messages', { method: 'POST', body: JSON.stringify({ name, content }) }),
  deleteMessage: (name: string) =>
    fetchJson<{ success: boolean }>(`/messages/${name}`, { method: 'DELETE' }),
  getStorageAdapters: () => fetchJson<{ id: string; name: string; configured: boolean; requiredEnv: string[] }[]>('/storage'),
  uploadToStorage: (base64: string, filename: string, contentType: string) =>
    fetchJson<{ url: string; deleteUrl?: string }>('/storage/upload', {
      method: 'POST',
      body: JSON.stringify({ base64, filename, contentType }),
    }),
  getEmailTemplates: () => fetchJson<{ id: string; name: string; description: string }[]>('/email-templates'),
};

import { getConfig } from '../config/index.js';

export interface UploadResult {
  url: string;
  deleteUrl?: string;
}

export interface StorageAdapter {
  id: string;
  name: string;
  requiredEnv: string[];
  isConfigured(): boolean;
  upload(base64: string, filename: string, contentType: string): Promise<UploadResult>;
}

export class ImgBBStorage implements StorageAdapter {
  id = 'imgbb';
  name = 'ImgBB';
  requiredEnv = ['IMGBB_API_KEY'];

  private get apiKey(): string {
    return getConfig().IMGBB_API_KEY ?? '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async upload(base64: string, filename: string, _contentType: string): Promise<UploadResult> {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: base64, name: filename }),
    });
    const data = await res.json() as any;
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message ?? `ImgBB upload failed (HTTP ${res.status})`);
    }
    return {
      url: data.data.url,
      deleteUrl: data.data.delete_url,
    };
  }
}

const adapters: Record<string, StorageAdapter> = {
  imgbb: new ImgBBStorage(),
};

export function getStorageAdapter(): StorageAdapter | null {
  for (const adapter of Object.values(adapters)) {
    if (adapter.isConfigured()) return adapter;
  }
  return null;
}

export function listStorageAdapters(): { id: string; name: string; configured: boolean; requiredEnv: string[] }[] {
  return Object.values(adapters).map(a => ({
    id: a.id,
    name: a.name,
    configured: a.isConfigured(),
    requiredEnv: a.requiredEnv,
  }));
}

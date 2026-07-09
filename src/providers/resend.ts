import { Provider, ProviderSendParams, SendResult } from './base.js';
import { getConfig } from '../config/index.js';

export class ResendProvider implements Provider {
  id = 'resend';
  name = 'Resend';
  requiredEnv = ['RESEND_API_KEY'];

  private get apiKey(): string {
    return getConfig().RESEND_API_KEY ?? '';
  }

  validateConfig(): boolean {
    return !!this.apiKey;
  }

  async send(params: ProviderSendParams): Promise<SendResult> {
    const from = params.fromName ? `${params.fromName} <${params.from}>` : params.from;
    const body: any = {
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    };
    if (params.replyTo) body.reply_to = params.replyTo;
    if (params.tags) body.tags = params.tags;
    if (params.attachments?.length) {
      body.attachments = params.attachments.map(a => ({ filename: a.filename, content: a.content }));
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json() as any;
      if (!res.ok) return { success: false, error: data.message ?? `HTTP ${res.status}` };
      return { success: true, messageId: data.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async sendBatch(params: ProviderSendParams[]): Promise<SendResult[]> {
    return Promise.all(params.map(p => this.send(p)));
  }
}

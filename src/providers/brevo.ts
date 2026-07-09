import { Provider, ProviderSendParams, SendResult } from './base.js';
import { getConfig } from '../config/index.js';

export class BrevoProvider implements Provider {
  id = 'brevo';
  name = 'Brevo';
  requiredEnv = ['BREVO_API_KEY'];

  private get apiKey(): string {
    return getConfig().BREVO_API_KEY ?? '';
  }

  validateConfig(): boolean {
    return !!this.apiKey;
  }

  async send(params: ProviderSendParams): Promise<SendResult> {
    const body: any = {
      sender: { email: params.from, name: params.fromName ?? params.from },
      to: [{ email: params.to, name: params.toName ?? params.to }],
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
      subject: params.subject,
      htmlContent: params.html,
      tags: params.tags,
    };
    if (params.attachments?.length) {
      body.attachment = params.attachments.map(a => ({ name: a.filename, content: a.content, encoding: 'base64' }));
    }
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json() as any;
      if (!res.ok) return { success: false, error: data.message ?? data.code ?? `HTTP ${res.status}` };
      return { success: true, messageId: data.messageId };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async sendBatch(params: ProviderSendParams[]): Promise<SendResult[]> {
    return Promise.all(params.map(p => this.send(p)));
  }
}

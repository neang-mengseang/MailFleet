import { Provider, ProviderSendParams, SendResult } from './base.js';
import { getConfig } from '../config/index.js';

export class MailgunProvider implements Provider {
  id = 'mailgun';
  name = 'Mailgun';
  requiredEnv = ['MAILGUN_API_KEY', 'MAILGUN_DOMAIN'];

  private get apiKey(): string {
    return getConfig().MAILGUN_API_KEY ?? '';
  }
  private get domain(): string {
    return getConfig().MAILGUN_DOMAIN ?? '';
  }

  validateConfig(): boolean {
    return !!this.apiKey && !!this.domain;
  }

  async send(params: ProviderSendParams): Promise<SendResult> {
    const from = params.fromName ? `${params.fromName} <${params.from}>` : params.from;
    const form = new URLSearchParams();
    form.append('from', from);
    form.append('to', params.toName ? `${params.toName} <${params.to}>` : params.to);
    form.append('subject', params.subject);
    form.append('html', params.html);
    if (params.replyTo) form.append('h:Reply-To', params.replyTo);
    if (params.tags) params.tags.forEach(t => form.append('o:tag', t));
    if (params.attachments?.length) {
      const atts = params.attachments.map(a =>
        `data:${a.contentType};base64,name=${a.filename};filename=${a.filename}`
      ).join(',');
      form.append('attachment', atts);
    }
    try {
      const res = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`api:${this.apiKey}`).toString('base64'),
        },
        body: form,
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

import { Provider, ProviderSendParams, SendResult } from './base.js';
import { getConfig } from '../config/index.js';

export class SendGridProvider implements Provider {
  id = 'sendgrid';
  name = 'SendGrid';
  requiredEnv = ['SENDGRID_API_KEY'];

  private get apiKey(): string {
    return getConfig().SENDGRID_API_KEY ?? '';
  }

  validateConfig(): boolean {
    return !!this.apiKey;
  }

  async send(params: ProviderSendParams): Promise<SendResult> {
    const body: any = {
      personalizations: [{
        to: [{ email: params.to, name: params.toName }],
        subject: params.subject,
      }],
      from: { email: params.from, name: params.fromName },
      content: [{ type: 'text/html', value: params.html }],
    };
    if (params.replyTo) body.reply_to = params.replyTo;
    if (params.tags) body.categories = params.tags;
    if (params.customArgs) body.custom_args = params.customArgs;
    if (params.attachments?.length) {
      body.attachments = params.attachments.map(a => ({ filename: a.filename, content: a.content, type: a.contentType, disposition: 'attachment' }));
    }
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json() as any;
        return { success: false, error: data.errors?.[0]?.message ?? `HTTP ${res.status}` };
      }
      const messageId = res.headers.get('x-message-id') ?? undefined;
      return { success: true, messageId: messageId ?? undefined };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async sendBatch(params: ProviderSendParams[]): Promise<SendResult[]> {
    return Promise.all(params.map(p => this.send(p)));
  }
}

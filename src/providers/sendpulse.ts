import { Provider, ProviderSendParams, SendResult } from './base.js';
import { getConfig } from '../config/index.js';

export class SendPulseProvider implements Provider {
  id = 'sendpulse';
  name = 'SendPulse';
  requiredEnv = ['SENDPULSE_CLIENT_ID', 'SENDPULSE_CLIENT_SECRET'];

  private get clientId(): string {
    return getConfig().SENDPULSE_CLIENT_ID ?? '';
  }
  private get clientSecret(): string {
    return getConfig().SENDPULSE_CLIENT_SECRET ?? '';
  }
  private tokenCache: { token: string; expires: number } | null = null;

  validateConfig(): boolean {
    return !!this.clientId && !!this.clientSecret;
  }

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expires) {
      return this.tokenCache.token;
    }
    const res = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data.message ?? 'SendPulse auth failed');
    this.tokenCache = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000,
    };
    return data.access_token;
  }

  async send(params: ProviderSendParams): Promise<SendResult> {
    try {
      const token = await this.getToken();
      const from = params.fromName ? `${params.fromName} <${params.from}>` : params.from;
      const body: any = {
        html: params.html,
        text: params.text ?? '',
        subject: params.subject,
        from: { email: from },
        to: [{ email: params.to, name: params.toName ?? '' }],
      };
      if (params.replyTo) body.reply_to = params.replyTo;
      if (params.attachments?.length) {
        body.attachments = params.attachments.map(a => ({ name: a.filename, content: a.content, type: a.contentType }));
      }
      const res = await fetch('https://api.sendpulse.com/smtp/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json() as any;
      if (!res.ok || data.result === false) {
        return { success: false, error: data.message ?? data.text ?? `HTTP ${res.status}` };
      }
      return { success: true, messageId: data.id ?? data.message_id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async sendBatch(params: ProviderSendParams[]): Promise<SendResult[]> {
    return Promise.all(params.map(p => this.send(p)));
  }
}

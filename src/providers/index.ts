import { Provider } from './base.js';
import { BrevoProvider } from './brevo.js';
import { ResendProvider } from './resend.js';
import { SendGridProvider } from './sendgrid.js';
import { MailgunProvider } from './mailgun.js';
import { SendPulseProvider } from './sendpulse.js';

export type ProviderId = 'brevo' | 'resend' | 'sendgrid' | 'mailgun' | 'sendpulse';

const providers: Record<string, Provider> = {
  brevo: new BrevoProvider(),
  resend: new ResendProvider(),
  sendgrid: new SendGridProvider(),
  mailgun: new MailgunProvider(),
  sendpulse: new SendPulseProvider(),
};

export function getProvider(id: string): Provider {
  const p = providers[id];
  if (!p) throw new Error(`Unknown provider: ${id}. Available: ${Object.keys(providers).join(', ')}`);
  return p;
}

export function listProviders(): { id: string; name: string; configured: boolean; requiredEnv: string[] }[] {
  return Object.values(providers).map(p => ({
    id: p.id,
    name: p.name,
    configured: p.validateConfig(),
    requiredEnv: p.requiredEnv,
  }));
}

export { Provider, ProviderSendParams, SendResult, EmailAttachment } from './base.js';

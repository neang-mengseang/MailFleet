import { getConfig } from '../config/index.js';

export type TemplateId = 'none' | 'minimal' | 'business' | 'newsletter';

export interface EmailTemplate {
  id: TemplateId;
  name: string;
  description: string;
}

export const TEMPLATES: EmailTemplate[] = [
  { id: 'none', name: 'None', description: 'Plain email, no template wrapper' },
  { id: 'minimal', name: 'Minimal', description: 'Clean white card with subtle footer signature' },
  { id: 'business', name: 'Business', description: 'Logo header, body, professional signature footer' },
  { id: 'newsletter', name: 'Newsletter', description: 'Banner header, content sections, footer with links' },
];

interface SignatureData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
}

function getSignature(): SignatureData {
  const c = getConfig();
  return {
    name: c.SIG_NAME ?? c.DEFAULT_FROM_NAME ?? '',
    title: c.SIG_TITLE ?? '',
    company: c.SIG_COMPANY ?? '',
    phone: c.SIG_PHONE ?? '',
    email: c.SIG_EMAIL ?? c.DEFAULT_FROM_EMAIL ?? '',
    website: c.SIG_WEBSITE ?? '',
    logoUrl: c.SIG_LOGO_URL ?? '',
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildFooter(sig: SignatureData): string {
  const lines: string[] = [];
  if (sig.name) lines.push(`<strong>${escapeHtml(sig.name)}</strong>`);
  if (sig.title) lines.push(escapeHtml(sig.title));
  if (sig.company) lines.push(escapeHtml(sig.company));
  if (sig.phone) lines.push(`Phone: ${escapeHtml(sig.phone)}`);
  if (sig.email) lines.push(`Email: <a href="mailto:${escapeHtml(sig.email)}" style="color: #2563eb;">${escapeHtml(sig.email)}</a>`);
  if (sig.website) {
    const url = sig.website.startsWith('http') ? sig.website : `https://${sig.website}`;
    lines.push(`Website: <a href="${escapeHtml(url)}" style="color: #2563eb;">${escapeHtml(sig.website)}</a>`);
  }
  if (lines.length === 0) return '';
  return `<table role="presentation" style="width: 100%; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
<tr><td style="font-size: 13px; color: #6b7280; line-height: 1.8;">
${lines.join('<br>')}
</td></tr>
</table>`;
}

function buildHeader(sig: SignatureData): string {
  if (!sig.logoUrl && !sig.company) return '';
  const logo = sig.logoUrl
    ? `<img src="${escapeHtml(sig.logoUrl)}" alt="${escapeHtml(sig.company || 'Logo')}" style="max-height: 60px; width: auto; margin-bottom: 16px; display: block;">`
    : '';
  const company = sig.company
    ? `<div style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 4px;">${escapeHtml(sig.company)}</div>`
    : '';
  return `<table role="presentation" style="width: 100%; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
<tr><td>
${logo}${company}
</td></tr>
</table>`;
}

function buildBanner(sig: SignatureData): string {
  const bg = '#2563eb';
  const logo = sig.logoUrl
    ? `<img src="${escapeHtml(sig.logoUrl)}" alt="${escapeHtml(sig.company || 'Logo')}" style="max-height: 40px; width: auto; display: block;">`
    : '';
  const company = sig.company
    ? `<div style="font-size: 22px; font-weight: 700; color: #fff;">${escapeHtml(sig.company)}</div>`
    : '';
  return `<table role="presentation" style="width: 100%; background: ${bg}; border-radius: 8px; margin-bottom: 24px;">
<tr><td style="padding: 24px 32px; text-align: center;">
${logo}${company}
</td></tr>
</table>`;
}

export function applyTemplate(content: string, templateId: TemplateId): string {
  if (templateId === 'none') return content;
  const sig = getSignature();

  if (templateId === 'minimal') {
    return `${content}${buildFooter(sig)}`;
  }

  if (templateId === 'business') {
    return `${buildHeader(sig)}${content}${buildFooter(sig)}`;
  }

  if (templateId === 'newsletter') {
    return `${buildBanner(sig)}${content}${buildFooter(sig)}`;
  }

  return content;
}

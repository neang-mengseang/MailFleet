import fs from 'fs';
import path from 'path';
import os from 'os';

export interface MailFleetConfig {
  BREVO_API_KEY?: string;
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  SENDPULSE_CLIENT_ID?: string;
  SENDPULSE_CLIENT_SECRET?: string;
  DEFAULT_FROM_EMAIL?: string;
  DEFAULT_FROM_NAME?: string;
  DEFAULT_PROVIDER?: string;
  IMGBB_API_KEY?: string;
  SIG_NAME?: string;
  SIG_TITLE?: string;
  SIG_PHONE?: string;
  SIG_EMAIL?: string;
  SIG_WEBSITE?: string;
  SIG_LOGO_URL?: string;
  SIG_COMPANY?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.mailfleet');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

let cachedConfig: MailFleetConfig | null = null;

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfig(): MailFleetConfig {
  if (cachedConfig) return cachedConfig;
  if (!fs.existsSync(CONFIG_FILE)) {
    cachedConfig = {};
    return cachedConfig;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    cachedConfig = parsed as MailFleetConfig ?? {};
  } catch {
    cachedConfig = {};
  }
  return cachedConfig;
}

export function saveConfig(updates: Partial<MailFleetConfig>): void {
  const current = getConfig();
  const next = { ...current, ...updates };
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  cachedConfig = next;
}

export function deleteConfigKeys(keys: string[]): void {
  const current = getConfig();
  const next = { ...current };
  for (const k of keys) delete (next as any)[k];
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  cachedConfig = next;
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE);
  cachedConfig = {};
}

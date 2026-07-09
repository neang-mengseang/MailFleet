import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api, ProviderInfo } from '../api';

const FIELDS_BY_PROVIDER: Record<string, { key: string; label: string; secret: boolean }[]> = {
  brevo: [{ key: 'BREVO_API_KEY', label: 'API Key', secret: true }],
  resend: [{ key: 'RESEND_API_KEY', label: 'API Key', secret: true }],
  sendgrid: [{ key: 'SENDGRID_API_KEY', label: 'API Key', secret: true }],
  mailgun: [
    { key: 'MAILGUN_API_KEY', label: 'API Key', secret: true },
    { key: 'MAILGUN_DOMAIN', label: 'Domain (e.g. mg.example.com)', secret: false },
  ],
  sendpulse: [
    { key: 'SENDPULSE_CLIENT_ID', label: 'Client ID', secret: false },
    { key: 'SENDPULSE_CLIENT_SECRET', label: 'Client Secret', secret: true },
  ],
};

const DEFAULTS = [
  { key: 'DEFAULT_FROM_EMAIL', label: 'Default From Email', secret: false },
  { key: 'DEFAULT_FROM_NAME', label: 'Default From Name', secret: false },
  { key: 'DEFAULT_PROVIDER', label: 'Default Provider', secret: false },
];

const STORAGE_FIELDS: { key: string; label: string; secret: boolean }[] = [
  { key: 'IMGBB_API_KEY', label: 'ImgBB API Key', secret: true },
];

const SIGNATURE_FIELDS: { key: string; label: string; secret: boolean }[] = [
  { key: 'SIG_COMPANY', label: 'Company Name', secret: false },
  { key: 'SIG_LOGO_URL', label: 'Logo URL (hosted image)', secret: false },
  { key: 'SIG_NAME', label: 'Your Name', secret: false },
  { key: 'SIG_TITLE', label: 'Your Title', secret: false },
  { key: 'SIG_PHONE', label: 'Phone', secret: false },
  { key: 'SIG_EMAIL', label: 'Email', secret: false },
  { key: 'SIG_WEBSITE', label: 'Website', secret: false },
];

export default function SettingsPage({ providers }: { providers: ProviderInfo[] }) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getConfig().then(c => { setConfig(c); setEdited({}); });
  }, []);

  const handleSave = async () => {
    const updates: Record<string, string> = {};
    for (const [k, v] of Object.entries(edited)) {
      if (v !== '') updates[k] = v;
    }
    if (Object.keys(updates).length > 0) {
      await api.saveConfig(updates);
      setConfig({ ...config, ...updates });
      setEdited({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const getValue = (key: string) => edited[key] ?? config[key] ?? '';
  const isEdited = (key: string) => key in edited;

  const renderField = (field: { key: string; label: string; secret: boolean }) => (
    <div className="form-group" key={field.key}>
      <label>{field.label} <code style={{ color: 'var(--text-dim)' }}>{field.key}</code></label>
      <input
        className="input"
        type={field.secret ? 'password' : 'text'}
        value={getValue(field.key)}
        placeholder={config[field.key] && field.secret ? '**** (set, type to replace)' : ''}
        onChange={e => setEdited({ ...edited, [field.key]: e.target.value })}
        style={isEdited(field.key) ? { borderColor: 'var(--primary)' } : {}}
      />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Settings</h1>
          <p>Configure email providers and defaults</p>
        </div>
        <button className="btn primary" onClick={handleSave}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      {saved && <div className="toast success">Settings saved.</div>}

      <div className="panel">
        <div className="panel-title">Default Settings</div>
        <div className="config-grid">
          {DEFAULTS.map(renderField)}
        </div>
      </div>

      {providers.map(p => (
        <div className="panel" key={p.id}>
          <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {p.name}
            <span className={`badge ${p.configured ? 'success' : 'neutral'}`}>
              {p.configured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <div className="config-grid">
            {(FIELDS_BY_PROVIDER[p.id] ?? []).map(renderField)}
          </div>
        </div>
      ))}

      <div className="panel">
        <div className="panel-title">Email Signature & Template Info</div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
          Used by email templates (Business, Newsletter) to add headers and footers to your emails.
          Fill in what you want shown. Leave blank to skip.
        </p>
        <div className="config-grid">
          {SIGNATURE_FIELDS.map(renderField)}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Image Storage (ImgBB)
          <span className={`badge ${config.IMGBB_API_KEY ? 'success' : 'neutral'}`}>
            {config.IMGBB_API_KEY ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 16 }}>
          When configured, images in emails are uploaded to ImgBB and embedded as URLs instead of base64.
          This keeps email size small. Get a free API key at <a href="https://api.imgbb.com/" target="_blank" rel="noopener" style={{ color: 'var(--primary)' }}>api.imgbb.com</a>.
          If not configured, images fall back to inline base64.
        </p>
        <div className="config-grid">
          {STORAGE_FIELDS.map(renderField)}
        </div>
      </div>
    </div>
  );
}

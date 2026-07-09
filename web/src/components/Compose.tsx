import { useState, useEffect, useCallback } from 'react';
import { Eye, Send, Users, FileText, Layout } from 'lucide-react';
import { api, ProviderInfo, ContactFile } from '../api';
import RichEditor, { Attachment } from './RichEditor';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
}

export default function Compose({ providers }: { providers: ProviderInfo[] }) {
  const configuredProviders = providers.filter(p => p.configured);
  const [provider, setProvider] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('<p>Write your email here...</p>');
  const [recipientsText, setRecipientsText] = useState('name,email\nAlice,alice@example.com\nBob,bob@example.com');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  const [contactLists, setContactLists] = useState<ContactFile[]>([]);
  const [selectedContactList, setSelectedContactList] = useState('');
  const [recipientMode, setRecipientMode] = useState<'preset' | 'paste'>('paste');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('none');

  useEffect(() => {
    api.getContacts().then(setContactLists).catch(() => {});
    api.getEmailTemplates().then(setEmailTemplates).catch(() => {});
  }, []);

  const handleEditorChange = useCallback((html: string) => {
    setHtmlContent(html);
  }, []);

  const handleAttachmentsChange = useCallback((atts: Attachment[]) => {
    setAttachments(atts);
  }, []);

  const handlePreview = async () => {
    try {
      const recipients = await getRecipients();
      const first = recipients[0] ?? {};
      const res = await api.previewWithTemplate(htmlContent, subject, first, selectedTemplate);
      setPreviewHtml(res.html);
      setShowPreview(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const getRecipients = async (): Promise<Record<string, any>[]> => {
    if (recipientMode === 'preset' && selectedContactList) {
      const detail = await api.getContact(selectedContactList);
      return parseRecipients(detail.content);
    }
    return parseRecipients(recipientsText);
  };

  const handleSend = async () => {
    setError('');
    setProgress([]);
    setSummary(null);
    if (!provider) { setError('Select a provider'); return; }
    if (!fromEmail) { setError('From email is required'); return; }
    if (!subject) { setError('Subject is required'); return; }

    setSending(true);
    try {
      const recipients = await getRecipients();
      if (recipients.length === 0) {
        setError('No recipients found.');
        setSending(false);
        return;
      }
      const payload: any = {
        provider,
        htmlContent,
        subject,
        fromEmail,
        fromName,
        dryRun: false,
        batchSize: 50,
        delayMs: 100,
        attachments: attachments.length > 0 ? attachments : undefined,
        templateId: selectedTemplate,
      };
      if (recipientMode === 'preset' && selectedContactList) {
        payload.contactList = selectedContactList;
      } else {
        payload.recipients = recipients;
      }
      const res = await api.send(payload);
      setSummary(res);
      setProgress([
        `Sent: ${res.sent}/${res.total}`,
        `Failed: ${res.failed}`,
        ...res.results.filter((r: any) => !r.result.success).map((r: any) => `FAIL ${r.recipient.email}: ${r.result.error}`),
      ]);
    } catch (e: any) {
      setError(e.message);
    }
    setSending(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Compose</h1>
        <p>Write a rich email and send to your recipients</p>
      </div>

      {error && <div className="toast error">{error}</div>}

      <div className="panel">
        <div className="panel-title">Send Configuration</div>
        <div className="form-row">
          <div className="form-group">
            <label>Provider</label>
            <select className="select" value={provider} onChange={e => setProvider(e.target.value)}>
              <option value="">Select provider...</option>
              {configuredProviders.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>From Email</label>
            <input className="input" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>From Name</label>
            <input className="input" value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Your Name" />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Hello {{name}}" />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><Layout size={16} style={{ display: 'inline', marginRight: 6 }} /> Email Template</div>
        <div className="form-group">
          <label>Wrap your email with a template (header/footer)</label>
          <select className="select" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
            {emailTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name} — {t.description}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Email Body</div>
        <RichEditor
          value={htmlContent}
          onChange={handleEditorChange}
          onAttachmentsChange={handleAttachmentsChange}
        />
      </div>

      <div className="panel">
        <div className="panel-title">Recipients</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${recipientMode === 'preset' ? 'primary' : ''}`}
            onClick={() => setRecipientMode('preset')}
          >
            <Users size={16} /> Contact List
          </button>
          <button
            className={`btn ${recipientMode === 'paste' ? 'primary' : ''}`}
            onClick={() => setRecipientMode('paste')}
          >
            <FileText size={16} /> Paste CSV
          </button>
        </div>

        {recipientMode === 'preset' ? (
          <div className="form-group">
            <label>Select a saved contact list</label>
            {contactLists.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                No contact lists saved. Go to the Contacts page to upload one, or switch to Paste CSV.
              </div>
            ) : (
              <>
                <select
                  className="select"
                  value={selectedContactList}
                  onChange={e => setSelectedContactList(e.target.value)}
                >
                  <option value="">Select a contact list...</option>
                  {contactLists.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count} recipients, {c.filename})
                    </option>
                  ))}
                </select>
                {selectedContactList && (
                  <div style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 13 }}>
                    {contactLists.find(c => c.name === selectedContactList)?.count} recipients will receive this email.
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="form-group">
            <label>Recipients (CSV format)</label>
            <textarea
              className="textarea"
              rows={6}
              value={recipientsText}
              onChange={e => setRecipientsText(e.target.value)}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button className="btn" onClick={handlePreview} disabled={sending}>
          <Eye size={16} /> Preview
        </button>
        <button className="btn primary" onClick={handleSend} disabled={sending}>
          <Send size={16} /> {sending ? 'Sending...' : 'Send'}
        </button>
      </div>

      {showPreview && previewHtml && (
        <div className="panel">
          <div className="panel-title">Preview</div>
          <iframe className="preview-frame" srcDoc={previewHtml} title="Email Preview" />
        </div>
      )}

      {progress.length > 0 && (
        <div className="panel">
          <div className="panel-title">Results</div>
          <div className="send-progress">
            {progress.map((line, i) => (
              <div key={i} className={`line ${line.startsWith('FAIL') ? 'fail' : 'ok'}`}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseRecipients(csv: string): Record<string, any>[] {
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => obj[h] = values[i] ?? '');
    if (!obj.name && obj.email) obj.name = obj.email.split('@')[0];
    return obj;
  });
}

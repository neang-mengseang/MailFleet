import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye } from 'lucide-react';
import { api, Template } from '../api';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [mdContent, setMdContent] = useState('# Hello {{name}}\n\n...');
  const [previewHtml, setPreviewHtml] = useState('');

  const load = () => api.getTemplates().then(setTemplates);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name || !subject || !mdContent) return;
    await api.saveTemplate(name, subject, mdContent);
    setShowForm(false);
    setName(''); setSubject(''); setMdContent('# Hello {{name}}\n\n...');
    load();
  };

  const handleDelete = async (n: string) => {
    await api.deleteTemplate(n);
    load();
  };

  const handlePreview = async (t: Template) => {
    setPreview(t);
    const res = await api.preview(t.md_content, t.subject, { name: 'Sample' });
    setPreviewHtml(res.html);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Templates</h1>
          <p>Saved markdown email templates</p>
        </div>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Template
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">New Template</div>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="welcome-email" />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Welcome {{name}}!" />
            </div>
          </div>
          <div className="form-group">
            <label>Markdown Body</label>
            <textarea className="textarea" rows={10} value={mdContent} onChange={e => setMdContent(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !showForm ? (
        <div className="empty-state">No templates saved yet.</div>
      ) : (
        templates.map(t => (
          <div key={t.id} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{t.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t.subject}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 4 }}>Updated: {t.updated_at}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => handlePreview(t)}><Eye size={16} /> Preview</button>
              <button className="btn danger" onClick={() => handleDelete(t.name)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))
      )}

      {preview && previewHtml && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="modal-title">Preview: {preview.name}</div>
              <button className="btn" onClick={() => setPreview(null)}>Close</button>
            </div>
            <iframe className="preview-frame" srcDoc={previewHtml} title="Preview" style={{ minHeight: 400 }} />
          </div>
        </div>
      )}
    </div>
  );
}

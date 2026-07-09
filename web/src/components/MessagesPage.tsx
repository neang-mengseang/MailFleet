import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, MessageSquare } from 'lucide-react';
import { api, MessageFile } from '../api';

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<{ name: string; content: string } | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [name, setName] = useState('');
  const [content, setContent] = useState('# Hello {{name}}\n\nWrite your email here in Markdown.\n');

  const load = () => api.getMessages().then(setMessages);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!name || !content) return;
    await api.saveMessage(name, content);
    setShowForm(false);
    setName(''); setContent('# Hello {{name}}\n\nWrite your email here in Markdown.\n');
    load();
  };

  const handleDelete = async (n: string) => {
    await api.deleteMessage(n);
    load();
  };

  const handleView = async (n: string) => {
    const detail = await api.getMessage(n);
    setViewing(detail);
    const res = await api.preview(detail.content, 'Preview', { name: 'Sample' });
    setPreviewHtml(res.html);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Messages</h1>
          <p>Email templates in ./mailfleet/messages/</p>
        </div>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Message
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">New Message Template</div>
          <div className="form-group">
            <label>Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="welcome-email" />
          </div>
          <div className="form-group">
            <label>Markdown Content</label>
            <textarea className="textarea" rows={12} value={content} onChange={e => setContent(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      {messages.length === 0 && !showForm ? (
        <div className="empty-state">
          <MessageSquare size={48} className="icon" />
          <p>No message templates yet. Create one or add a file with <code>mailfleet messages add &lt;file&gt;</code></p>
        </div>
      ) : (
        messages.map(m => (
          <div key={m.name} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.preview}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn" onClick={() => handleView(m.name)}><Eye size={16} /> View</button>
              <button className="btn danger" onClick={() => handleDelete(m.name)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="modal-title">{viewing.name}</div>
              <button className="btn" onClick={() => setViewing(null)}>Close</button>
            </div>
            <iframe className="preview-frame" srcDoc={previewHtml} title="Preview" style={{ minHeight: 400 }} />
          </div>
        </div>
      )}
    </div>
  );
}

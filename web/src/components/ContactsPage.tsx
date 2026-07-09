import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Eye, Users, Upload, FileText } from 'lucide-react';
import { api, ContactFile } from '../api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<{ name: string; content: string } | null>(null);
  const [name, setName] = useState('');
  const [ext, setExt] = useState('.csv');
  const [content, setContent] = useState('name,email\nAlice,alice@example.com\n');
  const [uploadMode, setUploadMode] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.getContacts().then(setContacts);
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!content) return;
    const finalName = name || autoDetectName();
    if (!finalName) {
      alert('Please enter a name or upload a file.');
      return;
    }
    await api.saveContact(finalName, content, ext);
    setShowForm(false);
    setName(''); setContent('name,email\nAlice,alice@example.com\n');
    load();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setContent(text);
      const fileExt = file.name.substring(file.name.lastIndexOf('.')) || '.csv';
      setExt(fileExt.toLowerCase());
      if (!name) {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        setName(baseName);
      }
    };
    reader.readAsText(file);
  };

  const autoDetectName = (): string => {
    return name || `contacts-${Date.now()}`;
  };

  const handleDelete = async (n: string) => {
    await api.deleteContact(n);
    load();
  };

  const handleView = async (n: string) => {
    const detail = await api.getContact(n);
    setViewing(detail);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Contacts</h1>
          <p>Contact lists in ./mailfleet/contacts/</p>
        </div>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> New Contact List
        </button>
      </div>

      {showForm && (
        <div className="panel">
          <div className="panel-title">New Contact List</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              className={`btn ${uploadMode ? 'primary' : ''}`}
              onClick={() => setUploadMode(true)}
            >
              <Upload size={16} /> Upload File
            </button>
            <button
              className={`btn ${!uploadMode ? 'primary' : ''}`}
              onClick={() => setUploadMode(false)}
            >
              <FileText size={16} /> Paste Content
            </button>
          </div>

          <div className="form-group">
            <label>Name (optional, auto-fills from file name)</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="newsletter-subscribers"
            />
          </div>

          {uploadMode ? (
            <div className="form-group">
              <label>Upload CSV, JSON, or TXT file</label>
              <div
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} />
                <p>Click to select a file</p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Supports .xlsx, .xls, .csv, .json, .txt (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.txt,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              {content && uploadMode && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge success">File loaded</span>
                  <button
                    className="btn"
                    style={{ marginLeft: 8, padding: '2px 10px', fontSize: 12 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Format</label>
                <select className="select" value={ext} onChange={e => setExt(e.target.value)}>
                  <option value=".csv">CSV</option>
                  <option value=".json">JSON</option>
                  <option value=".txt">TXT (email only)</option>
                  <option value=".xlsx">Excel (XLSX)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  className="textarea"
                  rows={10}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button className="btn" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !showForm ? (
        <div className="empty-state">
          <Users size={48} className="icon" />
          <p>No contact lists yet. Create one or add a file with <code>mailfleet contacts add &lt;file&gt;</code></p>
        </div>
      ) : (
        contacts.map(c => (
          <div key={c.name} className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                {c.count} recipients &middot; {c.filename}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => handleView(c.name)}><Eye size={16} /> View</button>
              <button className="btn danger" onClick={() => handleDelete(c.name)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))
      )}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="modal-title">{viewing.name}</div>
              <button className="btn" onClick={() => setViewing(null)}>Close</button>
            </div>
            <pre style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, maxHeight: 400 }}>
{viewing.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api, Batch, SendRow } from '../api';
import { X, Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SentHistory() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selected, setSelected] = useState<{ batch: Batch; sends: SendRow[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBatches().then(b => {
      setBatches(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openBatch = async (id: string) => {
    const detail = await api.getBatch(id);
    setSelected(detail);
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Send History</h1>
        <p>All bulk send batches</p>
      </div>

      {batches.length === 0 ? (
        <div className="empty-state">No batches sent yet.</div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Provider</th>
                <th>Subject</th>
                <th>Sent / Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} onClick={() => openBatch(b.id)} style={{ cursor: 'pointer' }}>
                  <td>{b.created_at.replace('T', ' ').slice(0, 19)}</td>
                  <td>{b.provider}</td>
                  <td>{b.subject.slice(0, 50)}</td>
                  <td>{b.sent} / {b.total}</td>
                  <td>
                    <span className={`badge ${b.status === 'completed' ? 'success' : 'warning'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div className="modal-title">Batch Details</div>
              <button className="btn" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            <div className="panel" style={{ marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Mail size={16} style={{ color: 'var(--primary)' }} />
                    <strong>Subject:</strong>
                  </div>
                  <div style={{ marginLeft: 24, marginBottom: 12 }}>{selected.batch.subject}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Clock size={16} style={{ color: 'var(--primary)' }} />
                    <strong>Date:</strong>
                  </div>
                  <div style={{ marginLeft: 24, marginBottom: 12 }}>{selected.batch.created_at.replace('T', ' ').slice(0, 19)}</div>
                </div>
                <div>
                  <strong>Provider:</strong>
                  <div style={{ marginTop: 4 }}>{selected.batch.provider}</div>
                </div>
                <div>
                  <strong>From:</strong>
                  <div style={{ marginTop: 4 }}>
                    {selected.batch.from_name ? selected.batch.from_name + ' ' : ''}
                    &lt;{selected.batch.from_email}&gt;
                  </div>
                </div>
                <div>
                  <strong>Tags:</strong>
                  <div style={{ marginTop: 4 }}>{selected.batch.tags || 'None'}</div>
                </div>
                <div>
                  <strong>Status:</strong>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge ${selected.batch.status === 'completed' ? 'success' : 'warning'}`}>
                      {selected.batch.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: 24, 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '1px solid var(--border)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{selected.batch.sent}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sent</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={20} style={{ color: 'var(--danger)' }} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{selected.batch.failed}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Failed</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={20} style={{ color: 'var(--primary)' }} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{selected.batch.total}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Total</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel-title" style={{ marginBottom: 12 }}>Recipient Details</div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Message ID</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.sends.map(s => (
                    <tr key={s.id}>
                      <td>{s.recipient_email}</td>
                      <td>{s.recipient_name || '-'}</td>
                      <td>
                        <span className={`badge ${s.success ? 'success' : 'danger'}`}>
                          {s.success ? 'Sent' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {s.message_id || '-'}
                      </td>
                      <td style={{ maxWidth: 200, wordBreak: 'break-word' }}>
                        {s.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

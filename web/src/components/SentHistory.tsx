import { useState, useEffect } from 'react';
import { api, Batch, SendRow } from '../api';
import { X } from 'lucide-react';

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
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="modal-title">Batch Details</div>
              <button className="btn" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Subject:</strong> {selected.batch.subject}<br />
              <strong>Provider:</strong> {selected.batch.provider}<br />
              <strong>From:</strong> {selected.batch.from_name ? selected.batch.from_name + ' ' : ''}&lt;{selected.batch.from_email}&gt;<br />
              <strong>Date:</strong> {selected.batch.created_at}<br />
              <strong>Sent:</strong> {selected.batch.sent} / {selected.batch.total} (Failed: {selected.batch.failed})
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {selected.sends.map(s => (
                  <tr key={s.id}>
                    <td>{s.recipient_email}</td>
                    <td>
                      <span className={`badge ${s.success ? 'success' : 'danger'}`}>
                        {s.success ? 'Sent' : 'Failed'}
                      </span>
                    </td>
                    <td>{s.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

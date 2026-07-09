import { Inbox, CheckCircle, XCircle, Users, Mail } from 'lucide-react';
import { Stats, ProviderInfo } from '../api';

export default function Dashboard({ stats, providers }: { stats: Stats | null; providers: ProviderInfo[] }) {
  if (!stats) return <div className="empty-state">Loading...</div>;

  const cards = [
    { label: 'Total Batches', value: stats.total_batches, icon: Inbox, color: '' },
    { label: 'Emails Sent', value: stats.total_sent, icon: CheckCircle, color: 'success' },
    { label: 'Failed', value: stats.total_failed, icon: XCircle, color: 'danger' },
    { label: 'Total Recipients', value: stats.total_recipients, icon: Users, color: '' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your bulk email campaigns</p>
      </div>

      <div className="cards-grid">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="stat-card">
              <div className="label">{c.label}</div>
              <div className={`value ${c.color}`}>
                <Icon size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                {c.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-title">Email Providers</div>
        {providers.map(p => (
          <div key={p.id} className="provider-row">
            <div>
              <div className="name">{p.name}</div>
              <div className="id">{p.id}</div>
            </div>
            <span className={`badge ${p.configured ? 'success' : 'neutral'}`}>
              {p.configured ? 'Configured' : 'Not configured'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

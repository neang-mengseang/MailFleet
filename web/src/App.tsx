import { useState, useEffect } from 'react';
import { LayoutDashboard, Send, History, FileText, Settings, Mail, Users, MessageSquare } from 'lucide-react';
import { api, Stats, ProviderInfo } from './api';
import Dashboard from './components/Dashboard';
import Compose from './components/Compose';
import SentHistory from './components/SentHistory';
import Templates from './components/Templates';
import SettingsPage from './components/SettingsPage';
import ContactsPage from './components/ContactsPage';
import MessagesPage from './components/MessagesPage';

type View = 'dashboard' | 'compose' | 'history' | 'templates' | 'settings' | 'contacts' | 'messages';

const NAV: { id: View; label: string; icon: typeof Mail }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'compose', label: 'Compose', icon: Send },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'history', label: 'History', icon: History },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getProviders().then(setProviders).catch(() => {});
  }, [view]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Mail size={22} />
          MailFleet
        </div>
        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </div>
          );
        })}
      </aside>
      <main className="main">
        {view === 'dashboard' && <Dashboard stats={stats} providers={providers} />}
        {view === 'compose' && <Compose providers={providers} />}
        {view === 'messages' && <MessagesPage />}
        {view === 'contacts' && <ContactsPage />}
        {view === 'history' && <SentHistory />}
        {view === 'templates' && <Templates />}
        {view === 'settings' && <SettingsPage providers={providers} />}
      </main>
    </div>
  );
}

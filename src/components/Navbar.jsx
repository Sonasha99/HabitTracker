import React, { useState } from 'react';
import { LayoutDashboard, Calendar, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history',   label: 'Progress' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings',  label: 'Settings' },
];

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [open, setOpen] = useState(false);

  const initials = (name = '') =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'HF';

  return (
    <header style={{ borderBottom: '1px solid #1F1F1F', backgroundColor: '#0A0A0A', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

        <span style={{ fontWeight: 800, fontSize: '16px', color: '#F5F5F5', letterSpacing: '-0.3px', flexShrink: 0 }}>
          Habit Tracker
        </span>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                backgroundColor: activeTab === id ? '#1C1C1C' : 'transparent',
                color: activeTab === id ? '#FFFFFF' : '#737373',
                outline: activeTab === id ? '1px solid #2A2A2A' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.color = '#D4D4D4'; }}
              onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.color = '#737373'; }}
            >
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '20px', padding: '5px 12px 5px 6px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#2A2A2A', color: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
              {initials(user?.name)}
            </div>
            <span style={{ fontSize: '12px', color: '#D4D4D4', fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </span>
            <ChevronDown size={12} style={{ color: '#737373' }} />
          </button>

          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
              <div style={{ position: 'absolute', right: 0, top: '38px', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '8px', minWidth: '180px', zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #1F1F1F', marginBottom: '6px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>{user?.name}</p>
                  <p style={{ fontSize: '11px', color: '#737373', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onLogout(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#A3A3A3', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#171717'; e.currentTarget.style.color = '#F5F5F5'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#A3A3A3'; }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

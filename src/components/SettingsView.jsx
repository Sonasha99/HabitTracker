import React, { useState } from 'react';
import { User, Trash2, Shield, LogOut, Info } from 'lucide-react';

export default function SettingsView({ user, onLogout }) {
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [message, setMessage] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = { ...user, name };
    localStorage.setItem('habitforge_user', JSON.stringify(updated));
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear local cached data?')) {
      localStorage.removeItem('habitforge_token');
      localStorage.removeItem('habitforge_user');
      window.location.reload();
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: '640px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F5F5', margin: 0, letterSpacing: '-0.3px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>
          Manage your account profile and preferences
        </p>
      </div>

      {message && (
        <div style={{ backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '12px 16px', color: '#F5F5F5', fontSize: '13px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={18} style={{ color: '#A3A3A3' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>Account Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={email}
              style={{ width: '100%', backgroundColor: '#171717', border: '1px solid #1F1F1F', borderRadius: '8px', color: '#737373', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', cursor: 'not-allowed' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="submit"
              style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Info size={18} style={{ color: '#A3A3A3' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>Application Info</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#A3A3A3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Application</span><b style={{ color: '#F5F5F5' }}>Habit Tracker</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Product</span><b style={{ color: '#F5F5F5' }}>Product by Sonasha</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Contact Support</span><b style={{ color: '#F5F5F5' }}>connectsonasha@gmail.com</b>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Shield size={18} style={{ color: '#A3A3A3' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F5F5F5', margin: 0 }}>Account Actions</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleClearData}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#D4D4D4', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            <Trash2 size={14} /> Clear Cache & Local Data
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

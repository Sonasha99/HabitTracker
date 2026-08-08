import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';
import { LogIn, UserPlus, Lock, Mail, User, AlertCircle } from 'lucide-react';

const inp = {
  width: '100%', backgroundColor: '#171717', border: '1px solid #2A2A2A',
  color: '#F5F5F5', fontSize: '13px', borderRadius: '8px',
  padding: '10px 12px 10px 36px', outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.15s ease',
};

export default function LoginView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'register'
        ? await registerUser(name, email, password)
        : await loginUser(email, password);
      localStorage.setItem('habitforge_token', res.token);
      localStorage.setItem('habitforge_user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switch_ = (m) => { setMode(m); setError(''); setName(''); setEmail(''); setPassword(''); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#F5F5F5', letterSpacing: '-0.5px', margin: 0 }}>Habit Tracker</h1>
        <p style={{ fontSize: '13px', color: '#737373', marginTop: '8px' }}>Track your habits. Be 1% better every day.</p>
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px' }}>
        <div style={{ display: 'flex', backgroundColor: '#171717', border: '1px solid #1F1F1F', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
          {[['login', <LogIn size={13} />, 'Sign In'], ['register', <UserPlus size={13} />, 'Create Account']].map(([m, icon, label]) => (
            <button key={m} type="button" onClick={() => switch_(m)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', backgroundColor: mode === m ? '#2A2A2A' : 'transparent', color: mode === m ? '#FFFFFF' : '#737373', transition: 'all 0.15s' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5F5F5' }}>
            <AlertCircle size={14} style={{ color: '#A3A3A3', flexShrink: 0 }} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }}><User size={15} /></div>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp}
                onFocus={e => e.target.style.borderColor = '#737373'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }}><Mail size={15} /></div>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={inp}
              onFocus={e => e.target.style.borderColor = '#737373'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#525252', pointerEvents: 'none' }}><Lock size={15} /></div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" style={inp}
              onFocus={e => e.target.style.borderColor = '#737373'} onBlur={e => e.target.style.borderColor = '#2A2A2A'} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '8px', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
            {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '12px', color: '#525252' }}>
          Contact: <a href="mailto:connectsonasha@gmail.com" style={{ color: '#A3A3A3', textDecoration: 'none' }}>connectsonasha@gmail.com</a>
        </p>
        <p style={{ fontSize: '11px', color: '#404040' }}>Product by Sonasha</p>
      </div>
    </div>
  );
}

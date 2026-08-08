import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import LandingPage from './components/LandingPage';
import { fetchHabits } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('habitforge_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    async function initData() {
      if (currentUser) {
        const data = await fetchHabits();
        if (Array.isArray(data)) setHabits(data);
      }
    }
    initData();
  }, [currentUser]);

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    const data = await fetchHabits();
    if (Array.isArray(data)) setHabits(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('habitforge_token');
    localStorage.removeItem('habitforge_user');
    setCurrentUser(null);
    setHabits([]);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#D4D4D4', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'dashboard' && (
          <DashboardView userName={currentUser.name} />
        )}

        {activeTab === 'history' && (
          <HistoryView habits={habits} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView habits={habits} />
        )}

        {activeTab === 'settings' && (
          <SettingsView user={currentUser} onLogout={handleLogout} />
        )}
      </main>
    </div>
  );
}

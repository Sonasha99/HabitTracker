const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function headers() {
  const token = localStorage.getItem('habitforge_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const today = () => new Date().toISOString().split('T')[0];
const monthStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export async function fetchHealthStatus() {
  try { return await (await fetch(`${API_BASE}/health`)).json(); }
  catch { return { status: 'offline', database: 'Offline' }; }
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: headers(), body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: headers(), body: JSON.stringify({ name, email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function fetchHabits() {
  try {
    const res = await fetch(`${API_BASE}/habits`, { headers: headers() });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function createHabit({ title, targetDays }) {
  try {
    const res = await fetch(`${API_BASE}/habits`, { method: 'POST', headers: headers(), body: JSON.stringify({ title, targetDays }) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function deleteHabitApi(id) {
  try {
    await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE', headers: headers() });
  } catch {}
}

export async function fetchMonthlyHabitGrid(month = monthStr()) {
  try {
    const res = await fetch(`${API_BASE}/habit-logs/monthly?month=${month}`, { headers: headers() });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function toggleHabitLog(habitId, date = today()) {
  try {
    const res = await fetch(`${API_BASE}/habit-logs/toggle`, { method: 'POST', headers: headers(), body: JSON.stringify({ habitId, date }) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function saveSleepForDate(date = today(), hours) {
  try {
    const res = await fetch(`${API_BASE}/sleep`, { method: 'POST', headers: headers(), body: JSON.stringify({ date, hours: parseFloat(hours) }) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

export async function fetchMonthlySleep(month = monthStr()) {
  try {
    const res = await fetch(`${API_BASE}/sleep/monthly?month=${month}`, { headers: headers() });
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

export async function fetchAnalyticsAll() {
  try {
    const res = await fetch(`${API_BASE}/analytics/all`, { headers: headers() });
    if (!res.ok) return { habits: [], habitLogs: [], sleepLogs: [] };
    return await res.json();
  } catch {
    return { habits: [], habitLogs: [], sleepLogs: [] };
  }
}

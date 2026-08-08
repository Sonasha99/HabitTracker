import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, isUsingNeon } from './db/index.js';
import { users, habits, habitLogs, sleepLogs } from './db/schema.js';
import { eq, and, like } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'habitforge_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(process.cwd(), 'server', 'data.json');

let localUsers = [];
let localHabits = [];
let localHabitLogs = {};
let localSleepLogs = {};

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      localUsers = parsed.users || [];
      localHabits = parsed.habits || [];
      localHabitLogs = parsed.habitLogs || {};
      localSleepLogs = parsed.sleepLogs || {};
    }
  } catch (err) {
    console.error('Error reading local data.json:', err);
  }
}

function saveLocalData() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = {
      users: localUsers,
      habits: localHabits,
      habitLogs: localHabitLogs,
      sleepLogs: localSleepLogs,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local data.json:', err);
  }
}

loadLocalData();

function auth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isUsingNeon ? 'Neon PostgreSQL' : 'Local (add DATABASE_URL to .env)',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const passwordHash = await bcrypt.hash(password, 10);

    if (isUsingNeon) {
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) return res.status(400).json({ error: 'Email already registered' });
      const [u] = await db.insert(users).values({ name, email, password: passwordHash }).returning();
      const token = jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({ token, user: { id: u.id, name: u.name, email: u.email } });
    }

    if (localUsers.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
    const u = { id: Date.now(), name, email, passwordHash };
    localUsers.push(u);
    saveLocalData();
    const token = jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: u.id, name: u.name, email: u.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (isUsingNeon) {
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u || !(await bcrypt.compare(password, u.password))) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: u.id, name: u.name, email: u.email } });
    }

    const u = localUsers.find(x => x.email === email);
    if (!u || !(await bcrypt.compare(password, u.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u.id, email: u.email, name: u.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: u.id, name: u.name, email: u.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/habits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    if (isUsingNeon) {
      const rows = await db.select().from(habits).where(eq(habits.userId, userId));
      return res.json(rows);
    }
    res.json(localHabits.filter(h => String(h.userId) === String(userId)));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

app.post('/api/habits', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, targetDays } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const td = parseInt(targetDays) || 30;

    if (isUsingNeon) {
      const [h] = await db.insert(habits).values({ userId, title, targetDays: td }).returning();
      return res.status(201).json(h);
    }

    const h = { id: Date.now(), userId, title, targetDays: td, createdAt: new Date().toISOString() };
    localHabits.push(h);
    saveLocalData();
    res.status(201).json(h);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

app.delete('/api/habits/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);
    if (isUsingNeon) {
      await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));
      return res.json({ success: true });
    }
    localHabits = localHabits.filter(h => !(h.id === id && String(h.userId) === String(userId)));
    saveLocalData();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

app.get('/api/habit-logs/monthly', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

    if (isUsingNeon) {
      const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));
      const logs = await db.select().from(habitLogs)
        .where(and(eq(habitLogs.userId, userId), like(habitLogs.logDate, `${month}%`)));

      const result = userHabits.map(h => {
        const habitLogs2 = logs.filter(l => l.habitId === h.id);
        const logsMap = {};
        habitLogs2.forEach(l => { logsMap[l.logDate] = l.completed; });
        return { id: h.id, title: h.title, targetDays: h.targetDays, logs: logsMap };
      });
      return res.json(result);
    }

    const userHabits = localHabits.filter(h => String(h.userId) === String(userId));
    const result = userHabits.map(h => {
      const logsMap = {};
      Object.entries(localHabitLogs).forEach(([key, val]) => {
        if (key.startsWith(`${userId}_${h.id}_${month}`)) {
          const date = key.split(`${userId}_${h.id}_`)[1];
          logsMap[date] = val;
        }
      });
      return { id: h.id, title: h.title, targetDays: h.targetDays, logs: logsMap };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch habit logs' });
  }
});

app.post('/api/habit-logs/toggle', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { habitId, date } = req.body;
    if (!habitId || !date) return res.status(400).json({ error: 'habitId and date required' });

    if (isUsingNeon) {
      const existing = await db.select().from(habitLogs)
        .where(and(eq(habitLogs.userId, userId), eq(habitLogs.habitId, habitId), eq(habitLogs.logDate, date)));

      if (existing.length > 0) {
        const newStatus = !existing[0].completed;
        await db.update(habitLogs).set({ completed: newStatus })
          .where(and(eq(habitLogs.userId, userId), eq(habitLogs.habitId, habitId), eq(habitLogs.logDate, date)));
        return res.json({ date, completed: newStatus });
      } else {
        await db.insert(habitLogs).values({ userId, habitId, logDate: date, completed: true });
        return res.json({ date, completed: true });
      }
    }

    const key = `${userId}_${habitId}_${date}`;
    const current = localHabitLogs[key] ?? false;
    localHabitLogs[key] = !current;
    saveLocalData();
    res.json({ date, completed: localHabitLogs[key] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle habit log' });
  }
});

app.post('/api/sleep', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, hours } = req.body;
    if (!date || hours === undefined) return res.status(400).json({ error: 'date and hours required' });
    const h = parseFloat(hours);

    if (isUsingNeon) {
      const existing = await db.select().from(sleepLogs).where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.logDate, date)));
      if (existing.length > 0) {
        const [updated] = await db.update(sleepLogs).set({ hours: h }).where(and(eq(sleepLogs.userId, userId), eq(sleepLogs.logDate, date))).returning();
        return res.json(updated);
      }
      const [inserted] = await db.insert(sleepLogs).values({ userId, logDate: date, hours: h }).returning();
      return res.json(inserted);
    }

    localSleepLogs[`${userId}_${date}`] = h;
    saveLocalData();
    res.json({ date, hours: h });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save sleep log' });
  }
});

app.get('/api/sleep/monthly', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'month param required (YYYY-MM)' });

    if (isUsingNeon) {
      const rows = await db.select().from(sleepLogs)
        .where(and(eq(sleepLogs.userId, userId), like(sleepLogs.logDate, `${month}%`)));
      const result = {};
      rows.forEach(r => { result[r.logDate] = r.hours; });
      return res.json(result);
    }

    const result = {};
    Object.entries(localSleepLogs).forEach(([key, val]) => {
      if (key.startsWith(`${userId}_${month}`)) {
        const date = key.split(`${userId}_`)[1];
        result[date] = val;
      }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sleep logs' });
  }
});

app.get('/api/analytics/all', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isUsingNeon) {
      const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));
      const userLogs = await db.select().from(habitLogs).where(eq(habitLogs.userId, userId));
      const userSleep = await db.select().from(sleepLogs).where(eq(sleepLogs.userId, userId));

      return res.json({
        habits: userHabits,
        habitLogs: userLogs,
        sleepLogs: userSleep,
      });
    }

    const userHabits = localHabits.filter(h => String(h.userId) === String(userId));
    const logsList = [];
    Object.entries(localHabitLogs).forEach(([key, completed]) => {
      if (key.startsWith(`${userId}_`)) {
        const parts = key.split('_');
        const habitId = parseInt(parts[1]);
        const date = parts[2];
        if (completed) {
          logsList.push({ habitId, logDate: date, completed: true });
        }
      }
    });

    const sleepList = [];
    Object.entries(localSleepLogs).forEach(([key, hours]) => {
      if (key.startsWith(`${userId}_`)) {
        const date = key.split(`${userId}_`)[1];
        sleepList.push({ logDate: date, hours });
      }
    });

    res.json({
      habits: userHabits,
      habitLogs: logsList,
      sleepLogs: sleepList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Habit Tracker Backend running on http://localhost:${PORT}`);
  console.log(`Database: ${isUsingNeon ? 'Neon PostgreSQL' : 'Local Fallback (add DATABASE_URL to .env)'}`);
});

export default app;

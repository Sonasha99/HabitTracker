# HabitTracker 🚀

> **Be 1% better every day.**  
> A high-performance, dark monochrome habit tracking application with scroll-driven animations, monthly grid views, target scoring, sleep cycle monitoring, and deep analytics.

---

## 🌟 Features

- **Scroll-Driven Frame Animation**: Smooth hero scroll animation controlled directly by user scroll position.
- **Monthly Habit Grid**: Clean grid view to log daily habits with 1-click checkmarks.
- **Target-Based Scoring**: Dynamic scoring calculated from completed targets vs. planned habits.
- **Sleep Cycle Tracking**: Log daily sleep hours and track monthly sleep consistency trends.
- **Deep Analytics & Streaks**: Active streak protection, weekday pattern analysis, and progress graphs.
- **Cloud Database Integration**: Powered by Neon PostgreSQL with automatic local JSON fallback for offline development.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, Recharts, Vanilla CSS (Dark Monochrome Theme)
- **Backend**: Node.js, Express, JWT Authentication, bcryptjs
- **Database**: Neon PostgreSQL, Drizzle ORM

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Neon PostgreSQL Database Connection URL (from https://console.neon.tech)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require

# Backend Express Server Port
PORT=3001

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
```

---

## 🚀 Quick Start (Local Development)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Push Database Schema (Neon PostgreSQL)**:
   ```bash
   npm run db:push
   ```

3. **Start Backend Server**:
   ```bash
   npm run server
   ```

4. **Start Frontend Dev Server**:
   ```bash
   npm run dev
   ```

5. Open your browser at `http://localhost:5173`.

---

## 🌐 Production Deployment

- **Backend (Render / Railway)**: Deploy `server/index.js` with `DATABASE_URL` and `JWT_SECRET` environment variables.
- **Frontend (Vercel / Netlify)**: Deploy Vite build with `VITE_API_URL` pointing to your deployed backend API URL.

---

## 📝 License & Product Info

Product built by **Sonasha**. All rights reserved.

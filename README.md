# HabitTracker
**This readme file and idea might look simple to u, but the website has the power to make you an unstoppable beast. Start your monk mode journey from now.**

## Differentiator
-A very aesthetic dark-monochrome habit tracker without any cringe emojis. 
-Track the habits you choose, monitor your sleep.
-Get a new motivation quote every day.
-See your progress through day-, week-, and month-wise analytics.

## Tech Stack

- **Frontend:** React 19, Vite, Recharts, Lucide Icons, Vanilla CSS
- **Backend:** Node.js, Express.js, JWT, bcryptjs
- **Database:** Neon PostgreSQL, Drizzle ORM

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
PORT=3001
VITE_API_URL=http://localhost:3001/api
JWT_SECRET=your_jwt_secret
````

## Quick Start

```bash
npm install
npm run db:push
npm run server
npm run dev
```

Open `http://localhost:5173`.

## Deployed  
on Vercel
* Add `DATABASE_URL`, `JWT_SECRET`, and `VITE_API_URL` to the respective environment variables.

---

**Product by Sonasha**

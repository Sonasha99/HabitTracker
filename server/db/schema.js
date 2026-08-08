import { pgTable, serial, text, varchar, boolean, timestamp, real, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Habits table — targetDays = how many days per month the user wants to do this habit
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).default('General'),
  targetDays: integer('target_days').default(30), // target days per month
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Daily habit log — one row per habit per day, stores tick status
export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  logDate: varchar('log_date', { length: 10 }).notNull(), // YYYY-MM-DD
  completed: boolean('completed').notNull().default(false),
});

// Sleep log — one row per day
export const sleepLogs = pgTable('sleep_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  logDate: varchar('log_date', { length: 10 }).notNull(), // YYYY-MM-DD
  hours: real('hours').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

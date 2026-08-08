import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { fetchMonthlyHabitGrid, toggleHabitLog, fetchMonthlySleep, saveSleepForDate, createHabit, deleteHabitApi } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const QUOTES = [
  "Small steps every day lead to big results.",
  "Small progress is still progress.",
  "Consistency beats intensity.",
  "Start before you're ready.",
  "One good day can become a good week.",
  "Discipline makes motivation unnecessary.",
  "Your future self is built by what you do today.",
  "Focus on the process, not just the outcome.",
  "Repetition is the mother of mastery.",
  "Action cures fear and builds momentum.",
  "Show up every day, even when it is hard.",
  "You do not rise to the level of your goals, you fall to the level of your systems.",
  "A year from now you will wish you had started today.",
  "Great things are done by a series of small things brought together.",
  "Do something today that your future self will thank you for.",
  "Drop by drop is the water pot filled.",
  "First we make our habits, then our habits make us.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Continuous effort, not strength or intelligence, is the key to unlocking potential.",
  "Be 1% better every day.",
  "Small habits, big transformation.",
  "What you do daily matters more than what you do occasionally.",
  "Execution over intention.",
  "Progress, not perfection.",
  "The secret of your future is hidden in your daily routine.",
  "Commitment means staying true to what you said you would do.",
  "Doubt kills more dreams than failure ever will.",
  "Mastery requires patience and daily practice.",
  "Small wins stack into monumental achievement.",
  "Don't break the chain.",
  "Your habits shape your identity.",
  "Focus on momentum.",
  "Build the discipline today that freedom demands tomorrow.",
  "Consistency creates confidence.",
  "Keep moving forward one day at a time.",
  "Small adjustments produce massive long-term results.",
  "Show up, do the work, repeat.",
  "Turn intentions into daily actions.",
  "Every checkmark is a vote for the person you want to become.",
  "Sustain the routine.",
  "Discipline is choosing between what you want now and what you want most.",
  "Keep your standards high and your execution steady.",
  "The work you put in in private will show in public.",
  "Focus on today's single step.",
  "Be patient with results, aggressive with actions.",
  "Habits are the compound interest of self-improvement.",
  "Clear your mind and execute.",
  "Success is built on quiet, consistent days.",
  "Stay true to your targets.",
  "Day by day, brick by brick"
];

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const CELL = 32;

const startOfYear = new Date(today.getFullYear(), 0, 0);
const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
const quoteIndex = Math.abs(dayOfYear) % QUOTES.length;
const dailyQuote = QUOTES[quoteIndex];

export default function DashboardView({ userName }) {
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [grid, setGrid] = useState([]);
  const [sleepLogs, setSleepLogs] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepDay, setSleepDay] = useState(null);
  const [sleepInput, setSleepInput] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDays, setNewTargetDays] = useState('30');
  const [loading, setLoading] = useState(false);

  const month = monthKey(viewDate);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const dateStr = (d) => `${month}-${String(d).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);
    const [g, s] = await Promise.all([fetchMonthlyHabitGrid(month), fetchMonthlySleep(month)]);
    setGrid(g || []);
    setSleepLogs(s || {});
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (habitId, day) => {
    const ds = dateStr(day);
    setGrid(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      return { ...h, logs: { ...h.logs, [ds]: !h.logs[ds] } };
    }));
    await toggleHabitLog(habitId, ds);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = await createHabit({ title: newTitle.trim(), targetDays: parseInt(newTargetDays) || 30 });
    if (created?.id) {
      setGrid(prev => [...prev, { ...created, logs: {} }]);
    }
    setNewTitle('');
    setShowAddModal(false);
  };

  const handleDeleteHabit = async (id) => {
    setGrid(prev => prev.filter(h => h.id !== id));
    await deleteHabitApi(id);
  };

  const openSleepModal = (day) => {
    setSleepDay(day);
    setSleepInput(sleepLogs[dateStr(day)] ?? '');
    setShowSleepModal(true);
  };

  const handleSaveSleep = async () => {
    if (!sleepDay || sleepInput === '') return;
    const ds = dateStr(sleepDay);
    const h = parseFloat(sleepInput);
    setSleepLogs(prev => ({ ...prev, [ds]: h }));
    await saveSleepForDate(ds, h);
    setShowSleepModal(false);
  };

  const habitScore = (h) => {
    const done = Object.values(h.logs || {}).filter(Boolean).length;
    if (!h.targetDays) return 0;
    return Math.min(100, Math.round((done / h.targetDays) * 100));
  };

  const overallScore = grid.length > 0
    ? Math.round(grid.reduce((acc, h) => acc + habitScore(h), 0) / grid.length)
    : 0;

  const sleepChartData = days.map(d => ({
    day: d,
    hours: sleepLogs[dateStr(d)] ?? null,
  })).filter(d => d.hours !== null);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    if (next <= today) setViewDate(next);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = monthKey(viewDate) === monthKey(today);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F5F5', margin: 0, letterSpacing: '-0.3px' }}>
            {greeting()}, {userName || 'there'}
          </h1>
          <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {grid.length > 0 && (
          <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#F5F5F5', lineHeight: 1 }}>{overallScore}%</div>
            <div style={{ fontSize: '11px', color: '#737373', marginTop: '3px' }}>Monthly Target Score</div>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#737373', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            MOTIVATION FOR TODAY:
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>
            {dailyQuote}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#A3A3A3', fontWeight: 500 }}>
          Keep going.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button type="button" onClick={prevMonth} style={{ background: '#171717', border: '1px solid #2A2A2A', color: '#A3A3A3', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>← Prev</button>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#F5F5F5' }}>{monthLabel}</span>
        <button type="button" onClick={nextMonth} disabled={isCurrentMonth} style={{ background: '#171717', border: '1px solid #2A2A2A', color: isCurrentMonth ? '#2A2A2A' : '#A3A3A3', borderRadius: '8px', padding: '6px 12px', cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Next →</button>
        <button type="button" onClick={() => setShowAddModal(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFFFFF', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <Plus size={14} /> Add Habit
        </button>
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#171717' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', borderRight: '1px solid #2A2A2A', minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#171717', zIndex: 2 }}>
                  HABIT
                </th>
                {days.map(d => {
                  const ds = dateStr(d);
                  const isTd = ds === todayStr;
                  return (
                    <th key={d} style={{ width: `${CELL}px`, minWidth: `${CELL}px`, textAlign: 'center', padding: '8px 0', fontSize: '10px', fontWeight: isTd ? 800 : 600, color: isTd ? '#FFFFFF' : '#525252', borderRight: '1px solid #1F1F1F', backgroundColor: isTd ? '#1C1C1C' : '#171717' }}>
                      {d}
                    </th>
                  );
                })}
                <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#737373', borderLeft: '1px solid #2A2A2A', minWidth: '100px', backgroundColor: '#171717' }}>
                  TARGET SCORE
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={daysInMonth + 2} style={{ textAlign: 'center', padding: '40px', color: '#525252', fontSize: '13px' }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && grid.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 2} style={{ textAlign: 'center', padding: '48px', color: '#525252', fontSize: '13px' }}>
                    No habits yet. Click <b style={{ color: '#A3A3A3' }}>+ Add Habit</b> to start tracking.
                  </td>
                </tr>
              )}
              {grid.map((habit) => {
                const score = habitScore(habit);
                const done = Object.values(habit.logs || {}).filter(Boolean).length;
                return (
                  <tr key={habit.id} style={{ borderTop: '1px solid #1A1A1A' }}>
                    <td style={{ padding: '8px 12px', borderRight: '1px solid #2A2A2A', position: 'sticky', left: 0, backgroundColor: '#111111', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#D4D4D4', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{habit.title}</div>
                          <div style={{ fontSize: '10px', color: '#525252', marginTop: '1px' }}>Target: {habit.targetDays}d/mo</div>
                        </div>
                        <button type="button" onClick={() => handleDeleteHabit(habit.id)} style={{ background: 'none', border: 'none', color: '#404040', cursor: 'pointer', padding: '2px', flexShrink: 0, display: 'flex' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>

                    {days.map(d => {
                      const ds = dateStr(d);
                      const isFuture = ds > todayStr;
                      const isChecked = habit.logs?.[ds] === true;
                      const isTd = ds === todayStr;
                      return (
                        <td key={d} style={{ width: `${CELL}px`, textAlign: 'center', padding: '6px 0', borderRight: '1px solid #1A1A1A', backgroundColor: isTd ? '#161616' : 'transparent' }}>
                          <div
                            onClick={() => !isFuture && handleToggle(habit.id, d)}
                            title={isFuture ? 'Future date' : ds}
                            style={{
                              width: '20px', height: '20px', borderRadius: '4px', margin: '0 auto',
                              backgroundColor: isChecked ? '#D4D4D4' : '#1F1F1F',
                              border: `1.5px solid ${isChecked ? '#A3A3A3' : isTd ? '#3A3A3A' : '#2A2A2A'}`,
                              cursor: isFuture ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.1s ease',
                              opacity: isFuture ? 0.3 : 1,
                            }}
                          >
                            {isChecked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td style={{ textAlign: 'center', padding: '8px 12px', borderLeft: '1px solid #2A2A2A' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: score >= 80 ? '#D4D4D4' : score >= 50 ? '#A3A3A3' : '#525252' }}>{score}%</div>
                      <div style={{ fontSize: '10px', color: '#525252' }}>{done}/{habit.targetDays}d</div>
                    </td>
                  </tr>
                );
              })}

              {grid.length > 0 && (
                <tr style={{ borderTop: '2px solid #2A2A2A', backgroundColor: '#141414' }}>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #2A2A2A', position: 'sticky', left: 0, backgroundColor: '#141414', zIndex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#F5F5F5', letterSpacing: '0.05em' }}>
                      DAILY SCORE
                    </div>
                    <div style={{ fontSize: '10px', color: '#737373' }}>
                      {grid.length} habit{grid.length !== 1 ? 's' : ''} total
                    </div>
                  </td>

                  {days.map(d => {
                    const ds = dateStr(d);
                    const isFuture = ds > todayStr;
                    const isTd = ds === todayStr;

                    const ticked = grid.filter(h => h.logs?.[ds] === true).length;
                    const pct = grid.length > 0 ? Math.round((ticked / grid.length) * 100) : 0;

                    return (
                      <td key={d} style={{ width: `${CELL}px`, textAlign: 'center', padding: '6px 0', borderRight: '1px solid #1F1F1F', backgroundColor: isTd ? '#1F1F1F' : 'transparent' }}>
                        {!isFuture ? (
                          <div style={{ fontSize: '9px', fontWeight: 800, color: pct === 100 ? '#FFFFFF' : pct >= 50 ? '#D4D4D4' : pct > 0 ? '#A3A3A3' : '#525252' }}>
                            {pct}%
                          </div>
                        ) : (
                          <div style={{ fontSize: '9px', color: '#2A2A2A' }}>-</div>
                        )}
                      </td>
                    );
                  })}

                  <td style={{ textAlign: 'center', padding: '8px 12px', borderLeft: '1px solid #2A2A2A' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#F5F5F5' }}>
                      Avg Daily
                    </div>
                    <div style={{ fontSize: '10px', color: '#737373' }}>
                      {Math.round(
                        days.filter(d => dateStr(d) <= todayStr).reduce((acc, d) => {
                          const ds = dateStr(d);
                          const ticked = grid.filter(h => h.logs?.[ds] === true).length;
                          return acc + (grid.length > 0 ? (ticked / grid.length) * 100 : 0);
                        }, 0) / Math.max(1, days.filter(d => dateStr(d) <= todayStr).length)
                      )}%
                    </div>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sleep Tracker</span>
            <span style={{ fontSize: '11px', color: '#525252', marginLeft: '10px' }}>Click any cell to log hours</span>
          </div>
          {Object.keys(sleepLogs).length > 0 && (
            <span style={{ fontSize: '12px', color: '#737373' }}>
              Avg: <b style={{ color: '#F5F5F5' }}>
                {(Object.values(sleepLogs).reduce((a, b) => a + b, 0) / Object.values(sleepLogs).length).toFixed(1)}h
              </b>
            </span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#171717' }}>
                <th style={{ textAlign: 'left', padding: '8px 16px', fontSize: '10px', fontWeight: 700, color: '#737373', letterSpacing: '0.1em', textTransform: 'uppercase', borderRight: '1px solid #2A2A2A', minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#171717', zIndex: 2 }}>
                  HOURS SLEPT
                </th>
                {days.map(d => {
                  const isTd = dateStr(d) === todayStr;
                  return (
                    <th key={d} style={{ width: `${CELL}px`, minWidth: `${CELL}px`, textAlign: 'center', padding: '6px 0', fontSize: '10px', fontWeight: isTd ? 800 : 600, color: isTd ? '#FFFFFF' : '#525252', borderRight: '1px solid #1F1F1F', backgroundColor: isTd ? '#1C1C1C' : '#171717' }}>
                      {d}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid #1A1A1A' }}>
                <td style={{ padding: '8px 16px', borderRight: '1px solid #2A2A2A', fontSize: '12px', color: '#737373', position: 'sticky', left: 0, backgroundColor: '#111111', zIndex: 1 }}>
                  Log daily sleep ↓
                </td>
                {days.map(d => {
                  const ds = dateStr(d);
                  const isFuture = ds > todayStr;
                  const hrs = sleepLogs[ds];
                  const isTd = ds === todayStr;
                  const sleepColor = hrs === undefined ? '#1F1F1F' : hrs >= 8 ? '#D4D4D4' : hrs >= 7 ? '#A3A3A3' : hrs >= 6 ? '#737373' : '#404040';
                  return (
                    <td key={d} style={{ textAlign: 'center', padding: '6px 0', borderRight: '1px solid #1A1A1A', backgroundColor: isTd ? '#161616' : 'transparent' }}>
                      <div
                        onClick={() => !isFuture && openSleepModal(d)}
                        title={hrs !== undefined ? `${hrs}h sleep` : 'Click to log'}
                        style={{
                          width: '28px', height: '20px', borderRadius: '4px', margin: '0 auto',
                          backgroundColor: sleepColor,
                          border: `1.5px solid ${hrs !== undefined ? '#3A3A3A' : isTd ? '#3A3A3A' : '#2A2A2A'}`,
                          cursor: isFuture ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: isFuture ? 0.2 : 1,
                          transition: 'all 0.1s ease',
                          fontSize: '8px', fontWeight: 800, color: hrs !== undefined && hrs >= 7 ? '#0A0A0A' : '#D4D4D4',
                        }}
                      >
                        {hrs !== undefined ? hrs : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {sleepChartData.length > 0 && (
        <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#A3A3A3', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sleep Cycle — {monthLabel}</span>
            <span style={{ fontSize: '11px', color: '#525252' }}>{sleepChartData.length} days logged</span>
          </div>
          <div style={{ height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepChartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 4, 6, 7, 8, 10]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }}
                  formatter={(v) => [`${v}h`, 'Sleep']}
                  labelFormatter={(l) => `Day ${l}`}
                />
                <Line type="monotone" dataKey={() => 8} stroke="#2A2A2A" strokeWidth={1} strokeDasharray="4 4" dot={false} legendType="none" />
                <Line type="monotone" dataKey="hours" stroke="#FFFFFF" strokeWidth={2} dot={{ fill: '#FFFFFF', r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '11px', color: '#525252' }}>
            <span>─ ─  Target: 8h</span>
            <span>─── Actual sleep</span>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px', position: 'relative' }}>
            <button type="button" onClick={() => setShowAddModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A3A3A3', cursor: 'pointer', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
            <h3 style={{ fontWeight: 800, fontSize: '17px', color: '#F5F5F5', margin: '0 0 20px' }}>Add New Habit</h3>
            <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Habit Name</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. 3 LeetCode problems" autoFocus
                  style={{ width: '100%', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Target Days This Month</label>
                <input type="number" min="1" max="31" value={newTargetDays} onChange={e => setNewTargetDays(e.target.value)} placeholder="e.g. 30"
                  style={{ width: '100%', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '11px', color: '#525252', marginTop: '4px' }}>How many days this month do you plan to complete this habit? (1-31)</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#A3A3A3', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '8px', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Add Habit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSleepModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '320px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: '#F5F5F5', margin: '0 0 6px' }}>Log Sleep</h3>
            <p style={{ fontSize: '12px', color: '#737373', margin: '0 0 20px' }}>
              {sleepDay ? new Date(dateStr(sleepDay)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}
            </p>
            <input type="number" step="0.5" min="0" max="24" value={sleepInput} onChange={e => setSleepInput(e.target.value)} placeholder="Hours (e.g. 7.5)" autoFocus
              style={{ width: '100%', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '15px', padding: '12px', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', marginBottom: '14px', textAlign: 'center' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowSleepModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#A3A3A3', fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button type="button" onClick={handleSaveSleep} style={{ flex: 1, padding: '10px', backgroundColor: '#FFFFFF', border: 'none', borderRadius: '8px', color: '#0A0A0A', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

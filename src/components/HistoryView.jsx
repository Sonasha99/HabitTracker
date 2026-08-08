import React, { useState, useEffect } from 'react';
import { Check, X, Moon } from 'lucide-react';
import { fetchAnalyticsAll } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const S = {
  card: { backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px' },
  label: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: '10px', display: 'block' },
  statVal: { fontSize: '24px', fontWeight: 900, color: '#F5F5F5', lineHeight: 1 },
  statSub: { fontSize: '11px', color: '#737373', marginTop: '4px' },
};

function pad(n) { return String(n).padStart(2, '0'); }
function toStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtShort(ds) {
  return new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function HistoryView() {
  const [mode, setMode] = useState('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({ habits: [], habitLogs: [], sleepLogs: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchAnalyticsAll();
      setData(res || { habits: [], habitLogs: [], sleepLogs: [] });
      setLoading(false);
    }
    load();
  }, []);

  const { habits = [], habitLogs = [], sleepLogs = [] } = data;
  const todayStr = toStr(new Date());

  const logsMap = {};
  habitLogs.forEach(l => {
    if (!l.completed) return;
    if (!logsMap[l.logDate]) logsMap[l.logDate] = {};
    logsMap[l.logDate][l.habitId] = true;
  });

  const sleepMap = {};
  sleepLogs.forEach(s => { sleepMap[s.logDate] = s.hours; });

  const getDayScore = (ds) => {
    if (!habits.length) return 0;
    const done = Object.keys(logsMap[ds] || {}).length;
    return Math.round((done / habits.length) * 100);
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (mode === 'Day') d.setDate(d.getDate() - 1);
    else if (mode === 'Week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
    setSelectedDate(null);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (mode === 'Day') d.setDate(d.getDate() + 1);
    else if (mode === 'Week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    if (d > new Date()) return;
    setCurrentDate(d);
    setSelectedDate(null);
  };

  const resetPeriod = () => { setCurrentDate(new Date()); setSelectedDate(null); };

  const renderModeSwitch = () => (
    <div style={{ display: 'flex', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '10px', padding: '3px' }}>
      {['Day', 'Week', 'Month'].map(m => (
        <button key={m} type="button" onClick={() => { setMode(m); setSelectedDate(null); }}
          style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', backgroundColor: mode === m ? '#2A2A2A' : 'transparent', color: mode === m ? '#FFFFFF' : '#737373', transition: 'all 0.15s ease' }}>
          {m}
        </button>
      ))}
    </div>
  );

  const renderNav = (label) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
      <button type="button" onClick={prevPeriod} style={{ backgroundColor: '#171717', border: '1px solid #2A2A2A', color: '#A3A3A3', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>← Previous</button>
      <button type="button" onClick={resetPeriod} style={{ backgroundColor: '#171717', border: '1px solid #2A2A2A', color: '#F5F5F5', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Current {mode}</button>
      <button type="button" onClick={nextPeriod} style={{ backgroundColor: '#171717', border: '1px solid #2A2A2A', color: '#A3A3A3', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>Next →</button>
      {label && <span style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F5', marginLeft: '4px' }}>{label}</span>}
    </div>
  );

  const renderDayDetail = (ds) => {
    const isFuture = ds > todayStr;
    if (isFuture) return <p style={{ color: '#525252', fontSize: '13px' }}>Future date — no records yet.</p>;
    const score = getDayScore(ds);
    const done = habits.filter(h => logsMap[ds]?.[h.id]);
    const missed = habits.filter(h => !logsMap[ds]?.[h.id]);
    const sleep = sleepMap[ds];
    const hasData = habits.length > 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div style={S.card}>
            <span style={S.label}>Daily Score</span>
            <div style={S.statVal}>{hasData ? `${score}%` : '—'}</div>
            <div style={S.statSub}>{done.length} / {habits.length} habits</div>
          </div>
          <div style={S.card}>
            <span style={S.label}>Sleep</span>
            <div style={S.statVal}>{sleep !== undefined ? `${sleep}h` : '—'}</div>
            <div style={S.statSub}>{sleep !== undefined ? (sleep >= 7 ? 'On target' : 'Below target') : 'Not recorded'}</div>
          </div>
        </div>

        <div style={S.card}>
          <span style={S.label}>Completed Habits</span>
          {done.length === 0 ? <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No habits completed.</p> : done.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1A1A1A', fontSize: '13px', color: '#D4D4D4' }}>
              <Check size={14} style={{ color: '#FFFFFF', flexShrink: 0 }} /> {h.title}
            </div>
          ))}
        </div>

        <div style={S.card}>
          <span style={S.label}>Missed Habits</span>
          {missed.length === 0 ? <p style={{ fontSize: '12px', color: '#A3A3A3', margin: 0 }}>All habits completed!</p> : missed.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1A1A1A', fontSize: '13px', color: '#737373' }}>
              <X size={14} style={{ color: '#525252', flexShrink: 0 }} /> {h.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const ds = toStr(currentDate);
    const label = new Date(ds + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;

    return (
      <>
        {renderNav(label)}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={S.card}>
            <span style={S.label}>{new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 700, color: '#525252' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayStr = `${year}-${pad(month + 1)}-${pad(day)}`;
                const isSelected = dayStr === ds;
                const isFut = dayStr > todayStr;
                const sc = getDayScore(dayStr);
                return (
                  <button key={day} type="button"
                    onClick={() => !isFut && setCurrentDate(new Date(dayStr + 'T12:00:00'))}
                    style={{ aspectRatio: '1', borderRadius: '6px', border: `1.5px solid ${isSelected ? '#FFFFFF' : '#2A2A2A'}`, backgroundColor: isSelected ? '#2A2A2A' : 'transparent', cursor: isFut ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: isSelected ? 800 : 500, color: isFut ? '#2A2A2A' : isSelected ? '#FFFFFF' : '#A3A3A3', opacity: isFut ? 0.3 : 1 }}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#F5F5F5', margin: '0 0 16px' }}>{label}</h3>
            {habits.length === 0 ? (
              <div style={{ ...S.card, color: '#525252', fontSize: '13px' }}>No habits recorded. Add habits from the Dashboard to start tracking.</div>
            ) : (
              renderDayDetail(ds)
            )}
          </div>
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const monday = getMonday(currentDate);
    const sunday = addDays(monday, 6);
    const label = `${fmtShort(toStr(monday))} – ${fmtShort(toStr(sunday))}`;
    const weekDates = Array.from({ length: 7 }, (_, i) => toStr(addDays(monday, i)));

    const scoresPerDay = weekDates.map(ds => ({ ds, score: getDayScore(ds), day: WEEKDAYS[weekDates.indexOf(ds)] }));
    const pastDays = scoresPerDay.filter(d => d.ds <= todayStr);

    const weeklyScore = pastDays.length > 0 ? Math.round(pastDays.reduce((a, d) => a + d.score, 0) / pastDays.length) : 0;

    const totalPossible = pastDays.length * habits.length;
    const totalDone = pastDays.reduce((acc, d) => acc + Object.keys(logsMap[d.ds] || {}).length, 0);

    const bestDay = pastDays.length > 0 ? pastDays.reduce((a, b) => b.score > a.score ? b : a, pastDays[0]) : null;
    const worstDay = pastDays.length > 0 ? pastDays.reduce((a, b) => b.score < a.score ? b : a, pastDays[0]) : null;

    const sleepValues = weekDates.map(ds => sleepMap[ds]).filter(h => h !== undefined);
    const avgSleep = sleepValues.length > 0 ? (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : null;

    const habitBreakdown = habits.map(h => {
      const done = weekDates.filter(ds => logsMap[ds]?.[h.id]).length;
      const possible = weekDates.filter(ds => ds <= todayStr).length;
      const pct = possible > 0 ? Math.round((done / possible) * 100) : 0;
      return { ...h, done, possible, pct };
    }).sort((a, b) => b.pct - a.pct);

    return (
      <>
        {renderNav(`Week of ${label}`)}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={S.card}>
            <span style={S.label}>Weekly Score</span>
            <div style={S.statVal}>{weeklyScore}%</div>
            <div style={S.statSub}>Average across days</div>
          </div>
          <div style={S.card}>
            <span style={S.label}>Habits Completed</span>
            <div style={S.statVal}>{totalDone}</div>
            <div style={S.statSub}>of {totalPossible} possible</div>
          </div>
          {bestDay && (
            <div style={S.card}>
              <span style={S.label}>Best Day</span>
              <div style={S.statVal}>{WEEKDAYS_FULL[weekDates.indexOf(bestDay.ds)]}</div>
              <div style={S.statSub}>{bestDay.score}% completion</div>
            </div>
          )}
          {worstDay && bestDay && worstDay.ds !== bestDay.ds && (
            <div style={S.card}>
              <span style={S.label}>Lowest Day</span>
              <div style={S.statVal}>{WEEKDAYS_FULL[weekDates.indexOf(worstDay.ds)]}</div>
              <div style={S.statSub}>{worstDay.score}% completion</div>
            </div>
          )}
          {avgSleep && (
            <div style={S.card}>
              <span style={S.label}>Avg Sleep</span>
              <div style={S.statVal}>{avgSleep}h</div>
              <div style={S.statSub}>{sleepValues.length} days recorded</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={S.card}>
            <span style={S.label}>Daily Score Breakdown (Mon–Sun)</span>
            {pastDays.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No habit data recorded for this week.</p>
            ) : (
              <div style={{ height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoresPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <XAxis dataKey="day" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={v => [`${v}%`, 'Score']} />
                    <Bar dataKey="score" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginTop: '12px' }}>
              {scoresPerDay.map(({ ds, score, day }) => {
                const isFut = ds > todayStr;
                return (
                  <div key={ds} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#525252', marginBottom: '3px' }}>{day}</div>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: isFut ? '#2A2A2A' : score >= 80 ? '#FFFFFF' : score > 0 ? '#A3A3A3' : '#404040' }}>
                      {isFut ? '—' : `${score}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={S.card}>
            <span style={S.label}>Sleep This Week</span>
            {sleepValues.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No sleep data recorded for this period.</p>
            ) : (
              <>
                <div style={{ height: '120px', marginBottom: '12px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weekDates.map((ds, i) => ({ day: WEEKDAYS[i], hours: sleepMap[ds] ?? null }))} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <XAxis dataKey="day" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 10]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={v => v !== null ? [`${v}h`, 'Sleep'] : ['—', 'Sleep']} />
                      <Line dataKey="hours" stroke="#FFFFFF" strokeWidth={2} dot={{ fill: '#FFFFFF', r: 3 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#A3A3A3' }}>
                  <span>Avg: <b style={{ color: '#F5F5F5' }}>{avgSleep}h</b></span>
                  {sleepValues.length > 0 && <span>Best: <b style={{ color: '#F5F5F5' }}>{Math.max(...sleepValues)}h</b></span>}
                  {sleepValues.length > 0 && <span>Lowest: <b style={{ color: '#F5F5F5' }}>{Math.min(...sleepValues)}h</b></span>}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <span style={S.label}>Habit Performance This Week</span>
          {habits.length === 0 ? (
            <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No habits recorded for this period.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Habit', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Done', 'Rate'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Habit' ? 'left' : 'center', fontSize: '10px', fontWeight: 700, color: '#737373', padding: '6px 8px 10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habitBreakdown.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid #1A1A1A' }}>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: 600, color: '#D4D4D4', maxWidth: '160px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                    </td>
                    {weekDates.map((ds, i) => {
                      const isFut = ds > todayStr;
                      const done = logsMap[ds]?.[h.id];
                      return (
                        <td key={ds} style={{ textAlign: 'center', padding: '10px 4px' }}>
                          {isFut ? (
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#141414', border: '1px solid #1F1F1F', margin: '0 auto' }} />
                          ) : done ? (
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#D4D4D4', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.2 5.8L8 1" stroke="#0A0A0A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          ) : (
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', margin: '0 auto' }} />
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', padding: '10px 8px', fontSize: '12px', color: '#A3A3A3' }}>{h.done}/{h.possible}</td>
                    <td style={{ textAlign: 'center', padding: '10px 8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: h.pct >= 70 ? '#FFFFFF' : h.pct >= 40 ? '#A3A3A3' : '#525252' }}>{h.pct}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const prefix = `${year}-${pad(month + 1)}`;

    const monthDates = Array.from({ length: daysInMonth }, (_, i) => `${prefix}-${pad(i + 1)}`);
    const pastMonthDates = monthDates.filter(ds => ds <= todayStr);

    const scores = pastMonthDates.map(ds => getDayScore(ds));
    const monthlyScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestDayScore = scores.length > 0 ? Math.max(...scores) : 0;
    const bestDayDs = pastMonthDates.find(ds => getDayScore(ds) === bestDayScore);
    const worstDayScore = scores.length > 0 ? Math.min(...scores) : 0;
    const worstDayDs = pastMonthDates.find(ds => getDayScore(ds) === worstDayScore);

    const sleepVals = monthDates.map(ds => sleepMap[ds]).filter(h => h !== undefined);
    const avgSleep = sleepVals.length > 0 ? (sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length).toFixed(1) : null;

    const habitPerf = habits.map(h => {
      const done = pastMonthDates.filter(ds => logsMap[ds]?.[h.id]).length;
      const pct = pastMonthDates.length > 0 ? Math.round((done / pastMonthDates.length) * 100) : 0;
      return { ...h, done, possible: pastMonthDates.length, pct };
    }).sort((a, b) => b.pct - a.pct);

    const bestHabit = habitPerf[0];
    const worstHabit = habitPerf[habitPerf.length - 1];

    const weeks = [];
    const firstMonday = getMonday(new Date(`${prefix}-01T12:00:00`));
    let wkStart = new Date(firstMonday);
    let wkNum = 1;
    while (toStr(wkStart) <= `${prefix}-${pad(daysInMonth)}`) {
      const wkEnd = addDays(wkStart, 6);
      const wkDates = Array.from({ length: 7 }, (_, i) => toStr(addDays(wkStart, i))).filter(ds => ds.startsWith(prefix) && ds <= todayStr);
      if (wkDates.length > 0) {
        const wkScores = wkDates.map(ds => getDayScore(ds));
        const wkAvg = Math.round(wkScores.reduce((a, b) => a + b, 0) / wkScores.length);
        const wkSleeps = wkDates.map(ds => sleepMap[ds]).filter(h => h !== undefined);
        const wkAvgSleep = wkSleeps.length > 0 ? (wkSleeps.reduce((a, b) => a + b, 0) / wkSleeps.length).toFixed(1) : null;
        weeks.push({ label: `Week ${wkNum}`, wkAvg, wkAvgSleep });
      }
      wkStart = addDays(wkStart, 7);
      wkNum++;
    }

    const grayscaleBg = (score, isFut) => {
      if (isFut) return '#141414';
      if (score === 0) return '#1A1A1A';
      if (score < 40) return '#262626';
      if (score < 60) return '#323232';
      if (score < 80) return '#484848';
      if (score < 100) return '#686868';
      return '#D4D4D4';
    };
    const grayscaleText = (score, isFut) => {
      if (isFut || score < 70) return '#F5F5F5';
      return '#0A0A0A';
    };

    return (
      <>
        {renderNav(monthLabel)}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={S.card}>
            <span style={S.label}>Monthly Score</span>
            <div style={S.statVal}>{monthlyScore}%</div>
            <div style={S.statSub}>{pastMonthDates.length} days tracked</div>
          </div>
          {bestHabit && (
            <div style={S.card}>
              <span style={S.label}>Best Habit</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#F5F5F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bestHabit.title}</div>
              <div style={S.statSub}>{bestHabit.pct}% completion</div>
            </div>
          )}
          {worstHabit && worstHabit.id !== bestHabit?.id && (
            <div style={S.card}>
              <span style={S.label}>Needs Attention</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{worstHabit.title}</div>
              <div style={S.statSub}>{worstHabit.pct}% completion</div>
            </div>
          )}
          {bestDayDs && (
            <div style={S.card}>
              <span style={S.label}>Best Day</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#F5F5F5' }}>{fmtShort(bestDayDs)}</div>
              <div style={S.statSub}>{bestDayScore}% score</div>
            </div>
          )}
          {avgSleep && (
            <div style={S.card}>
              <span style={S.label}>Avg Sleep</span>
              <div style={S.statVal}>{avgSleep}h</div>
              <div style={S.statSub}>{sleepVals.length} days recorded</div>
            </div>
          )}
        </div>

        <div style={{ ...S.card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={S.label}>{monthLabel} — Click a date to inspect</span>
            <span style={{ fontSize: '11px', color: '#525252' }}>Shade = daily completion</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
            {WEEKDAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#525252' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds = `${prefix}-${pad(day)}`;
              const isFut = ds > todayStr;
              const score = getDayScore(ds);
              const isSelected = selectedDate === ds;
              return (
                <button key={day} type="button" onClick={() => !isFut && setSelectedDate(selectedDate === ds ? null : ds)}
                  style={{ aspectRatio: '1', borderRadius: '8px', border: `1.5px solid ${isSelected ? '#FFFFFF' : 'transparent'}`, backgroundColor: grayscaleBg(score, isFut), cursor: isFut ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px', opacity: isFut ? 0.35 : 1, padding: '2px', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: grayscaleText(score, isFut) }}>{day}</span>
                  {!isFut && habits.length > 0 && <span style={{ fontSize: '8px', fontWeight: 800, color: grayscaleText(score, isFut), opacity: 0.8 }}>{score}%</span>}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div style={{ ...S.card, marginBottom: '24px', border: '1px solid #3A3A3A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#F5F5F5', margin: 0 }}>{fmtDate(selectedDate)} — {getDayScore(selectedDate)}%</h3>
              <button type="button" onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
            </div>
            {renderDayDetail(selectedDate)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={S.card}>
            <span style={S.label}>Habit Performance This Month</span>
            {habitPerf.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No habit data recorded for this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {habitPerf.map(h => (
                  <div key={h.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4D4D4', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                      <span style={{ fontSize: '12px', color: '#A3A3A3' }}>{h.done}/{h.possible} <b style={{ color: h.pct >= 70 ? '#FFFFFF' : '#737373' }}>{h.pct}%</b></span>
                    </div>
                    <div style={{ backgroundColor: '#2A2A2A', borderRadius: '9999px', height: '5px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: h.pct >= 70 ? '#D4D4D4' : h.pct >= 40 ? '#737373' : '#404040', height: '100%', width: `${h.pct}%`, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={S.card}>
            <span style={S.label}>Week-by-Week Comparison</span>
            {weeks.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No data recorded for this month.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {weeks.map((w, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4D4D4' }}>{w.label}</span>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#A3A3A3' }}>
                        {w.wkAvgSleep && <span><Moon size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />{w.wkAvgSleep}h</span>}
                        <b style={{ color: w.wkAvg >= 70 ? '#FFFFFF' : '#737373' }}>{w.wkAvg}%</b>
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#2A2A2A', borderRadius: '9999px', height: '5px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: w.wkAvg >= 70 ? '#D4D4D4' : w.wkAvg >= 40 ? '#737373' : '#404040', height: '100%', width: `${w.wkAvg}%`, borderRadius: '9999px' }} />
                    </div>
                  </div>
                ))}

                {sleepVals.length > 0 && (
                  <div style={{ paddingTop: '12px', borderTop: '1px solid #1F1F1F', display: 'flex', gap: '16px', fontSize: '12px', color: '#A3A3A3' }}>
                    <span>Avg sleep: <b style={{ color: '#F5F5F5' }}>{avgSleep}h</b></span>
                    <span>Best: <b style={{ color: '#F5F5F5' }}>{Math.max(...sleepVals)}h</b></span>
                    <span>Lowest: <b style={{ color: '#F5F5F5' }}>{Math.min(...sleepVals)}h</b></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F5F5', margin: 0, letterSpacing: '-0.3px' }}>Progress</h1>
          <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>
            {mode === 'Day' && 'Select any date to inspect daily habit and sleep data'}
            {mode === 'Week' && 'Monday to Sunday weekly summary with habit breakdown'}
            {mode === 'Month' && 'Full monthly overview with calendar, habits, and week comparison'}
          </p>
        </div>
        {renderModeSwitch()}
      </div>

      {loading ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#525252', fontSize: '13px' }}>
          Loading history data...
        </div>
      ) : (
        <>
          {mode === 'Day' && renderDayView()}
          {mode === 'Week' && renderWeekView()}
          {mode === 'Month' && renderMonthView()}
        </>
      )}
    </div>
  );
}

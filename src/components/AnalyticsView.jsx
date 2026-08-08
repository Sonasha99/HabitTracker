import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Flame, Moon, Award, ArrowUpRight, ArrowDownRight, X, Check } from 'lucide-react';
import { fetchAnalyticsAll } from '../api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const S = {
  card: { backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px' },
  label: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#737373', marginBottom: '12px', display: 'block' },
  statVal: { fontSize: '26px', fontWeight: 900, color: '#F5F5F5', lineHeight: 1 },
  statSub: { fontSize: '12px', color: '#737373', marginTop: '4px' },
  emptyState: { textAlign: 'center', padding: '36px 16px', color: '#525252', fontSize: '13px' },
};

export default function AnalyticsView() {
  const [selectedHabitId, setSelectedHabitId] = useState('ALL');
  const [timeRange, setTimeRange] = useState('30D');
  const [data, setData] = useState({ habits: [], habitLogs: [], sleepLogs: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDateModal, setSelectedDateModal] = useState(null);

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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const getDaysLimit = () => {
    if (timeRange === '7D') return 7;
    if (timeRange === '30D') return 30;
    if (timeRange === '3M') return 90;
    if (timeRange === '6M') return 180;
    return 365;
  };

  const daysLimit = getDaysLimit();
  const startDate = new Date();
  startDate.setDate(today.getDate() - daysLimit + 1);

  const habitLogsMap = {};
  habitLogs.forEach(l => {
    if (!habitLogsMap[l.logDate]) habitLogsMap[l.logDate] = {};
    if (l.completed) habitLogsMap[l.logDate][l.habitId] = true;
  });

  const sleepLogsMap = {};
  sleepLogs.forEach(s => { sleepLogsMap[s.logDate] = s.hours; });

  const rangeDates = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    rangeDates.push(d.toISOString().split('T')[0]);
  }

  const getDailyScore = (ds) => {
    if (!habits.length) return 0;
    const completedCount = Object.keys(habitLogsMap[ds] || {}).length;
    return Math.round((completedCount / habits.length) * 100);
  };

  const targetHabits = selectedHabitId === 'ALL'
    ? habits
    : habits.filter(h => h.id === parseInt(selectedHabitId));

  const calcStreak = (habitId = null) => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const allDates = [...rangeDates].sort();
    allDates.forEach(ds => {
      let isDone = false;
      if (habitId) {
        isDone = habitLogsMap[ds]?.[habitId] === true;
      } else {
        isDone = getDailyScore(ds) >= 50;
      }

      if (isDone) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    });

    for (let i = allDates.length - 1; i >= 0; i--) {
      const ds = allDates[i];
      let isDone = habitId ? habitLogsMap[ds]?.[habitId] === true : getDailyScore(ds) >= 50;
      if (isDone) currentStreak++;
      else break;
    }

    return { currentStreak, longestStreak };
  };

  const rangeDailyScores = rangeDates.map(ds => ({ date: ds, score: getDailyScore(ds) }));
  const avgScore = rangeDailyScores.length > 0
    ? Math.round(rangeDailyScores.reduce((acc, d) => acc + d.score, 0) / rangeDailyScores.length)
    : 0;
  const bestScore = rangeDailyScores.length > 0 ? Math.max(...rangeDailyScores.map(d => d.score)) : 0;
  const worstScore = rangeDailyScores.length > 0 ? Math.min(...rangeDailyScores.map(d => d.score)) : 0;

  const prevPeriodStart = new Date(startDate);
  prevPeriodStart.setDate(prevPeriodStart.getDate() - daysLimit);
  const prevPeriodDates = [];
  for (let d = new Date(prevPeriodStart); d < startDate; d.setDate(d.getDate() + 1)) {
    prevPeriodDates.push(d.toISOString().split('T')[0]);
  }
  const prevAvgScore = prevPeriodDates.length > 0
    ? Math.round(prevPeriodDates.reduce((acc, ds) => acc + getDailyScore(ds), 0) / prevPeriodDates.length)
    : 0;
  const scoreImprovement = avgScore - prevAvgScore;

  const weeklyBuckets = [];
  for (let i = 0; i < rangeDates.length; i += 7) {
    const chunk = rangeDates.slice(i, i + 7);
    const weekLabel = `W${Math.floor(i / 7) + 1}`;
    let done = 0;
    let total = 0;
    chunk.forEach(ds => {
      targetHabits.forEach(h => {
        total++;
        if (habitLogsMap[ds]?.[h.id]) done++;
      });
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    weeklyBuckets.push({ week: weekLabel, pct });
  }

  const weeklyAvg = weeklyBuckets.length > 0
    ? Math.round(weeklyBuckets.reduce((a, b) => a + b.pct, 0) / weeklyBuckets.length)
    : 0;
  const bestWeek = weeklyBuckets.length > 0 ? Math.max(...weeklyBuckets.map(w => w.pct)) : 0;
  const worstWeek = weeklyBuckets.length > 0 ? Math.min(...weeklyBuckets.map(w => w.pct)) : 0;
  const streakInfo = calcStreak(selectedHabitId === 'ALL' ? null : parseInt(selectedHabitId));

  const monthlyMap = {};
  rangeDates.forEach(ds => {
    const monthKey = ds.slice(0, 7);
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { done: 0, total: 0 };
    targetHabits.forEach(h => {
      monthlyMap[monthKey].total++;
      if (habitLogsMap[ds]?.[h.id]) monthlyMap[monthKey].done++;
    });
  });

  const monthlyBuckets = Object.entries(monthlyMap).map(([mKey, v]) => {
    const dObj = new Date(`${mKey}-01`);
    const label = dObj.toLocaleDateString('en-US', { month: 'short' });
    const pct = v.total > 0 ? Math.round((v.done / v.total) * 100) : 0;
    return { month: label, pct, mKey };
  });

  const monthlyAvg = monthlyBuckets.length > 0
    ? Math.round(monthlyBuckets.reduce((a, b) => a + b.pct, 0) / monthlyBuckets.length)
    : 0;
  const bestMonth = monthlyBuckets.length > 0
    ? monthlyBuckets.reduce((max, m) => m.pct > max.pct ? m : max, monthlyBuckets[0]).month
    : '—';
  const lastMonthPct = monthlyBuckets.length > 1 ? monthlyBuckets[monthlyBuckets.length - 2].pct : monthlyAvg;
  const currentMonthPct = monthlyBuckets.length > 0 ? monthlyBuckets[monthlyBuckets.length - 1].pct : 0;
  const monthImprovement = currentMonthPct - lastMonthPct;

  const habitsComparison = habits.map(h => {
    let done = 0;
    let total = rangeDates.length;
    rangeDates.forEach(ds => {
      if (habitLogsMap[ds]?.[h.id]) done++;
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const { currentStreak, longestStreak } = calcStreak(h.id);
    return { id: h.id, title: h.title, pct, done, total, currentStreak, longestStreak };
  }).sort((a, b) => b.pct - a.pct);

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdayTotals = { 0: { sum: 0, count: 0 }, 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 }, 3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 }, 5: { sum: 0, count: 0 }, 6: { sum: 0, count: 0 } };
  rangeDates.forEach(ds => {
    const w = new Date(ds).getDay();
    weekdayTotals[w].sum += getDailyScore(ds);
    weekdayTotals[w].count++;
  });

  const weekdayData = [1, 2, 3, 4, 5, 6, 0].map(w => {
    const avg = weekdayTotals[w].count > 0 ? Math.round(weekdayTotals[w].sum / weekdayTotals[w].count) : 0;
    return { day: weekdayNames[w].slice(0, 3), fullName: weekdayNames[w], avg };
  });

  const bestDayObj = [...weekdayData].sort((a, b) => b.avg - a.avg)[0];
  const worstDayObj = [...weekdayData].sort((a, b) => a.avg - b.avg)[0];

  const rangeSleeps = rangeDates.map(ds => sleepLogsMap[ds]).filter(h => h !== undefined);
  const avgSleep = rangeSleeps.length > 0 ? (rangeSleeps.reduce((a, b) => a + b, 0) / rangeSleeps.length).toFixed(1) : '0.0';
  const bestSleep = rangeSleeps.length > 0 ? Math.max(...rangeSleeps).toFixed(1) : '0.0';
  const lowestSleep = rangeSleeps.length > 0 ? Math.min(...rangeSleeps).toFixed(1) : '0.0';

  const withinTargetSleep = rangeSleeps.filter(h => h >= 7 && h <= 9).length;
  const belowTargetSleep = rangeSleeps.filter(h => h < 7).length;
  const aboveTargetSleep = rangeSleeps.filter(h => h > 9).length;

  const sleepBuckets = {
    '< 5h': { scores: [] },
    '5 - 6h': { scores: [] },
    '6 - 7h': { scores: [] },
    '7 - 8h': { scores: [] },
    '8h+': { scores: [] },
  };

  rangeDates.forEach(ds => {
    const hrs = sleepLogsMap[ds];
    if (hrs !== undefined) {
      const score = getDailyScore(ds);
      if (hrs < 5) sleepBuckets['< 5h'].scores.push(score);
      else if (hrs < 6) sleepBuckets['5 - 6h'].scores.push(score);
      else if (hrs < 7) sleepBuckets['6 - 7h'].scores.push(score);
      else if (hrs <= 8) sleepBuckets['7 - 8h'].scores.push(score);
      else sleepBuckets['8h+'].scores.push(score);
    }
  });

  const sleepVsProdData = Object.entries(sleepBuckets).map(([range, v]) => {
    const avg = v.scores.length > 0 ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : 0;
    return { range, score: avg, count: v.scores.length };
  });

  const bestSleepBucket = [...sleepVsProdData].filter(b => b.count > 0).sort((a, b) => b.score - a.score)[0];

  const sortedDays = [...rangeDailyScores].sort((a, b) => b.score - a.score);
  const best3Days = sortedDays.slice(0, 3);
  const worst3Days = [...rangeDailyScores].sort((a, b) => a.score - b.score).slice(0, 3);

  const generateInsights = () => {
    if (rangeDates.length < 3 || habits.length === 0) {
      return ["Keep tracking for a few more days to discover your patterns."];
    }

    const insights = [];
    if (monthImprovement !== 0) {
      insights.push(`Your average score ${monthImprovement > 0 ? 'improved' : 'changed'} by ${monthImprovement > 0 ? '+' : ''}${monthImprovement}% this month.`);
    }

    if (habitsComparison.length > 0) {
      insights.push(`You are most consistent with ${habitsComparison[0].title} (${habitsComparison[0].pct}% completion).`);
      if (habitsComparison.length > 1) {
        insights.push(`${habitsComparison[habitsComparison.length - 1].title} is currently your least consistent habit (${habitsComparison[habitsComparison.length - 1].pct}%).`);
      }
    }

    if (bestDayObj) {
      insights.push(`Your strongest day of the week is ${bestDayObj.fullName} (avg ${bestDayObj.avg}%).`);
    }

    if (worstDayObj && worstDayObj.fullName !== bestDayObj?.fullName) {
      insights.push(`Your weakest day of the week is ${worstDayObj.fullName} (avg ${worstDayObj.avg}%).`);
    }

    if (bestSleepBucket && bestSleepBucket.count > 0) {
      insights.push(`Your productivity is highest on days when you sleep ${bestSleepBucket.range} (avg ${bestSleepBucket.score}% score).`);
    }

    return insights;
  };

  const personalInsights = generateInsights();

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F5F5', margin: 0, letterSpacing: '-0.3px' }}>
            Habit Analytics
          </h1>
          <p style={{ fontSize: '13px', color: '#737373', marginTop: '4px' }}>
            Data-driven insights calculated from your actual habit & sleep history
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={selectedHabitId}
            onChange={e => setSelectedHabitId(e.target.value)}
            style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '12px', padding: '8px 12px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          >
            <option value="ALL">All Habits</option>
            {habits.map(h => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>

          <div style={{ display: 'flex', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '3px' }}>
            {['7D', '30D', '3M', '6M', '1Y'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                style={{
                  padding: '5px 10px', borderRadius: '6px', border: 'none',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  backgroundColor: timeRange === r ? '#2A2A2A' : 'transparent',
                  color: timeRange === r ? '#FFFFFF' : '#737373',
                  transition: 'all 0.15s ease',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#525252', fontSize: '13px' }}>Loading analytics...</div>
      ) : habits.length === 0 ? (
        <div style={{ ...S.card, ...S.emptyState }}>
          <BarChart3 size={32} style={{ color: '#2A2A2A', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#A3A3A3' }}>Not enough data yet</p>
          <p style={{ margin: '4px 0 0', color: '#525252', fontSize: '12px' }}>Add habits and track for a few days to unlock full analytics.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div style={S.card}>
              <span style={S.label}>Current Average</span>
              <div style={S.statVal}>{avgScore}%</div>
              <div style={S.statSub}>{rangeDates.length} days analyzed</div>
            </div>

            <div style={S.card}>
              <span style={S.label}>Improvement vs Prev</span>
              <div style={{ ...S.statVal, color: scoreImprovement >= 0 ? '#FFFFFF' : '#737373', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {scoreImprovement >= 0 ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                {scoreImprovement >= 0 ? `+${scoreImprovement}%` : `${scoreImprovement}%`}
              </div>
              <div style={S.statSub}>Prev period: {prevAvgScore}%</div>
            </div>

            <div style={S.card}>
              <span style={S.label}>Best / Worst Score</span>
              <div style={S.statVal}>{bestScore}% / {worstScore}%</div>
              <div style={S.statSub}>Peak vs lowest</div>
            </div>

            <div style={S.card}>
              <span style={S.label}>Current Streak</span>
              <div style={S.statVal}>{streakInfo.currentStreak} days</div>
              <div style={S.statSub}>Longest: {streakInfo.longestStreak} days</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={S.card}>
              <span style={S.label}>Weekly Habit Analysis</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5' }}>{weeklyAvg}%</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Weekly Avg</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5' }}>{bestWeek}%</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Best Week</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5' }}>{worstWeek}%</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Worst Week</div>
                </div>
              </div>

              {weeklyBuckets.length > 0 ? (
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyBuckets}>
                      <XAxis dataKey="week" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={(v) => [`${v}%`, 'Completion']} />
                      <Bar dataKey="pct" fill="#D4D4D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p style={S.emptyState}>Insufficient weekly data.</p>}
            </div>

            <div style={S.card}>
              <span style={S.label}>Monthly Habit Analysis</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5' }}>{monthlyAvg}%</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Monthly Avg</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5' }}>{bestMonth}</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Best Month</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: monthImprovement >= 0 ? '#FFFFFF' : '#737373' }}>
                    {monthImprovement >= 0 ? `+${monthImprovement}%` : `${monthImprovement}%`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>vs Prev Month</div>
                </div>
              </div>

              {monthlyBuckets.length > 0 ? (
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyBuckets}>
                      <XAxis dataKey="month" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={(v) => [`${v}%`, 'Completion']} />
                      <Line type="monotone" dataKey="pct" stroke="#FFFFFF" strokeWidth={2} dot={{ fill: '#FFFFFF', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <p style={S.emptyState}>Insufficient monthly data.</p>}
            </div>
          </div>

          <div style={S.card}>
            <span style={S.label}>All Habits Consistency Ranking (Highest to Lowest)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {habitsComparison.map((h, i) => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ minWidth: '180px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#F5F5F5' }}>{i + 1}. {h.title}</div>
                    <div style={{ fontSize: '11px', color: '#737373' }}>Streak: {h.currentStreak}d (Best: {h.longestStreak}d)</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#2A2A2A', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: h.pct >= 80 ? '#D4D4D4' : h.pct >= 50 ? '#A3A3A3' : '#525252', height: '100%', width: `${h.pct}%`, borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#F5F5F5', minWidth: '45px', textAlign: 'right' }}>
                    {h.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <span style={S.label}>YOUR PATTERNS</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {personalInsights.map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#D4D4D4', backgroundColor: '#171717', border: '1px solid #1F1F1F', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFFFFF', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={S.label}>Weekday Performance Breakdown</span>
              <div style={{ fontSize: '12px', color: '#A3A3A3' }}>
                Best Day: <b style={{ color: '#F5F5F5' }}>{bestDayObj?.fullName || '—'}</b> · Needs Attention: <b style={{ color: '#737373' }}>{worstDayObj?.fullName || '—'}</b>
              </div>
            </div>
            <div style={{ height: '140px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayData}>
                  <XAxis dataKey="day" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={(v) => [`${v}%`, 'Avg Score']} />
                  <Bar dataKey="avg" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={S.card}>
              <span style={S.label}>Sleep Analytics</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5' }}>{avgSleep}h</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Average Sleep</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5' }}>{bestSleep}h</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Best Sleep</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#F5F5F5' }}>{lowestSleep}h</div>
                  <div style={{ fontSize: '11px', color: '#737373' }}>Lowest Sleep</div>
                </div>
              </div>

              <span style={{ ...S.label, marginBottom: '8px' }}>Target Sleep Breakdown (7–9 Hours)</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#D4D4D4', backgroundColor: '#171717', padding: '8px 12px', borderRadius: '6px' }}>
                  <span>Within Target (7–9h)</span><b style={{ color: '#FFFFFF' }}>{withinTargetSleep} days</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A3A3A3', backgroundColor: '#141414', padding: '8px 12px', borderRadius: '6px' }}>
                  <span>Below Target (&lt; 7h)</span><b style={{ color: '#737373' }}>{belowTargetSleep} days</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A3A3A3', backgroundColor: '#141414', padding: '8px 12px', borderRadius: '6px' }}>
                  <span>Above Target (&gt; 9h)</span><b style={{ color: '#737373' }}>{aboveTargetSleep} days</b>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <span style={S.label}>Sleep vs Productivity Analysis</span>
              <p style={{ fontSize: '12px', color: '#A3A3A3', marginTop: '-4px', marginBottom: '16px' }}>
                Average daily productivity score mapped by sleep duration range
              </p>

              <div style={{ height: '130px', marginBottom: '12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepVsProdData}>
                    <XAxis dataKey="range" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#525252" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', fontSize: '12px', color: '#F5F5F5' }} formatter={(v) => [`${v}%`, 'Productivity Score']} />
                    <Bar dataKey="score" fill="#D4D4D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {bestSleepBucket && bestSleepBucket.count > 0 ? (
                <div style={{ fontSize: '12px', color: '#F5F5F5', backgroundColor: '#171717', border: '1px solid #1F1F1F', padding: '10px 12px', borderRadius: '8px', lineHeight: 1.5 }}>
                  Your average productivity score is highest ({bestSleepBucket.score}%) on days when you sleep {bestSleepBucket.range}.
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#525252' }}>
                  Track sleep and habits for a few more days to discover your productivity pattern.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={S.card}>
              <span style={S.label}>BEST DAYS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {best3Days.map((d) => (
                  <div
                    key={d.date}
                    onClick={() => setSelectedDateModal(d.date)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#171717', border: '1px solid #2A2A2A', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '13px', color: '#F5F5F5', fontWeight: 600 }}>
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>{d.score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <span style={S.label}>LOWEST DAYS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {worst3Days.map((d) => (
                  <div
                    key={d.date}
                    onClick={() => setSelectedDateModal(d.date)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#141414', border: '1px solid #1F1F1F', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '13px', color: '#A3A3A3', fontWeight: 500 }}>
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#737373' }}>{d.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setSelectedDateModal(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A3A3A3', cursor: 'pointer', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F5F5F5', margin: '0 0 4px' }}>
              {new Date(selectedDateModal).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <div style={{ fontSize: '13px', color: '#A3A3A3', marginBottom: '20px' }}>
              Daily Score: <b style={{ color: '#FFFFFF' }}>{getDailyScore(selectedDateModal)}%</b>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={S.label}>Completed Habits</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {habits.filter(h => habitLogsMap[selectedDateModal]?.[h.id]).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#D4D4D4' }}>
                      <Check size={14} style={{ color: '#FFFFFF' }} /> {h.title}
                    </div>
                  ))}
                  {habits.filter(h => habitLogsMap[selectedDateModal]?.[h.id]).length === 0 && (
                    <p style={{ fontSize: '12px', color: '#525252', margin: 0 }}>No habits completed.</p>
                  )}
                </div>
              </div>

              <div>
                <span style={S.label}>Missed Habits</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {habits.filter(h => !habitLogsMap[selectedDateModal]?.[h.id]).map(h => (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#737373' }}>
                      <X size={14} style={{ color: '#525252' }} /> {h.title}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid #1F1F1F', fontSize: '12px', color: '#A3A3A3' }}>
                Sleep Recorded: <b style={{ color: '#F5F5F5' }}>{sleepLogsMap[selectedDateModal] !== undefined ? `${sleepLogsMap[selectedDateModal]} hrs` : 'Not recorded'}</b>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

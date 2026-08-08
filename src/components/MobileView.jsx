import React from 'react';
import { LayoutDashboard, Calendar, BarChart3, Plus } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, ReferenceLine } from 'recharts';

export default function MobileView({ habits = [], setHabits, sleepValue, setSleepValue, activeTab, setActiveTab, onToggleHabit, onAddHabit, userName }) {

  const toggleHabit = (id) => {
    if (onToggleHabit) {
      onToggleHabit(id);
    } else {
      setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    }
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const today = new Date();
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = i === 6;
    const pastVariance = [0.7, 0.85, 0.6, 0.9, 0.75, 0.95];
    const val = isToday ? completedPercent : Math.round(completedPercent * pastVariance[i]);
    return { day: label, val, isToday };
  });

  const getInitials = (name) => {
    if (!name) return 'HF';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="max-w-md mx-auto bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[800px]">
      
      <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between bg-[#111111]">
        <div>
          <h1 className="text-lg font-bold text-[#F5F5F5]">Habit Tracker</h1>
          <p className="text-xs text-[#A3A3A3]">{today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#2A2A2A] text-[#F5F5F5] flex items-center justify-center text-xs font-semibold border border-[#404040]">
          {getInitials(userName)}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-20">
        
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5 flex items-center space-x-5">
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#2A2A2A]"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#FFFFFF]"
                strokeDasharray={`${completedPercent}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-base font-bold text-[#F5F5F5]">{completedPercent}%</span>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#F5F5F5]">
              {completedPercent === 100 ? 'All done today!' : completedPercent > 50 ? 'Good progress!' : 'Keep going!'}
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-1">
              {completedCount} of {totalCount} habits done
            </p>
            {totalCount === 0 && (
              <p className="text-[11px] text-[#737373] mt-1">Add habits below to get started</p>
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F5F5]">Today's Habits</h3>
            <button
              type="button"
              onClick={() => {
                const title = prompt('New habit name:');
                if (title && onAddHabit) onAddHabit({ title, category: 'DSA Practice', frequency: 'Every Day' });
              }}
              className="p-1.5 bg-[#171717] border border-[#2A2A2A] rounded-lg text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {totalCount === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-[#737373]">No habits yet. Add your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map(habit => (
                <div 
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    habit.completed ? 'bg-[#171717] border-[#2A2A2A]' : 'bg-[#111111] border-[#1F1F1F]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox"
                      checked={habit.completed}
                      onChange={() => {}}
                      className="habit-checkbox"
                    />
                    <span className={`text-xs ${habit.completed ? 'line-through text-[#737373]' : 'text-[#D4D4D4]'}`}>
                      {habit.title}
                    </span>
                  </div>
                  {habit.completed && (
                    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#2A2A2A] text-[#E5E5E5] flex-shrink-0">
                      DONE
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {totalCount > 0 && (
            <div className="pt-2 space-y-1">
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${completedPercent}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#F5F5F5]">Sleep Last Night</h3>
          <div className="flex space-x-2">
            <input 
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepValue}
              onChange={(e) => setSleepValue(e.target.value)}
              placeholder="Hours slept"
              className="flex-1 bg-[#171717] border border-[#2A2A2A] text-[#F5F5F5] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#737373]"
            />
            <button 
              type="button"
              onClick={() => setSleepValue(sleepValue)}
              className="bg-[#FFFFFF] text-[#0A0A0A] font-semibold text-xs px-4 py-2 rounded-lg hover:bg-[#E5E5E5] transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-[#737373]">Goal: 8 hrs · Today: {sleepValue || '—'} hrs</p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F5F5]">7-Day Performance</h3>
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FFFFFF]"></div>
              <span className="text-[10px] text-[#A3A3A3]">Today: {completedPercent}%</span>
            </div>
          </div>

          {totalCount === 0 ? (
            <div className="h-24 flex items-center justify-center">
              <p className="text-xs text-[#737373]">Add habits to see your performance chart</p>
            </div>
          ) : (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="#737373" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1C1C1C', borderColor: '#2A2A2A', borderRadius: '8px', color: '#F5F5F5', fontSize: '11px' }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <ReferenceLine y={completedPercent} stroke="#404040" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#FFFFFF" 
                    strokeWidth={2} 
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          key={payload.day}
                          cx={cx}
                          cy={cy}
                          r={payload.isToday ? 5 : 3}
                          fill={payload.isToday ? '#FFFFFF' : '#404040'}
                          stroke={payload.isToday ? '#FFFFFF' : '#737373'}
                          strokeWidth={1.5}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[10px] text-[#737373]">
            The highlighted dot is today's real score based on your habits above.
          </p>
        </div>

      </div>

      <div className="border-t border-[#2A2A2A] bg-[#111111] grid grid-cols-3 text-center py-3">
        <button 
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`py-1 transition-colors ${activeTab === 'dashboard' ? 'text-[#FFFFFF] font-bold' : 'text-[#737373] font-medium'}`}
        >
          <span className="text-xs">Dashboard</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-1 transition-colors ${activeTab === 'history' ? 'text-[#FFFFFF] font-bold' : 'text-[#737373] font-medium'}`}
        >
          <span className="text-xs">Progress</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`py-1 transition-colors ${activeTab === 'analytics' ? 'text-[#FFFFFF] font-bold' : 'text-[#737373] font-medium'}`}
        >
          <span className="text-xs">Analytics</span>
        </button>
      </div>

    </div>
  );
}

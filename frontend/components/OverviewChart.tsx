'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

const data = [
  { date: 'Oct 01', sessions: 120 },
  { date: 'Oct 05', sessions: 350 },
  { date: 'Oct 10', sessions: 280 },
  { date: 'Oct 15', sessions: 600 },
  { date: 'Oct 20', sessions: 850 },
  { date: 'Oct 25', sessions: 1100 },
  { date: 'Oct 30', sessions: 1400 },
];

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#71717a" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#71717a" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
          itemStyle={{ color: '#e4e4e7' }}
          labelStyle={{ color: '#a1a1aa' }}
        />
        <Line 
          type="monotone" 
          dataKey="sessions" 
          stroke="#3b82f6" 
          strokeWidth={3} 
          dot={{ r: 4, fill: '#18181b', stroke: '#3b82f6', strokeWidth: 2 }} 
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#18181b' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

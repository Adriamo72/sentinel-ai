
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { SecurityAlert } from '../types';

interface DashboardStatsProps {
  history: SecurityAlert[];
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#475569'];

const DashboardStats: React.FC<DashboardStatsProps> = ({ history }) => {
  const typeDistribution = history.reduce((acc: any[], alert) => {
    const existing = acc.find(a => a.name === alert.tipo_incidente);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: alert.tipo_incidente, value: 1 });
    }
    return acc;
  }, []);

  const alertsByHour = history.reduce((acc: any[], alert) => {
    const hour = alert.timestamp.split(':')[0];
    const existing = acc.find(a => a.hour === hour);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ hour, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Scans" value={history.length} change="+12%" />
        <StatCard title="Critical Events" value={history.filter(h => h.alerta_activa).length} change="+2" color="text-red-500" />
        <StatCard title="Avg Confidence" value={`${(history.reduce((a, b) => a + b.nivel_confianza, 0) / (history.length || 1) * 100).toFixed(0)}%`} change="-1.2%" />
        <StatCard title="System Uptime" value="99.98%" change="+0.01%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Threat Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {typeDistribution.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-xs text-slate-400 uppercase font-bold">{t.name.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Activity Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, color = "text-slate-100" }: { title: string, value: string | number, change: string, color?: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h4>
    <div className="flex items-end justify-between">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-green-500 font-mono font-bold bg-green-500/10 px-1.5 py-0.5 rounded">{change}</span>
    </div>
  </div>
);

export default DashboardStats;

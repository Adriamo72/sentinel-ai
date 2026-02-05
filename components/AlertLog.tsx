
import React from 'react';
import { AlertCircle, Zap, ShieldX, Activity } from 'lucide-react';
import { SecurityAlert } from '../types';

interface AlertLogProps {
  alerts: SecurityAlert[];
}

const AlertLog: React.FC<AlertLogProps> = ({ alerts }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[400px]">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Alerts</h3>
        <span className="px-2 py-0.5 bg-red-950 text-red-500 text-[10px] font-bold rounded border border-red-900/50">
          {alerts.length} SYSTEM BREACHES
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-40 grayscale">
            <Zap size={32} className="text-blue-500 mb-2" />
            <p className="text-xs text-center">Patrol integrity maintained. No active threats detected.</p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl relative overflow-hidden group hover:bg-red-950/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-600 rounded-lg shrink-0 shadow-lg shadow-red-900/40">
                  <ShieldX size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-red-400 uppercase tracking-tighter truncate">
                      {alert.tipo_incidente.replace('_', ' ')}
                    </h4>
                    <span className="text-[10px] text-red-500/80 font-mono">{alert.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    System Response: <span className="text-red-300 italic">{alert.accion_sugerida}</span>
                  </p>
                  
                  <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${alert.nivel_confianza * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Confidence</span>
                    <span className="text-[9px] text-red-400 font-mono">{(alert.nivel_confianza * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                 <AlertCircle size={14} className="text-red-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertLog;


import React from 'react';
import { LogEntry } from '../types';

interface SimulationConsoleProps {
  logs: LogEntry[];
}

const SimulationConsole: React.FC<SimulationConsoleProps> = ({ logs }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
      <div className="p-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 px-2">AZURE FUNCTION LOGS</span>
        <div className="flex gap-2 mr-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 code-font text-xs"
      >
        {logs.length === 0 && (
          <div className="text-slate-700 italic">Waiting for trigger...</div>
        )}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
            <span className={`uppercase font-bold shrink-0 ${
              log.level === 'error' ? 'text-red-500' : 
              log.level === 'warn' ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {log.level}:
            </span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulationConsole;

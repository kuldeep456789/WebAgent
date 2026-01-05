import React, { useRef, useEffect, useState, useCallback } from 'react';
import { InteractionLog } from '../types';
import {
  Terminal,
  BrainCircuit,
  Play,
  Square,
  Eye,
  AlertOctagon,
  Activity,
  Clock,
  Hash,
  AlertCircle,
  Database
} from 'lucide-react';

interface AgentDashboardProps {
  logs: InteractionLog[];
  isThinking: boolean;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  goal: string;
  onGoalChange: (g: string) => void;
  chaosMode: boolean;
  toggleChaos: () => void;
  onScreenshotClick?: (url: string) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  logs,
  isThinking,
  isRunning,
  onStart,
  onStop,
  goal,
  onGoalChange,
  chaosMode,
  toggleChaos,
  onScreenshotClick
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(455);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isThinking]);

  return (
    <div
      style={{ width: `${width}px` }}
      className="h-full flex flex-col bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden relative shrink-0 transition-[width] duration-75 ease-out"
    >
      <div
        onMouseDown={startResizing}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-cyan-500/50 transition-colors ${isResizing ? 'bg-cyan-500' : 'bg-transparent'}`}
      />

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50" />

      <div className="p-5 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isThinking ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
              <BrainCircuit className={`w-5 h-5 ${isThinking ? 'animate-pulse' : ''}`} />
            </div>
            <h2 className="font-bold text-slate-100 tracking-wide text-sm font-mono">NEURAL_CORE</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className={`text-[10px] font-mono px-2 py-1 rounded border ${isRunning ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
              {isRunning ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>

        <div className="mb-5 relative group">
          <label className="text-[10px] text-cyan-500 font-mono font-bold mb-2 flex items-center gap-1 uppercase tracking-wider">
            <Terminal className="w-3 h-3" /> Prime Directive
          </label>
          <div className="relative">
            <input
              type="text"
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
              disabled={isRunning}
              className="w-full bg-[#0B1221] border border-slate-700 rounded-lg p-3 pl-4 text-xs font-mono text-cyan-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              placeholder="Enter instruction protocol..."
            />
            {!isRunning && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-4 bg-cyan-500/50 animate-pulse" />}
          </div>
        </div>

        <div className="flex gap-3">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/40 border border-cyan-400/20 group"
            >
              <Play className="w-3.5 h-3.5 group-hover:fill-current" /> Initialize
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Terminate
            </button>
          )}

          <button
            onClick={toggleChaos}
            title="Toggle Chaos Mode"
            className={`px-4 rounded-lg border transition-all flex items-center justify-center ${chaosMode ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`}
          >
            <AlertOctagon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative bg-[#050A14]/50">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Hash className="w-3 h-3" /> Execution Log
          </span>
          <span className="text-[10px] text-slate-600 font-mono">
            {logs.length} OPS
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 font-mono text-sm scroll-smooth">
          {logs.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-50 space-y-2">
              <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <p className="text-xs uppercase tracking-widest">Awaiting Input</p>
            </div>
          )}

          {logs.map((log, index) => (
            <div key={log.id} className="relative pl-6 before:absolute before:left-[11px] before:top-8 before:bottom-[-20px] before:w-px before:bg-slate-800 last:before:hidden group">
              <div className={`absolute left-0 top-1.5 w-[22px] h-[22px] rounded border flex items-center justify-center bg-[#050A14] z-10 ${log.status === 'SUCCESS' ? 'border-green-500/30 text-green-500' :
                log.status === 'FAILURE' ? 'border-red-500/30 text-red-500' :
                  'border-slate-700 text-slate-600'
                }`}>
                {log.status === 'FAILURE' ? <AlertCircle className="w-3 h-3" /> : <span className="text-[9px] font-bold">{log.stepNumber}</span>}
              </div>

              <div className={`bg-[#0B1221] border rounded-lg p-3 shadow-sm hover:border-slate-700 transition-colors ${log.status === 'FAILURE' ? 'border-red-900/30 bg-red-950/10' : 'border-slate-800'
                }`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${getActionBadgeStyle(log.decision.action)}`}>
                      {log.decision.action === 'DATA' && <Database className="w-3 h-3" />}
                      {log.decision.action}
                    </span>
                    {log.decision.targetId && (
                      <span className="text-[10px] text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={log.decision.targetId}>
                        #{log.decision.targetId}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="text-slate-300 text-xs leading-relaxed mb-2 font-sans opacity-90">
                  {log.decision.reasoning}
                </div>

                {log.screenshot && (
                  <div
                    className="mt-3 overflow-hidden rounded-lg border border-slate-800 shadow-lg cursor-zoom-in group/img"
                    onClick={() => onScreenshotClick?.(log.screenshot!)}
                  >
                    <img
                      src={log.screenshot}
                      alt="Visual Context"
                      className="w-full h-auto object-cover opacity-80 group-hover/img:opacity-100 group-hover/img:scale-[1.02] transition-all duration-300"
                    />
                  </div>
                )}

                {log.decision.observation && (
                  <div className={`mt-2 text-[11px] border p-2 rounded flex items-start gap-2 ${log.status === 'FAILURE'
                    ? 'text-red-300/80 bg-red-950/20 border-red-900/20'
                    : 'text-orange-300/80 bg-orange-950/10 border-orange-900/20'
                    }`}>
                    <Eye className={`w-3 h-3 mt-0.5 shrink-0 ${log.status === 'FAILURE' ? 'text-red-500' : 'text-orange-500'}`} />
                    {log.decision.observation}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center z-10 animate-pulse">
                <Activity className="w-3 h-3 text-cyan-500" />
              </div>
              <div className="bg-[#0B1221] border border-cyan-900/30 rounded-lg p-3 shadow-lg shadow-cyan-900/10">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono mb-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  PROCESSING_NEXT_STATE...
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-cyan-500/50 animate-[shimmer_1s_infinite_linear] w-1/2" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const getActionBadgeStyle = (action: string) => {
  switch (action) {
    case 'CLICK': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'TYPE': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    case 'NAVIGATE': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'OBSERVE': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    case 'DATA': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'FINISH': return 'bg-green-500/10 text-green-400 border border-green-500/20';
    default: return 'bg-slate-800 text-slate-400';
  }
}
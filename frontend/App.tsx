import React, { useState, useEffect, useRef } from 'react';
import { MockBrowser } from './components/MockBrowser';
import { AgentDashboard } from './components/AgentDashboard';
import { SimElement, InteractionLog } from './types';
import { apiService, ActionLog } from './services/api';
import { Sparkles, Layers, Globe, AlertCircle, X, Maximize2 } from 'lucide-react';

const INITIAL_GOAL = "Explore and extract data from the current page.";

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [chaosMode, setChaosMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [lastExtractedData, setLastExtractedData] = useState<string>('');
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);
  const currentDOMRef = useRef<SimElement[]>([]);

  const handleUrlChange = (url: string) => {
    setCurrentUrl(url);
    setErrorMessage(null);
  };

  const handleInteraction = (action: string, targetId: string, value?: string) => {
    if (action === 'NAVIGATE' && targetId) {
      let nextUrl = targetId;
      if (!nextUrl.startsWith('http') && !nextUrl.startsWith('about:')) {
        nextUrl = 'https://' + nextUrl;
      }
      setCurrentUrl(nextUrl);
    }
  };

  const handleDOMUpdate = (elements: SimElement[]) => {
    currentDOMRef.current = elements;
  };

  useEffect(() => {
    let interval: any;

    const pollBackend = async () => {
      try {
        const report = await apiService.getReport();

        if (report.status === 'running') {
          setIsRunning(true);
          setIsThinking(true);
        } else if (report.status === 'completed' || report.status === 'failed') {
          setIsRunning(false);
          setIsThinking(false);
        }

        if (report.logs && report.logs.length > 0) {
          const mappedLogs: InteractionLog[] = report.logs
            .filter((l: ActionLog) => l.action_type !== 'THOUGHT' && l.action_type !== 'SYSTEM' || l.description.includes("complete"))
            .map((l: ActionLog, idx: number) => {
              let action: any = 'OBSERVE';
              if (l.action_type === 'ACTION') {
                if (l.description.toLowerCase().includes('click')) action = 'CLICK';
                else if (l.description.toLowerCase().includes('typ')) action = 'TYPE';
                else if (l.description.toLowerCase().includes('navigat')) action = 'NAVIGATE';
                else action = 'CLICK';
              } else if (l.action_type === 'DATA_EXTRACTED') {
                action = 'DATA';
              } else if (l.description.includes("complete")) {
                action = 'FINISH';
              }

              return {
                id: `log-${idx}-${l.timestamp}`,
                timestamp: new Date(l.timestamp).getTime(),
                stepNumber: idx + 1,
                screenshot: l.screenshot,
                decision: {
                  action: action,
                  targetId: 'backend-agent',
                  reasoning: l.description,
                  observation: l.description,
                  confidence: 100
                },
                status: 'SUCCESS'
              } as InteractionLog;
            });

          setLogs(mappedLogs.slice(-10));

          const dataLogs = report.logs.filter((l: ActionLog) => l.action_type === 'DATA_EXTRACTED');
          if (dataLogs.length > 0) {
            setLastExtractedData(dataLogs[dataLogs.length - 1].description);
          }

          if (report.current_page && report.current_page !== currentUrl) {
            setCurrentUrl(report.current_page);
          }
        }

        if (report.issues_found && report.issues_found.length > 0) {
          setErrorMessage(report.issues_found[0]);
        }
      } catch (err) {
        console.error("Backend poll error:", err);
      }
    };

    if (isRunning) {
      pollBackend();
      interval = setInterval(pollBackend, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentUrl]);

  const startAgent = async () => {
    setLogs([]);
    setErrorMessage(null);
    setIsRunning(true);
    setIsThinking(true);

    try {
      await apiService.startTask(currentUrl || "https://en.wikipedia.org/wiki/Quantum_computing", goal);
    } catch (e: any) {
      setErrorMessage("Failed to start backend agent. Is the backend server running on port 8000?");
      setIsRunning(false);
      setIsThinking(false);
    }
  };

  const stopAgent = () => {
    setIsRunning(false);
    setIsThinking(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#030712] text-slate-200 overflow-hidden relative selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-30 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent pointer-events-none z-0" />

      <div className="flex-1 flex flex-col h-full p-6 gap-6 relative z-10">
        <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-xl shadow-2xl">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tight">AutoWeb Agent</h1>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col items-end group">
              <span className="text-[9px] text-slate-600 font-bold font-mono uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Network</span>
              {errorMessage ? (
                <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-950/20 px-3 py-1.5 rounded-full border border-red-900/30">
                  <AlertCircle className="w-3.5 h-3.5" /> Error
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Connected
                </div>
              )}
            </div>
            <div className="flex flex-col items-end group">
              <span className="text-[9px] text-slate-600 font-bold font-mono uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Environment</span>
              <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-950/20 px-3 py-1.5 rounded-full border border-blue-900/30">
                <Globe className="w-3.5 h-3.5" /> Live Web
              </div>
            </div>
            <div className="flex flex-col items-end group">
              <span className="text-[9px] text-slate-600 font-bold font-mono uppercase tracking-widest mb-1 group-hover:text-purple-500 transition-colors">DOM Parser</span>
              <div className="flex items-center gap-2 text-xs font-medium text-purple-400 bg-purple-950/20 px-3 py-1.5 rounded-full border border-purple-900/30">
                <Layers className="w-3.5 h-3.5" /> Active
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 relative flex flex-col min-h-0">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-purple-500/5 blur-3xl -z-10 rounded-full opacity-40 translate-y-10" />
          <MockBrowser
            currentUrl={currentUrl}
            onUrlChange={handleUrlChange}
            onAction={(action, id, val) => handleInteraction(action, id, val)}
            onDOMUpdate={handleDOMUpdate}
            error={errorMessage}
            lastExtractedData={lastExtractedData}
            inspectScreenshot={zoomedScreenshot}
          />

          {isThinking && (
            <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none border-2 border-cyan-500/20 rounded-xl animate-pulse z-20 flex items-center justify-center overflow-hidden backdrop-blur-[2px]">
              <div className="bg-slate-950/90 px-8 py-4 rounded-full text-cyan-400 font-mono text-xs tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur-xl border border-cyan-500/30 flex items-center gap-4">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                  <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>
                </div>
                PROCESSING VISUAL CONTEXT...
              </div>
            </div>
          )}
        </div>
      </div>

      <AgentDashboard
        logs={logs}
        isThinking={isThinking}
        isRunning={isRunning}
        onStart={startAgent}
        onStop={stopAgent}
        goal={goal}
        onGoalChange={setGoal}
        chaosMode={chaosMode}
        toggleChaos={() => setChaosMode(!chaosMode)}
        onScreenshotClick={(url) => setZoomedScreenshot(url)}
      />

      {zoomedScreenshot && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030712]/95 backdrop-blur-xl animate-in fade-in duration-300 p-12"
          onClick={() => setZoomedScreenshot(null)}
        >
          <div className="absolute top-8 right-8 flex gap-4">
            <button
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-all border border-slate-700 shadow-2xl group"
              onClick={() => setZoomedScreenshot(null)}
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          <div className="relative max-w-7xl max-h-screen animate-in zoom-in-95 duration-500 ease-out-expo">
            <img
              src={zoomedScreenshot}
              alt="Live Browser Session Capture"
              className="w-full h-auto rounded-2xl border-2 border-slate-800 shadow-[0_0_100px_rgba(34,211,238,0.1)] transition-transform"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 text-xs font-mono text-cyan-400 flex items-center gap-3 shadow-2xl">
              <Maximize2 className="w-4 h-4" />
              SESSION_VISUAL_CAPTURE_ENHANCED
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
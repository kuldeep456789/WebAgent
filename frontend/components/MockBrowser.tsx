import React, { useEffect, useState, useRef } from 'react';
import { MockBrowserProps, SimElement } from '../types';
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Globe, XCircle, Sparkles, Database, Terminal, Eye, Maximize2 } from 'lucide-react';

interface MockBrowserInternalProps extends MockBrowserProps {
  onDOMUpdate: (elements: SimElement[]) => void;
}

export const MockBrowser: React.FC<MockBrowserInternalProps> = ({
  currentUrl,
  onUrlChange,
  onAction,
  onDOMUpdate,
  error,
  lastExtractedData,
  inspectScreenshot
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputUrl(currentUrl);
  }, [currentUrl]);

  useEffect(() => {
    if (!currentUrl) {
      onDOMUpdate([
        { id: 'url-input-main', tag: 'input', placeholder: 'Enter website URL...', visible: true, interactive: true, notes: 'Main search bar on new tab page' },
        { id: 'quick-link-google', tag: 'button', text: 'Google', visible: true, interactive: true },
        { id: 'quick-link-leetcode', tag: 'button', text: 'LeetCode', visible: true, interactive: true },
        { id: 'quick-link-w3schools', tag: 'button', text: 'W3Schools', visible: true, interactive: true },
        { id: 'quick-link-chatgpt', tag: 'button', text: 'ChatGPT', visible: true, interactive: true },
        { id: 'quick-link-gemini', tag: 'button', text: 'Gemini', visible: true, interactive: true },
      ]);
      return;
    }

    const genericDOM: SimElement[] = [
      { id: 'viewport', tag: 'body', text: 'External Website Content', visible: true, interactive: true, notes: 'Real website loaded via IFrame.' },
      { id: 'nav-bar', tag: 'nav', text: 'Browser Navigation', visible: true, interactive: true },
      { id: 'browser-address-bar', tag: 'input', type: 'text', placeholder: 'Search...', visible: true, interactive: true, notes: 'Top address bar' },
    ];
    onDOMUpdate(genericDOM);
  }, [currentUrl, onDOMUpdate]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let url = inputUrl.trim();
    if (!url) return;

    if (!url.startsWith('http') && !url.startsWith('about:')) {
      url = 'https://' + url;
    }
    setIsLoading(true);
    onUrlChange(url);
    setTimeout(() => setIsLoading(false), 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden flex flex-col shadow-2xl bg-white ring-1 ring-slate-800/50 relative">
      <div className="bg-[#f3f5f7] px-4 py-3 flex items-center gap-4 border-b border-[#e1e4e8] z-20 relative shadow-sm">
        <div className="flex items-center gap-3 text-slate-500">
          <button className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button className="p-1 hover:bg-slate-200 rounded transition-colors"><ChevronRight className="w-4 h-4" /></button>
          <button
            onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); }}
            className={`p-1 hover:bg-slate-200 rounded transition-colors ${isLoading ? 'animate-spin text-blue-500' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-white rounded-lg border border-slate-300 shadow-sm group-focus-within:ring-2 group-focus-within:ring-blue-500/20 group-focus-within:border-blue-400"></div>
          <div className="relative flex items-center px-3 py-1.5">
            <Globe className="w-3 h-3 text-slate-400 mr-2" />
            <input
              ref={inputRef}
              type="text"
              id="browser-address-bar"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or enter website name"
              className="flex-1 outline-none font-sans text-xs text-slate-700 bg-transparent placeholder-slate-400"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px] z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium font-mono uppercase tracking-widest animate-pulse">Syncing Browser State...</p>
            </div>
          </div>
        )}

        {inspectScreenshot && (
          <div className="absolute inset-0 z-[40] animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <div className="absolute inset-4 overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black flex items-center justify-center group">
              <img
                src={inspectScreenshot}
                className="w-full h-full object-contain"
                alt="Inspected Observation"
              />
              <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[10px] font-mono text-white flex items-center gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3" />
                ENHANCED_OBSERVATION_PREVIEW
              </div>
            </div>
          </div>
        )}

        {lastExtractedData && (
          <div className="absolute top-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl shadow-2xl p-5 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">Real Data Extracted</h3>
                    <p className="text-[10px] text-emerald-500/70 font-mono">AGENT_VISION_LOGS</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 animate-pulse">LIVE</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-black/40 rounded-lg p-4 border border-slate-800 group-hover:border-emerald-500/20 transition-colors shadow-inner">
                  <div className="flex flex-col gap-2">
                    {lastExtractedData.includes('|') ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/10">
                            {lastExtractedData.split('|')[0].replace('TIME: ', '')}
                          </span>
                          <span className="h-[1px] flex-1 bg-slate-800"></span>
                        </div>
                        <div className="text-sm text-slate-200 font-sans leading-relaxed pl-1">
                          {lastExtractedData.split('|')[1].replace(' RESULT: ', '')}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-200 font-sans leading-relaxed">
                        {lastExtractedData}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentUrl ? (
          <div className="w-full h-full bg-[#f8f9fa] flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-slate-200 to-white rounded-2xl shadow-xl flex items-center justify-center mb-8 border border-white">
              <Globe className="w-10 h-10 text-slate-400" />
            </div>
            <div className="flex flex-wrap gap-4 mt-8 justify-center max-w-2xl px-4">
              <button onClick={() => { setInputUrl('google.com'); onUrlChange('https://google.com'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-200/50 transition-colors group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-blue-500 border border-slate-100 group-hover:-translate-y-1 transition-transform">G</div>
                <span className="text-xs text-slate-500">Google</span>
              </button>
              <button onClick={() => { setInputUrl('leetcode.com'); onUrlChange('https://leetcode.com'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-200/50 transition-colors group">
                <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-[#ffa116] border border-slate-100 group-hover:-translate-y-1 transition-transform">LC</div>
                <span className="text-xs text-slate-500">LeetCode</span>
              </button>
              <button onClick={() => { setInputUrl('w3schools.com'); onUrlChange('https://www.w3schools.com'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-200/50 transition-colors group">
                <div className="w-12 h-12 bg-[#04AA6D] rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-white border border-slate-100 group-hover:-translate-y-1 transition-transform">W3</div>
                <span className="text-xs text-slate-500">W3Schools</span>
              </button>
              <button onClick={() => { setInputUrl('chat.openai.com'); onUrlChange('https://chat.openai.com'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-200/50 transition-colors group">
                <div className="w-12 h-12 bg-[#74aa9c] rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-white border border-slate-100 group-hover:-translate-y-1 transition-transform">AI</div>
                <span className="text-xs text-slate-500">ChatGPT</span>
              </button>
              <button onClick={() => { setInputUrl('gemini.google.com'); onUrlChange('https://gemini.google.com'); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-200/50 transition-colors group">
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm text-lg font-bold text-white border border-slate-100 group-hover:-translate-y-1 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-500">Gemini</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <div className="absolute top-0 left-0 w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center text-[10px] text-amber-800 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <span className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-3 h-3" />
                READ-ONLY MODE: Simulated browser interaction.
              </span>
            </div>
            <iframe
              src={currentUrl}
              className="w-full h-full border-none bg-white opacity-40 grayscale-[0.5]"
              title="Real Website View"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 z-50 animate-[slideUp_0.3s_ease-out]">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-xl flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">Agent Encountered an Issue</h4>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">
                  {error}
                </p>
              </div>
              <button className="text-red-400 hover:text-red-600 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
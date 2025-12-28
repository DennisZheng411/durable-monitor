
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from './types';
import { FRONTEND_FILES } from './constants';
import SimulationConsole from './components/SimulationConsole';
import CodeBlock from './components/CodeBlock';
import { 
  Zap, 
  Monitor,
  Activity,
  Loader2,
  CheckCircle2,
  Play,
  Link2,
  Settings,
  Info,
  ShieldCheck,
  Server,
  Database,
  RefreshCw,
  Cpu,
  Braces,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  AlertTriangle,
  Layers,
  ExternalLink,
  Globe,
  Copy,
  Terminal,
  Trophy,
  History,
  Eye,
  Code2,
  RotateCw
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'run-workflow' | 'link-guide' | 'logs'>('run-workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [lastRawResponse, setLastRawResponse] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [absoluteStatusUrl, setAbsoluteStatusUrl] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  const cleanupInterval = () => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const pollStatus = async (targetUrl: string, isManual = false) => {
    try {
      if (!isManual) setPollCount(prev => prev + 1);
      
      // 添加去缓存随机因子，防止浏览器返回过期的 Pending 状态
      const cacheBuster = `&_t=${Date.now()}`;
      const urlWithCacheBuster = targetUrl + (targetUrl.includes('?') ? cacheBuster : `?${cacheBuster}`);
      
      const statusRes = await fetch(urlWithCacheBuster);
      
      if (!statusRes.ok) {
        addLog(`HTTP ${statusRes.status}: 无法获取状态`, "warn");
        return;
      }
      
      const statusInfo = await statusRes.json();
      setLastRawResponse(statusInfo);
      setRuntimeStatus(statusInfo.runtimeStatus);
      
      const isDone = ['Completed', 'Succeeded'].includes(statusInfo.runtimeStatus);
      const isFailed = ['Failed', 'Terminated', 'Canceled'].includes(statusInfo.runtimeStatus);

      if (isDone) {
        cleanupInterval();
        setFinalResult(statusInfo.output);
        setIsRunning(false);
        addLog(`✅ 数据同步完成: 实例已结束。`, "info");
      } else if (isFailed) {
        cleanupInterval();
        setIsRunning(false);
        setErrorInfo(`Pipeline Error: ${statusInfo.runtimeStatus}`);
        addLog(`❌ 实例异常: ${statusInfo.runtimeStatus}`, "error");
      }
    } catch (pollErr: any) {
      addLog(`通信异常: ${pollErr.message}`, "error");
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    cleanupInterval();
    setIsRunning(true);
    setFinalResult(null);
    setLastRawResponse(null);
    setInstanceId(null);
    setErrorInfo(null);
    setPollCount(0);
    setRuntimeStatus('Pending');
    addLog("🚀 发起云端 Pipeline 触发...", "info");

    try {
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`后端触发失败 (${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      setAbsoluteStatusUrl(clientUrls.statusQueryGetUri);
      
      addLog(`✅ 实例 ${clientUrls.id.substring(0, 8)} 已启动`, "info");

      pollIntervalRef.current = window.setInterval(() => {
        pollStatus(clientUrls.statusQueryGetUri);
      }, 1500); // 略微加快频率

    } catch (err: any) {
      setErrorInfo(err.message);
      setIsRunning(false);
      addLog(`触发异常: ${err.message}`, "error");
    }
  };

  const parseResult = (data: any) => {
    if (data === null || data === undefined) return { raw: "No Output", amount: null };
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data);
    // 增强正则表达式：匹配 $ 符号后的数字，或者任何包含的数字
    const amountMatch = raw.match(/\$(\d+)/) || raw.match(/Global Sales = (\d+)/) || raw.match(/(\d+)/);
    return {
        raw,
        amount: amountMatch ? amountMatch[1] : null
    };
  };

  // 手动强制同步
  const forceSync = () => {
    if (absoluteStatusUrl) {
        addLog("正在强制深度同步状态...", "warn");
        pollStatus(absoluteStatusUrl, true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#020617] text-slate-200">
      {/* 顶部导航 */}
      <header className="bg-slate-900/60 backdrop-blur-3xl px-8 py-5 sticky top-0 z-50 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase">Cloud Analytics <span className="text-blue-500">Pro</span></h1>
            <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Azure Connection: Active</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'run-workflow', icon: <Monitor size={14}/>, label: '实时监控' },
            { id: 'link-guide', icon: <Layers size={14}/>, label: '架构文档' },
            { id: 'logs', icon: <Terminal size={14}/>, label: '运行日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6 lg:p-10">
        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-8">
              {/* 控制面板 */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-8">
                        <div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-4">Runtime Engine</span>
                            <div className="p-6 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3.5 h-3.5 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : runtimeStatus === 'Completed' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}></div>
                                    <span className="font-black text-2xl tracking-tighter text-white uppercase">{runtimeStatus}</span>
                                </div>
                                {isRunning && (
                                    <button 
                                      onClick={forceSync}
                                      className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600/40 transition-colors"
                                      title="强制刷新状态"
                                    >
                                      <RotateCw size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={startRealWorkflow}
                                disabled={isRunning}
                                className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-900/20 hover:bg-blue-500 disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {isRunning ? <Loader2 size={24} className="animate-spin"/> : <Zap size={24} fill="currentColor" />}
                                <span className="text-lg uppercase tracking-tight">Run Pipeline</span>
                            </button>
                            <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">利用已配置的 CORS 直接与云端同步</p>
                        </div>

                        {instanceId && (
                            <div className="pt-8 border-t border-white/5">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-3">Target Instance ID</span>
                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <code className="text-[10px] text-blue-500/70 font-mono truncate mr-2">{instanceId}</code>
                                    <History size={12} className="text-slate-800 shrink-0" />
                                </div>
                                {isRunning && (
                                    <div className="mt-4 flex justify-between items-center text-[9px] font-black text-slate-700 uppercase">
                                        <span>Poll Cycle</span>
                                        <span className="text-blue-600">{pollCount}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                 </div>

                 {/* 数据透视视图 */}
                 {lastRawResponse && (
                    <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/5 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Eye size={16} className="text-blue-500" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Sync Inspector</h4>
                            </div>
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-mono text-slate-500">JSON</span>
                        </div>
                        <div className="p-4 bg-black/60 rounded-xl border border-white/5 max-h-[180px] overflow-y-auto custom-scrollbar">
                            <pre className="text-[10px] font-mono text-emerald-400/70 leading-relaxed italic">
                                {JSON.stringify(lastRawResponse, null, 2)}
                            </pre>
                        </div>
                    </div>
                 )}
              </div>

              {/* 视觉结果展示 */}
              <div className="lg:col-span-8">
                 <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] shadow-2xl flex flex-col h-full min-h-[720px] relative overflow-hidden backdrop-blur-sm">
                    <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><Braces size={28}/></div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight uppercase">Process Output</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Live from Central US</p>
                            </div>
                        </div>
                        <Globe size={20} className="text-slate-800" />
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-center relative">
                        {!isRunning && !finalResult && !errorInfo && (
                            <div className="text-center opacity-10">
                                <Database size={80} className="text-slate-400 mx-auto mb-6" />
                                <p className="text-slate-400 font-black text-2xl uppercase tracking-[0.4em]">Engine Standby</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="text-center space-y-12">
                                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 border-[6px] border-blue-500/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <Activity size={40} className="text-blue-500 animate-pulse"/>
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-white font-black text-4xl uppercase tracking-tighter">Syncing Lifecycle...</h2>
                                    <div className="flex items-center justify-center gap-1.5">
                                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-pulse" style={{animationDelay: `${i*0.2}s`}}></div>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {finalResult && (
                            <div className="w-full space-y-10 animate-in zoom-in-95 duration-700">
                                <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/30 border border-blue-500/20 rounded-[4rem] p-16 relative overflow-hidden group shadow-inner">
                                    <div className="absolute -right-20 -bottom-20 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12 pointer-events-none font-black text-[20rem]">RESULT</div>
                                    
                                    <div className="flex justify-between items-start mb-16">
                                        <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/10">
                                            <CheckCircle2 size={16}/> Pipeline Verified: Success
                                        </div>
                                        <Trophy size={28} className="text-amber-500/60" />
                                    </div>

                                    <div className="flex items-end gap-8 mb-16">
                                        <span className="text-[14rem] font-black text-white tracking-tighter leading-[0.7] drop-shadow-[0_25px_50px_rgba(37,99,235,0.4)]">
                                            ${parseResult(finalResult).amount || "???"}
                                        </span>
                                        <div className="mb-6">
                                            <span className="text-blue-400 font-black text-4xl block leading-none">USD</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 block">Consolidated Global Total</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div className="p-6 bg-black/50 border border-white/5 rounded-[2rem] flex items-center gap-5 backdrop-blur-md">
                                            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><TrendingUp size={20}/></div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Architecture</span>
                                                <span className="text-white font-bold tracking-tight text-lg italic uppercase">Durable Serverless</span>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-black/50 border border-white/5 rounded-[2rem] flex items-center gap-5 backdrop-blur-md">
                                            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl"><ShieldCheck size={20}/></div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase block tracking-widest mb-1">Data Origin</span>
                                                <span className="text-white font-bold tracking-tight text-lg italic uppercase">Cloud Activity Node</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-10 relative">
                                    <div className="absolute top-0 right-10 -translate-y-1/2 flex gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <Code2 size={16} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud Orchestrator Output</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Type: String</span>
                                    </div>
                                    <pre className="text-blue-400/70 font-mono text-sm overflow-x-auto custom-scrollbar leading-relaxed bg-black/20 p-6 rounded-2xl border border-white/5">
                                        <code>{parseResult(finalResult).raw}</code>
                                    </pre>
                                </div>
                            </div>
                        )}

                        {errorInfo && (
                            <div className="text-center space-y-8 animate-in shake duration-500">
                                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-2xl shadow-red-500/10">
                                    <AlertTriangle size={40} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-3xl uppercase tracking-tighter mb-3">Sync Failure</h3>
                                    <p className="text-red-400/60 font-medium max-w-md mx-auto leading-relaxed">{errorInfo}</p>
                                </div>
                                <button onClick={startRealWorkflow} className="px-10 py-4 bg-red-600/20 text-red-500 rounded-2xl font-black uppercase text-xs hover:bg-red-600/30 transition-all border border-red-500/20">Restart Engine</button>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'link-guide' && (
           <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
              <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5">
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Pipeline Linkage</h2>
                 <p className="text-slate-400 font-medium leading-relaxed mb-10 text-lg">
                    该架构利用 Azure Static Web Apps 的内置 API 代理，避开跨域限制的同时，通过 Durable 实例地址实现高性能状态监听。
                 </p>
                 <div className="space-y-4">
                    {[
                        { t: "Proxy Trigger", d: "前端通过 /api 相对路径触发，不暴露后端真实域名。" },
                        { t: "Cache-Bust Sync", d: "使用动态 Query 参数绕过浏览器缓存，获取毫秒级状态更新。" },
                        { t: "Output Mapping", d: "Orchestrator 完成后，结果通过 Regex 自动广播至 UI 解析器。" }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex gap-6 items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center font-black">0{i+1}</div>
                            <div>
                                <h4 className="font-black text-white uppercase text-xs tracking-widest">{item.t}</h4>
                                <p className="text-xs text-slate-500 font-bold mt-1">{item.d}</p>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
              <CodeBlock code={`// 监听并强制刷新状态
const interval = setInterval(async () => {
  // 添加 _t= 参数防止缓存
  const res = await fetch(\`\${statusUrl}&_t=\${Date.now()}\`);
  const info = await res.json();
  
  if (info.runtimeStatus === 'Completed') {
    render(info.output);
  }
}, 1500);`} title="SyncEngine.v2.ts" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[700px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="p-12 border-t border-white/5 text-center opacity-30">
         <span className="text-[10px] font-black uppercase tracking-[0.6em]">Azure Durable Orchestration Console — v3.2-Stable</span>
      </footer>
    </div>
  );
};

export default App;

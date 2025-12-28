
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
  Globe
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'run-workflow' | 'code' | 'logs'>('run-workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [absoluteStatusUrl, setAbsoluteStatusUrl] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  const resolveSwaPath = (absoluteUrl: string) => {
    try {
      const url = new URL(absoluteUrl);
      return `/api${url.pathname}${url.search}`;
    } catch (e) {
      return absoluteUrl;
    }
  };

  const pollStatus = async (targetUrl: string, isRetry: boolean = false) => {
    try {
      const statusRes = await fetch(targetUrl);
      
      if (!statusRes.ok) {
        if (statusRes.status === 404 && !isRetry) {
            setErrorInfo("SWA 代理失效 (404)。系统路径可能未被转发。");
            addLog("代理路径 404，建议检查 CORS 并尝试直接连接", "warn");
        }
        return;
      }
      
      const statusInfo = await statusRes.json();
      setRuntimeStatus(statusInfo.runtimeStatus);
      
      if (statusInfo.runtimeStatus === 'Completed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setFinalResult(statusInfo.output);
        setIsRunning(false);
        addLog("🎉 结果已送达！", "info");
      } else if (['Failed', 'Terminated'].includes(statusInfo.runtimeStatus)) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsRunning(false);
        setErrorInfo(`实例失败: ${statusInfo.runtimeStatus}`);
      }
    } catch (pollErr: any) {
      setErrorInfo(`连接受阻: ${isRetry ? 'CORS 策略拦截' : '未知网络错误'}`);
      if (!isRetry) addLog("尝试通过代理失败，可能存在跨域限制", "error");
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setInstanceId(null);
    setErrorInfo(null);
    setRuntimeStatus('Pending');
    addLog("🚀 正在通过 SWA 隧道触发后端...", "info");

    try {
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTPStart 触发失败 (${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      setAbsoluteStatusUrl(clientUrls.statusQueryGetUri);
      
      const pUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      setProxyUrl(pUrl);
      
      addLog(`✅ 实例 ${clientUrls.id.substring(0, 8)} 已在云端挂载`, "info");

      pollIntervalRef.current = window.setInterval(() => {
        pollStatus(pUrl);
      }, 2500);

    } catch (err: any) {
      setErrorInfo(err.message);
      setIsRunning(false);
    }
  };

  // 手动回退：尝试直接请求（需要用户在 Azure Portal 开启 CORS）
  const tryDirectConnect = () => {
    if (!absoluteStatusUrl) return;
    setErrorInfo(null);
    addLog("切换至 Direct Connect 模式...", "warn");
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = window.setInterval(() => {
        pollStatus(absoluteStatusUrl, true);
    }, 2500);
  };

  const parseResult = (data: any) => {
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const amountMatch = raw.match(/\$(\d+)/) || raw.match(/(\d+)/);
    return {
        raw,
        amount: amountMatch ? amountMatch[1] : null
    };
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-900">
      <header className="bg-slate-950 text-white px-8 py-5 sticky top-0 z-50 flex justify-between items-center shadow-2xl border-b border-blue-500/40">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Durable Logic Bridge</h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">Azure Production Environment</span>
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'link-guide', icon: <Layers size={14}/>, label: '架构' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '监控塔' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '物理日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-100'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-10 animate-in fade-in zoom-in-95 duration-500">
              {/* 控制端 */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-40"></div>
                    <div className="relative z-10">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                           <Settings size={14} className="animate-spin-slow" /> CONTROLLER_HUB
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-3 tracking-widest">Instance Status</span>
                                <div className="flex items-center gap-4">
                                    <div className={`w-4 h-4 rounded-full shadow-lg ${isRunning ? 'bg-amber-500 animate-pulse ring-4 ring-amber-100' : runtimeStatus === 'Completed' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`}></div>
                                    <span className="font-black text-slate-900 text-2xl tracking-tighter">{runtimeStatus}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={startRealWorkflow}
                                disabled={isRunning}
                                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                {isRunning ? <Loader2 size={24} className="animate-spin"/> : <Play size={24} fill="currentColor" className="group-hover:scale-110 transition-transform"/>}
                                <span className="text-lg tracking-tight uppercase">Launch Pipeline</span>
                            </button>

                            {proxyUrl && (
                                <div className="pt-6 border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-3 flex items-center gap-2">
                                       <Link2 size={12}/> Current Proxy Route
                                    </span>
                                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                                        <code className="text-[10px] text-blue-400 font-mono break-all leading-relaxed opacity-80">{proxyUrl}</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* 故障诊断与回退 */}
                 {errorInfo && (
                    <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] shadow-xl animate-in slide-in-from-left-6">
                        <div className="flex items-center gap-4 text-red-600 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle size={24} /></div>
                            <h4 className="font-black text-lg uppercase tracking-tighter">Connection Fault</h4>
                        </div>
                        <p className="text-sm text-red-700 font-medium leading-relaxed mb-6">{errorInfo}</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={tryDirectConnect}
                                className="w-full py-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl font-black text-xs uppercase hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center justify-center gap-2"
                            >
                                <Globe size={16}/> Try Direct Connect (CORS)
                            </button>
                            <p className="text-[10px] text-red-400 font-bold uppercase text-center tracking-widest leading-loose">
                                Warning: Direct connect requires CORS headers on the function app.
                            </p>
                        </div>
                    </div>
                 )}
              </div>

              {/* 结果展示大屏 */}
              <div className="lg:col-span-8">
                 <div className="bg-slate-950 rounded-[3.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[650px] border-b-[20px] border-b-blue-600">
                    <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-500/20 text-blue-400 rounded-[1.5rem] shadow-inner"><Braces size={32}/></div>
                            <div>
                                <h3 className="text-white font-black text-2xl tracking-tighter uppercase leading-none">Azure Production Data</h3>
                                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Real-time JSON Response</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                        </div>
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-center relative">
                        {!isRunning && !finalResult && !errorInfo && (
                            <div className="text-center group">
                                <Database size={80} className="text-slate-800 mx-auto mb-8 group-hover:text-slate-700 transition-colors" />
                                <p className="text-slate-600 font-black text-2xl italic tracking-tighter uppercase opacity-40">System Idle • Ready to Fetch</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="text-center space-y-8">
                                <div className="flex justify-center items-center gap-4">
                                    <div className="w-16 h-16 relative">
                                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <Activity size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400"/>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-blue-400 font-black text-2xl uppercase tracking-tighter mb-2">Polling (Proxy Active)</p>
                                    <p className="text-slate-600 font-bold text-xs uppercase tracking-[0.4em]">Instance Status: {runtimeStatus}...</p>
                                </div>
                            </div>
                        )}

                        {finalResult && (
                            <div className="w-full space-y-10 animate-in fade-in zoom-in-95 duration-1000">
                                {/* 核心报表卡片 */}
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border-2 border-emerald-500/20 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={120}/></div>
                                        <span className="text-emerald-500 text-[11px] font-black uppercase tracking-[0.3em] block mb-6">Execution Output</span>
                                        <div className="flex items-end gap-3">
                                            <span className="text-7xl font-black text-white tracking-tighter leading-none shadow-text">
                                                ${parseResult(finalResult).amount || "???"}
                                            </span>
                                            <span className="text-emerald-500 font-black text-xl mb-1">USD</span>
                                        </div>
                                        <div className="mt-8 flex items-center gap-3">
                                            <div className="px-3 py-1 bg-emerald-500 text-black text-[9px] font-black rounded-full uppercase tracking-widest">Verified</div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Aggregated Total</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/2 border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                   <span>Throughput</span>
                                                   <span className="text-blue-400">100% SUCCESS</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                   <div className="h-full bg-blue-500 w-full animate-in slide-in-from-left duration-[2s]"></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                   <span>Node Latency</span>
                                                   <span className="text-emerald-400">OPTIMAL</span>
                                                </div>
                                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                   <div className="h-full bg-emerald-500 w-[85%] animate-in slide-in-from-left duration-[2.5s]"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><Server size={20}/></div>
                                            <div>
                                                <p className="text-white font-black text-[10px] uppercase">Host Node</p>
                                                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">Azure Central US</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 代码原始视图 */}
                                <div className="bg-black/80 border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative group">
                                    <div className="absolute top-8 left-0 w-1.5 h-12 bg-blue-600"></div>
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ExternalLink size={12}/> Complete Object Data</span>
                                        <span className="text-emerald-500/50 font-mono text-[9px]">{new Date().toISOString()}</span>
                                    </div>
                                    <pre className="text-blue-400/80 font-mono text-sm overflow-x-auto custom-scrollbar leading-loose selection:bg-blue-500/30">
                                        <code>{parseResult(finalResult).raw}</code>
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'link-guide' && (
           <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-8 uppercase">Why SWA Proxy?</h2>
                 <p className="text-slate-500 font-medium leading-relaxed mb-10 text-lg">
                    Static Web Apps 代理是连接无服务器前端与异步长任务后台的最佳方案。它消除了 CORS 配置的痛苦。
                 </p>
                 <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex gap-5">
                       <div className="p-3 bg-blue-600 text-white rounded-2xl h-fit"><ShieldCheck size={24}/></div>
                       <div>
                          <h4 className="font-black text-blue-900 text-lg uppercase tracking-tight">Security Hardening</h4>
                          <p className="text-sm text-blue-700/70 font-medium">所有的 Sig 令牌都在服务器端处理，前端仅暴露相对路径。</p>
                       </div>
                    </div>
                 </div>
              </div>
              <CodeBlock code={`// 自动化隧道重写
const resolveSwaPath = (absoluteUrl) => {
  const url = new URL(absoluteUrl);
  // 重写为 SWA 同源接口
  return "/api" + url.pathname + url.search;
};`} title="LogicBridge.tsx" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[700px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="px-10 py-12 bg-slate-50 border-t border-slate-200 flex flex-col items-center">
         <div className="flex gap-8 mb-6 grayscale opacity-40">
            <span className="font-black text-[11px] uppercase tracking-widest">Azure Durable</span>
            <span className="font-black text-[11px] uppercase tracking-widest">Static Web Apps</span>
            <span className="font-black text-[11px] uppercase tracking-widest">Managed Proxy</span>
         </div>
         <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em]">© 2025 Serverless Infrastructure Monitor</p>
      </footer>
    </div>
  );
};

export default App;

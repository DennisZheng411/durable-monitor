
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
  Terminal
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'run-workflow' | 'link-guide' | 'logs'>('run-workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'CORS' | '404' | null>(null);
  const [absoluteStatusUrl, setAbsoluteStatusUrl] = useState<string | null>(null);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const currentOrigin = window.location.origin;

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

  const pollStatus = async (targetUrl: string, isDirect: boolean = false) => {
    try {
      const statusRes = await fetch(targetUrl);
      
      if (!statusRes.ok) {
        if (statusRes.status === 404) {
            setErrorType('404');
            setErrorInfo("SWA 代理不转发系统 Webhook 路径。请切换至直接连接模式并配置 CORS。");
        }
        return;
      }
      
      const statusInfo = await statusRes.json();
      setRuntimeStatus(statusInfo.runtimeStatus);
      
      if (statusInfo.runtimeStatus === 'Completed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setFinalResult(statusInfo.output);
        setIsRunning(false);
        addLog("🎉 捕获到执行结果！", "info");
      } else if (['Failed', 'Terminated'].includes(statusInfo.runtimeStatus)) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsRunning(false);
        setErrorInfo(`实例失败: ${statusInfo.runtimeStatus}`);
      }
    } catch (pollErr: any) {
      if (isDirect) {
        setErrorType('CORS');
        setErrorInfo("直接连接失败：CORS 策略拦截。浏览器无法获取后台数据。");
      } else {
        setErrorInfo("网络连接异常，请检查后端运行状态。");
      }
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setInstanceId(null);
    setErrorInfo(null);
    setErrorType(null);
    setRuntimeStatus('Pending');
    addLog("🚀 发起生产环境调用...", "info");

    try {
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`后端触发失败 (${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      setAbsoluteStatusUrl(clientUrls.statusQueryGetUri);
      
      const pUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      setProxyUrl(pUrl);
      
      addLog(`✅ 实例已启动: ${clientUrls.id.substring(0, 8)}`, "info");

      pollIntervalRef.current = window.setInterval(() => {
        pollStatus(pUrl, false);
      }, 2500);

    } catch (err: any) {
      setErrorInfo(err.message);
      setIsRunning(false);
    }
  };

  const tryDirectConnect = () => {
    if (!absoluteStatusUrl) return;
    setErrorInfo(null);
    setErrorType(null);
    addLog("正在尝试绕过代理直接连接...", "warn");
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = window.setInterval(() => {
        pollStatus(absoluteStatusUrl, true);
    }, 2500);
  };

  // 数据回放：基于您日志中看到的 $850
  const simulateSuccess = () => {
    setFinalResult("FINAL REPORT: Global Sales = $850");
    setRuntimeStatus("Completed");
    setIsRunning(false);
    setErrorInfo(null);
    addLog("成功注入模拟数据 (源自最新日志)", "info");
  };

  const parseResult = (data: any) => {
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const amountMatch = raw.match(/\$(\d+)/) || raw.match(/(\d+)/);
    return {
        raw,
        amount: amountMatch ? amountMatch[1] : null
    };
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    addLog("Origin 已复制到剪贴板", "info");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#0f172a] text-slate-100">
      {/* 极客风头部 */}
      <header className="bg-slate-900/50 backdrop-blur-md px-8 py-4 sticky top-0 z-50 flex justify-between items-center border-b border-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
            <Activity size={20} className="text-white" />
          </div>
          <div className="leading-none">
            <h1 className="text-lg font-black tracking-tighter uppercase text-white">Durable Monitor <span className="text-blue-500">v2.1</span></h1>
            <span className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase">Cloud Pipeline Inspector</span>
          </div>
        </div>

        <nav className="flex bg-slate-800/50 p-1 rounded-xl border border-white/5">
          {[
            { id: 'run-workflow', icon: <Terminal size={12}/>, label: '控制塔' },
            { id: 'link-guide', icon: <Layers size={12}/>, label: '架构' },
            { id: 'logs', icon: <Monitor size={12}/>, label: '系统日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8">
        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-8">
              {/* 控制与诊断栏 */}
              <div className="lg:col-span-4 space-y-6 animate-in slide-in-from-left-6 duration-500">
                 {/* 核心控制卡片 */}
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full group-hover:bg-blue-600/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Controller</span>
                            <Settings size={14} className="text-slate-700 animate-spin-slow" />
                        </div>
                        
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800">
                                <span className="text-[9px] font-black text-slate-600 uppercase block mb-3">Status</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse ring-4 ring-amber-500/20' : runtimeStatus === 'Completed' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-slate-700'}`}></div>
                                    <span className="font-black text-xl text-white tracking-tight">{runtimeStatus}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={startRealWorkflow}
                                disabled={isRunning}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-500 disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                {isRunning ? <Loader2 size={20} className="animate-spin"/> : <Play size={20} fill="currentColor" />}
                                <span className="uppercase tracking-tight">Launch Pipeline</span>
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* 深度故障排除 */}
                 {errorInfo && (
                    <div className="bg-red-950/30 border border-red-500/30 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-6">
                        <div className="flex items-center gap-4 text-red-500 mb-5">
                            <AlertTriangle size={24} />
                            <h4 className="font-black text-sm uppercase tracking-widest">Diagnostic Alert</h4>
                        </div>
                        <p className="text-xs text-red-200/80 font-medium leading-relaxed mb-8">{errorInfo}</p>
                        
                        <div className="space-y-4">
                            {errorType === 'CORS' && (
                                <div className="p-4 bg-black/40 rounded-2xl border border-red-500/20">
                                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-3">Azure Portal CORS Origin:</span>
                                    <div className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl">
                                        <code className="text-[10px] text-blue-400 font-mono truncate">{currentOrigin}</code>
                                        <button onClick={copyOrigin} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><Copy size={14}/></button>
                                    </div>
                                    <p className="mt-4 text-[9px] text-red-400 font-bold leading-relaxed uppercase">
                                       配置路径：Azure Portal > Function App > API > CORS
                                    </p>
                                </div>
                            )}
                            
                            {errorType === '404' && (
                                <button 
                                    onClick={tryDirectConnect}
                                    className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Globe size={14}/> Switch to Direct Mode
                                </button>
                            )}

                            {isRunning && (
                                <button 
                                    onClick={simulateSuccess}
                                    className="w-full py-4 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-600 hover:text-white transition-all"
                                >
                                    Force Simulation (Log $850)
                                </button>
                            )}
                        </div>
                    </div>
                 )}
              </div>

              {/* 数据可视化大屏 */}
              <div className="lg:col-span-8 animate-in fade-in duration-700">
                 <div className="bg-slate-900/80 border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col h-full min-h-[650px] relative overflow-hidden backdrop-blur-sm border-b-[16px] border-b-blue-600">
                    <div className="p-10 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><Braces size={28}/></div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight uppercase">Live Production Data</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Managed Cloud Stream</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-800 animate-pulse"></div>
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-800 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        </div>
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-center">
                        {!isRunning && !finalResult && !errorInfo && (
                            <div className="text-center">
                                <Database size={64} className="text-slate-800 mx-auto mb-8" />
                                <p className="text-slate-600 font-black text-xl uppercase tracking-widest opacity-30">Terminal Ready</p>
                            </div>
                        )}

                        {isRunning && !errorInfo && (
                            <div className="text-center space-y-10">
                                <div className="relative mx-auto w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Globe size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 opacity-50"/>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-blue-400 font-black text-2xl uppercase tracking-tight">Polling Pipeline Status</p>
                                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Handshaking with Azure Control Plane...</p>
                                </div>
                            </div>
                        )}

                        {finalResult && (
                            <div className="w-full space-y-10 animate-in zoom-in-95 duration-700">
                                {/* 巨幕数据 */}
                                <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[2.5rem] p-12 shadow-inner relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={200}/></div>
                                    <span className="text-blue-400 text-[11px] font-black uppercase tracking-[0.4em] block mb-8">Calculated Sales Output</span>
                                    <div className="flex items-end gap-4">
                                        <span className="text-8xl font-black text-white tracking-tighter leading-none">
                                            ${parseResult(finalResult).amount || "???"}
                                        </span>
                                        <span className="text-blue-500 font-black text-2xl mb-2">USD</span>
                                    </div>
                                    <div className="mt-10 flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900"></div>)}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Processed by 4 Compute Nodes</p>
                                    </div>
                                </div>

                                {/* 原始响应 */}
                                <div className="bg-black/60 border border-white/5 rounded-[2rem] p-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Full History Payload</span>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    </div>
                                    <pre className="text-blue-400/80 font-mono text-xs overflow-x-auto custom-scrollbar leading-loose">
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
           <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
              <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800">
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Azure Logic Link</h2>
                 <p className="text-slate-400 font-medium leading-relaxed mb-10 text-lg">
                    Durable Functions 的系统路由（/runtime/webhooks）通常需要显式的 CORS 授权才能由前端直接访问。
                 </p>
                 <div className="grid gap-4">
                    {[
                        { t: "Step 1", d: "通过 /api 触发 HttpStart 后端函数。" },
                        { t: "Step 2", d: "后端返回带 Sig 签名的系统监控地址。" },
                        { t: "Step 3", d: "前端启用轮询，追踪 Orchestrator 生命周期。" }
                    ].map((step, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 flex gap-5">
                            <span className="font-black text-blue-500">{step.t}</span>
                            <p className="text-sm font-bold text-slate-300">{step.d}</p>
                        </div>
                    ))}
                 </div>
              </div>
              <CodeBlock code={`// 兼容性结果解析器
const parseResult = (data) => {
  const str = String(data);
  const match = str.match(/\\$(\\d+)/);
  return match ? match[1] : null;
};`} title="ResponseParser.ts" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[700px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="p-10 border-t border-white/5 flex justify-center opacity-30">
         <div className="flex items-center gap-3">
            <Server size={14}/>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Infrastructure Monitoring Node • {currentOrigin}</span>
         </div>
      </footer>
    </div>
  );
};

export default App;

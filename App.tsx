
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
  Trophy
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'run-workflow' | 'link-guide' | 'logs'>('run-workflow');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [absoluteStatusUrl, setAbsoluteStatusUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  const pollStatus = async (targetUrl: string) => {
    try {
      const statusRes = await fetch(targetUrl);
      if (!statusRes.ok) {
        if (statusRes.status === 404) {
            addLog("状态查询返回 404，实例可能正在初始化或已被清理", "warn");
        }
        return;
      }
      
      const statusInfo = await statusRes.json();
      setRuntimeStatus(statusInfo.runtimeStatus);
      
      if (statusInfo.runtimeStatus === 'Completed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setFinalResult(statusInfo.output);
        setIsRunning(false);
        addLog(`🎉 编排完成！结果: ${JSON.stringify(statusInfo.output)}`, "info");
      } else if (['Failed', 'Terminated'].includes(statusInfo.runtimeStatus)) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsRunning(false);
        setErrorInfo(`实例执行终止: ${statusInfo.runtimeStatus}`);
        addLog(`❌ 实例状态异常: ${statusInfo.runtimeStatus}`, "error");
      }
    } catch (pollErr: any) {
      // 如果 CORS 报错会进入这里
      addLog("连接受阻：请确保 Azure Function CORS 已允许当前 Origin", "error");
      setErrorInfo("网络连接错误：请检查 CORS 配置。");
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setIsRunning(false);
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setInstanceId(null);
    setErrorInfo(null);
    setRuntimeStatus('Pending');
    addLog("🚀 通过 SWA 隧道触发 HttpStart...", "info");

    try {
      // 触发函数保持使用 /api 代理（通常不会有 CORS 问题）
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`后端触发失败 (Status: ${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      setAbsoluteStatusUrl(clientUrls.statusQueryGetUri);
      
      addLog(`✅ 实例已挂载: ${clientUrls.id}`, "info");
      addLog("📡 正在利用 CORS 开启直接轮询监控...", "warn");

      // 既然 CORS 已配，直接轮询绝对路径（避开 SWA 代理 404）
      pollIntervalRef.current = window.setInterval(() => {
        pollStatus(clientUrls.statusQueryGetUri);
      }, 2500);

    } catch (err: any) {
      setErrorInfo(err.message);
      setIsRunning(false);
      addLog(`触发错误: ${err.message}`, "error");
    }
  };

  const parseResult = (data: any) => {
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data);
    // 兼容日志中的 $850 或 $889
    const amountMatch = raw.match(/\$(\d+)/) || raw.match(/(\d+)/);
    return {
        raw,
        amount: amountMatch ? amountMatch[1] : null
    };
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#020617] text-slate-200">
      {/* 顶部状态栏 */}
      <header className="bg-slate-900/80 backdrop-blur-xl px-10 py-5 sticky top-0 z-50 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">Durable Analytics <span className="text-blue-500">Live</span></h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Hybrid-Link Active</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'run-workflow', icon: <Monitor size={14}/>, label: '监控' },
            { id: 'link-guide', icon: <Layers size={14}/>, label: '架构' },
            { id: 'logs', icon: <Terminal size={14}/>, label: '日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-[11px] font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-200'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-10">
              {/* 控制端 */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-slate-900 rounded-[2.5rem] p-10 border border-white/5 shadow-2xl overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">Runtime Engine</span>
                            <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3.5 h-3.5 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse ring-8 ring-amber-500/10' : runtimeStatus === 'Completed' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-slate-700'}`}></div>
                                    <span className="font-black text-2xl tracking-tighter text-white">{runtimeStatus}</span>
                                </div>
                                <Cpu size={20} className="text-slate-800" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={startRealWorkflow}
                                disabled={isRunning}
                                className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black shadow-2xl hover:bg-blue-500 disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                            >
                                {isRunning ? <Loader2 size={24} className="animate-spin"/> : <Zap size={24} fill="currentColor" />}
                                <span className="text-lg uppercase tracking-tight">Run Pipeline</span>
                            </button>
                            <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest leading-loose">
                                利用已配置的 CORS 直接与云端同步
                            </p>
                        </div>

                        {instanceId && (
                            <div className="pt-8 border-t border-white/5">
                                <span className="text-[9px] font-black text-slate-600 uppercase block mb-3">Target Instance ID</span>
                                <div className="p-4 bg-black/60 rounded-2xl border border-white/5">
                                    <code className="text-[10px] text-blue-400 font-mono break-all leading-relaxed">{instanceId}</code>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>

                 {errorInfo && (
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] animate-in slide-in-from-left-6">
                        <div className="flex items-center gap-4 text-red-500 mb-4">
                            <AlertTriangle size={24} />
                            <h4 className="font-black text-sm uppercase tracking-widest">Pipeline Error</h4>
                        </div>
                        <p className="text-xs text-red-200/70 font-medium leading-relaxed">{errorInfo}</p>
                    </div>
                 )}
              </div>

              {/* 结果大屏 */}
              <div className="lg:col-span-8">
                 <div className="bg-slate-900 border border-white/5 rounded-[3.5rem] shadow-2xl flex flex-col h-full min-h-[600px] relative overflow-hidden">
                    {/* 背景装饰 */}
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Server size={300}/></div>

                    <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl"><Braces size={28}/></div>
                            <div>
                                <h3 className="text-white font-black text-xl tracking-tight uppercase">Process Output</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Live from Central US</p>
                            </div>
                        </div>
                        <Globe size={20} className="text-slate-800" />
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-center relative">
                        {!isRunning && !finalResult && !errorInfo && (
                            <div className="text-center">
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                                    <Database size={32} className="text-slate-800" />
                                </div>
                                <p className="text-slate-700 font-black text-xl uppercase tracking-[0.2em] italic">Awaiting Trigger</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="text-center space-y-10">
                                <div className="relative mx-auto w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Activity size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500"/>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-white font-black text-2xl uppercase tracking-tighter">Syncing Lifecycle...</p>
                                    <div className="flex justify-center gap-1.5">
                                        {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}}></div>)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {finalResult && (
                            <div className="w-full space-y-10 animate-in zoom-in-95 duration-1000">
                                {/* 核心奖杯卡片 */}
                                <div className="bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-[3rem] p-12 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><Trophy size={260}/></div>
                                    
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="px-5 py-2 bg-emerald-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 size={14}/> Completed
                                        </div>
                                        <Clock size={20} className="text-emerald-500/30" />
                                    </div>

                                    <div className="flex items-end gap-5 mb-10">
                                        <span className="text-8xl font-black text-white tracking-tighter leading-none">
                                            ${parseResult(finalResult).amount || "???"}
                                        </span>
                                        <div className="mb-2">
                                            <span className="text-emerald-400 font-black text-2xl block leading-none">USD</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Sales</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                                            <TrendingUp size={16} className="text-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stable Output</span>
                                        </div>
                                        <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                                            <ShieldCheck size={16} className="text-blue-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Atomic Integrity</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 原始有效载荷 */}
                                <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Full JSON Payload</span>
                                        <ExternalLink size={14} className="text-slate-700" />
                                    </div>
                                    <pre className="text-blue-400/80 font-mono text-sm overflow-x-auto custom-scrollbar leading-relaxed">
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
              <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5">
                 <h2 className="text-4xl font-black text-white tracking-tighter mb-8 uppercase">Architecture Guide</h2>
                 <p className="text-slate-400 font-medium leading-relaxed mb-10 text-lg">
                    Durable Functions 通过任务检查点确保状态在多个节点间同步。通过 CORS 授权，前端可以直接监听这些检查点的状态变化。
                 </p>
                 <div className="space-y-4">
                    {[
                        { t: "Proxy Trigger", d: "使用 SWA /api 代理保护 HTTPStart 的密钥不被泄露。" },
                        { t: "Direct Polling", d: "利用 CORS 直接查询系统地址，提高轮询性能。" },
                        { t: "Auto Parsing", d: "结果自动匹配正则表达式，处理非 JSON 格式的遗留输出。" }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 flex gap-5">
                            <span className="text-blue-500 font-black">#0{i+1}</span>
                            <div className="space-y-1">
                                <h4 className="font-black text-white uppercase text-sm">{item.t}</h4>
                                <p className="text-xs text-slate-500 font-bold">{item.d}</p>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
              <CodeBlock code={`// 关键：轮询状态地址
const poll = async (url) => {
  const res = await fetch(url);
  const data = await res.json();
  if (data.runtimeStatus === 'Completed') {
     console.log("最终结果:", data.output);
  }
};`} title="LifecycleMonitor.js" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[700px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="p-12 border-t border-white/5 text-center">
         <div className="flex items-center justify-center gap-4 text-slate-600 mb-4">
            <Server size={14}/>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Azure Serverless Infrastructure Console</span>
         </div>
      </footer>
    </div>
  );
};

export default App;

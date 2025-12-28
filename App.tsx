
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
  Layers
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'run-workflow' | 'code' | 'logs'>('link-guide');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [pollingUrl, setPollingUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  /**
   * 核心修复：SWA 隧道路径解析
   * 将 https://[func-app].azurewebsites.net/runtime/webhooks/... 
   * 重写为相对路径 /api/runtime/webhooks/...
   * 这样请求将通过 SWA 代理转发，绕过 CORS 限制。
   */
  const resolveSwaPath = (absoluteUrl: string) => {
    try {
      const url = new URL(absoluteUrl);
      // 保留 pathname 和 search (包含 sig 密钥)
      const proxyPath = `/api${url.pathname}${url.search}`;
      addLog(`🛡️ 路径重定向: ${url.pathname.substring(0, 20)}...`, "warn");
      return proxyPath;
    } catch (e) {
      addLog("路径解析失败，尝试回退模式", "error");
      return absoluteUrl;
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setInstanceId(null);
    setErrorInfo(null);
    setRuntimeStatus('Pending');
    setActiveTab('run-workflow');
    addLog("🚀 发起 HTTPStart 触发指令...", "info");

    try {
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`后端触发失败 (${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      
      const statusUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      setPollingUrl(statusUrl);
      
      addLog(`✅ 实例已启动: ${clientUrls.id.substring(0, 8)}...`, "info");

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(statusUrl);
          
          if (!statusRes.ok) {
            // 如果返回 404 或 401，通常是 SWA 代理未正确配置或 Key 失效
            if (statusRes.status === 404) {
                setErrorInfo("404: 代理路径未找到。请确保 SWA 已正确链接后台 Function。");
            }
            return;
          }
          
          const statusInfo = await statusRes.json();
          setRuntimeStatus(statusInfo.runtimeStatus);
          
          if (statusInfo.runtimeStatus === 'Completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setFinalResult(statusInfo.output);
            setIsRunning(false);
            addLog("🎉 流程执行完毕，抓取到结果数据", "info");
          } else if (['Failed', 'Terminated'].includes(statusInfo.runtimeStatus)) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsRunning(false);
            setErrorInfo(`实例状态异常: ${statusInfo.runtimeStatus}`);
          }
        } catch (pollErr: any) {
          // 捕获跨域错误
          setErrorInfo(`浏览器拦截请求: 检测到跨域 (CORS) 冲突，请检查 SWA 代理配置。`);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsRunning(false);
        }
      }, 2000);

    } catch (err: any) {
      addLog(`连接错误: ${err.message}`, "error");
      setErrorInfo(err.message);
      setRuntimeStatus('Failed');
      setIsRunning(false);
    }
  };

  // 数据解析：尝试从输出中提取日志里看到的金额
  const parseResult = (data: any) => {
    const raw = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const amountMatch = raw.match(/\$?(\d+)/);
    return {
        raw,
        amount: amountMatch ? amountMatch[1] : null
    };
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f4f7f9] text-slate-900">
      {/* 增强型头部 */}
      <header className="bg-slate-900 text-white px-8 py-5 sticky top-0 z-50 flex justify-between items-center shadow-xl border-b border-blue-500/30">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/40 animate-pulse">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Durable Ops Console</h1>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Hybrid Cloud Link: ACTIVE</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '架构' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '监控' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        {activeTab === 'link-guide' && (
           <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                    <ShieldCheck size={240} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Layers className="text-blue-600" /> 为什么需要 SWA 隧道？
                 </h2>
                 <p className="text-slate-600 font-medium leading-relaxed mb-8">
                    在 Azure 生产环境中，您的前端与后端通常属于不同的域名。为了安全，浏览器会阻止这种直接对话。
                 </p>
                 <div className="space-y-4">
                    {[
                        { t: "本地调用", d: "前端直接访问 localhost:7071，容易产生跨域报错。", c: "bg-red-50" },
                        { t: "隧道模式", d: "前端通过 /api 访问，SWA 自动在云端完成物理路由重定向。", c: "bg-emerald-50" }
                    ].map((item, i) => (
                        <div key={i} className={`p-5 rounded-2xl border border-slate-100 ${item.c}`}>
                            <h4 className="font-black text-sm mb-1">{item.t}</h4>
                            <p className="text-xs text-slate-500 font-medium">{item.d}</p>
                        </div>
                    ))}
                 </div>
                 <button onClick={() => setActiveTab('run-workflow')} className="mt-8 w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group">
                    进入监控面板 <ChevronRight className="group-hover:translate-x-1 transition-transform"/>
                 </button>
              </div>
              <div className="space-y-6">
                 <CodeBlock code={`// 关键代码：手动重定向 Webhook 路径
const resolveSwaPath = (absoluteUrl) => {
  const url = new URL(absoluteUrl);
  // 将原有的 Function App 域名隐藏在 /api 之后
  return "/api" + url.pathname + url.search;
};`} title="SwaProxyHelper.js" />
                 <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4">
                    <Info className="text-amber-600 shrink-0" />
                    <div>
                        <h4 className="font-black text-amber-900 text-sm">提示</h4>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">如果您的后台未设置 CORS 允许 Static Web App 的域名，该隧道重定向是唯一的通信方案。</p>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
              <div className="lg:col-span-4 space-y-6">
                 {/* 控制塔 */}
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Pipeline Settings</h3>
                        <div className="space-y-6">
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Instance Runtime</span>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${isRunning ? 'bg-amber-500 animate-pulse' : runtimeStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className="font-black text-slate-800 text-lg">{runtimeStatus}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={startRealWorkflow}
                                disabled={isRunning}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isRunning ? <Loader2 size={20} className="animate-spin"/> : <Play size={20} fill="currentColor"/>}
                                {isRunning ? 'EXECUTING...' : 'START WORKFLOW'}
                            </button>

                            {pollingUrl && (
                                <div className="pt-4 border-t border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Internal Proxy Target</span>
                                    <div className="p-3 bg-slate-900 rounded-xl overflow-hidden">
                                        <code className="text-[9px] text-blue-400 font-mono break-all opacity-70 leading-relaxed">{pollingUrl}</code>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* 故障排查 */}
                 {errorInfo && (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-[2rem] animate-in slide-in-from-left-4">
                        <div className="flex items-center gap-3 text-red-600 mb-3">
                            <AlertTriangle size={20} />
                            <h4 className="font-black text-sm uppercase">通信异常</h4>
                        </div>
                        <p className="text-xs text-red-700 font-medium leading-relaxed">{errorInfo}</p>
                        <div className="mt-4 p-3 bg-white/50 rounded-lg text-[10px] text-red-800 font-bold border border-red-100">
                            建议：请检查 Azure Portal 中 Function App 的 CORS 设置，或确认 API 路由前缀。
                        </div>
                    </div>
                 )}
              </div>

              {/* 结果显示 */}
              <div className="lg:col-span-8">
                 <div className="bg-[#0b0e14] rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px] border-b-[12px] border-b-blue-600 transition-all">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Braces size={24}/></div>
                            <div>
                                <h3 className="text-white font-black text-lg tracking-tight">RESULT ANALYZER</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Output Stream</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-10 flex flex-col justify-center">
                        {!isRunning && !finalResult && !errorInfo && (
                            <div className="text-center opacity-40">
                                <Database size={64} className="text-slate-600 mx-auto mb-6" />
                                <p className="text-white font-black text-xl italic">Ready for Input</p>
                            </div>
                        )}

                        {isRunning && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}}></div>)}
                                </div>
                                <p className="text-blue-400 font-black text-lg uppercase tracking-widest">Listening for completion...</p>
                            </div>
                        )}

                        {finalResult && (
                            <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-700">
                                {/* 销售额高亮展示 */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-[2.5rem] p-8">
                                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest block mb-4">Parsed Result</span>
                                        <div className="flex items-center gap-4">
                                            <div className="text-5xl font-black text-white tracking-tighter">
                                                ${parseResult(finalResult).amount || "???"}
                                            </div>
                                            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                                                <TrendingUp size={20}/>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-widest">Data Extracted Successfully</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-center">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                                <span>Throughput</span>
                                                <span className="text-blue-400">Stable</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 w-full"></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mt-2">
                                                <span>Latency</span>
                                                <span className="text-emerald-400">Optimal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 原始数据详情 */}
                                <div className="bg-black/60 border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                    <pre className="text-emerald-500/90 font-mono text-sm overflow-x-auto custom-scrollbar leading-loose">
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

        {activeTab === 'logs' && (
           <div className="h-[650px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="px-8 py-8 border-t border-slate-200 bg-white/80 text-center">
         <div className="flex items-center justify-center gap-4 text-slate-400">
            <Server size={14}/>
            <span className="text-[10px] font-black uppercase tracking-widest">Azure Durable Architecture Monitoring Terminal</span>
            <Database size={14}/>
         </div>
      </footer>
    </div>
  );
};

export default App;

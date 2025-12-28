
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, StepStatus } from './types';
import { FRONTEND_FILES, INTEGRATION_GUIDE } from './constants';
import SimulationConsole from './components/SimulationConsole';
import CodeBlock from './components/CodeBlock';
import { 
  Zap, 
  Code2,
  Monitor,
  Activity,
  Loader2,
  CheckCircle2,
  Play,
  Layers,
  Link2,
  Globe,
  ArrowRightLeft,
  Settings,
  Info,
  ShieldCheck,
  Server,
  AlertCircle,
  Database,
  Terminal,
  RefreshCw,
  Cpu,
  Braces,
  ChevronRight,
  Eye
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'run-workflow' | 'code' | 'logs'>('link-guide');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
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
   * 强化版 CORS 桥接：
   * 将 https://xxx.azurewebsites.net/runtime/webhooks/durabletask/instances/...
   * 转换为 /api/runtime/webhooks/durabletask/instances/...
   * 这样请求就会通过 SWA 域名发出，彻底解决浏览器跨域限制。
   */
  const resolveSwaPath = (absoluteUrl: string) => {
    try {
      const marker = '/runtime/webhooks/durabletask/';
      if (absoluteUrl.includes(marker)) {
        const urlParams = absoluteUrl.split(marker)[1];
        const proxyPath = `/api/runtime/webhooks/durabletask/${urlParams}`;
        addLog(`🛠️ 跨域代理已激活: 使用 SWA 隧道转发`, "warn");
        return proxyPath;
      }
      return absoluteUrl;
    } catch (e) {
      return absoluteUrl;
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setRuntimeStatus('Initializing...');
    setActiveTab('run-workflow'); // 自动切换到运行界面
    addLog("🚀 发起后端触发请求: POST /api/HttpStart", "info");

    try {
      const response = await fetch('/api/HttpStart', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: 触发失败，请检查后端状态`);
      
      const clientUrls = await response.json();
      const statusUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      setPollingUrl(statusUrl);
      
      addLog(`✅ 实例 ID: ${clientUrls.id.substring(0, 10)}...`, "info");
      addLog(`📡 开启 SWA 代理轮询...`, "info");

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(statusUrl);
          if (!statusRes.ok) {
             addLog(`轮询异常 (${statusRes.status})，重试中...`, "warn");
             return;
          }
          
          const statusInfo = await statusRes.json();
          setRuntimeStatus(statusInfo.runtimeStatus);
          
          if (statusInfo.runtimeStatus === 'Completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            // 这里解析后端日志中提到的 Global Sales 数据
            setFinalResult(statusInfo.output);
            setIsRunning(false);
            addLog("🎉 数据已成功抓取并渲染！", "info");
          } else if (statusInfo.runtimeStatus === 'Failed' || statusInfo.runtimeStatus === 'Terminated') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsRunning(false);
            addLog(`❌ 后端流程终止: ${statusInfo.runtimeStatus}`, "error");
          }
        } catch (pollErr: any) {
          console.warn("Polling error:", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      addLog(`❌ 连接异常: ${err.message}`, "error");
      setRuntimeStatus('Failed');
      setIsRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-200 animate-pulse-azure">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Durable Logic Bridge</h1>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Azure Production Mode</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '配置' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '实时任务' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '日志' },
            { id: 'code', icon: <Code2 size={14}/>, label: '源码' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        
        {activeTab === 'link-guide' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={200} />
                 </div>
                 
                 <div className="flex items-center gap-5 mb-10">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                       <ShieldCheck size={36}/>
                    </div>
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tight">已激活跨域隧道</h2>
                       <p className="text-slate-500 font-bold text-lg">前端已具备自动绕过 CORS 限制的能力</p>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-3 gap-6 mb-10">
                    <div className="p-8 rounded-[2rem] bg-blue-50 border border-blue-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                       <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">1</div>
                       <h4 className="font-black text-blue-900">发起 (POST)</h4>
                       <p className="text-xs text-blue-700/80 leading-relaxed font-medium">调用 /api/HttpStart 触发后端，获取唯一的实例监控令牌。</p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                       <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-black">2</div>
                       <h4 className="font-black text-amber-900">对齐 (Rewrite)</h4>
                       <p className="text-xs text-amber-700/80 leading-relaxed font-medium">将外部域名重写为同源的 /api 路径，欺骗浏览器以通过 CORS 检查。</p>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                       <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black">3</div>
                       <h4 className="font-black text-emerald-900">展示 (Render)</h4>
                       <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">轮询 Completed 状态后，抓取后端日志中生成的数据结果。</p>
                    </div>
                 </div>

                 <div className="flex justify-center">
                    <button 
                      onClick={() => setActiveTab('run-workflow')}
                      className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-4 group"
                    >
                       进入任务执行中心 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'run-workflow' && (
           <div className="animate-in zoom-in-95 duration-500 grid lg:grid-cols-12 gap-8">
              {/* 控制面板 */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="relative z-10">
                       <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                          控制器 <Settings size={20} className="text-slate-400"/>
                       </h3>
                       <div className="space-y-6">
                          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Runtime Status</span>
                                {isRunning && <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>}
                             </div>
                             <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full shadow-sm ${isRunning ? 'bg-amber-500 animate-pulse' : runtimeStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="font-black text-slate-800 text-lg">{runtimeStatus}</span>
                             </div>
                          </div>
                          
                          <button 
                            onClick={startRealWorkflow}
                            disabled={isRunning}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3 text-sm"
                          >
                             {isRunning ? <Loader2 size={20} className="animate-spin"/> : <Play size={20} fill="currentColor"/>}
                             {isRunning ? '任务处理中...' : '启动后端流程'}
                          </button>

                          {pollingUrl && (
                             <div className="pt-4 border-t border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
                                   <Eye size={12}/> 当前代理 URL
                                </p>
                                <div className="p-3 bg-slate-900 rounded-xl">
                                   <code className="text-[10px] text-blue-400 break-all font-mono opacity-80">{pollingUrl}</code>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>

                 <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden shadow-blue-200">
                    <div className="relative z-10">
                       <h4 className="font-black mb-3 flex items-center gap-2"><Info size={18}/> 实时侦听已开启</h4>
                       <p className="text-xs text-blue-50/80 leading-relaxed font-bold">
                          系统正通过 SWA 代理通道监视后端任务。当后端完成计算时，数据会自动“弹”出在右侧面板中。
                       </p>
                    </div>
                    <Cpu size={120} className="absolute -bottom-8 -right-8 text-white/10 rotate-12" />
                 </div>
              </div>

              {/* 结果展示区 */}
              <div className="lg:col-span-8">
                 <div className="bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px] border-b-[12px] border-b-blue-600">
                    <div className="p-7 border-b border-white/5 flex justify-between items-center bg-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl"><Braces size={22}/></div>
                          <div>
                             <span className="text-white font-black block tracking-tight">AZURE PRODUCTION DATA</span>
                             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time JSON response</span>
                          </div>
                       </div>
                       {finalResult && (
                          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
                             <CheckCircle2 size={14}/>
                             <span className="text-[10px] font-black uppercase">Live Link Active</span>
                          </div>
                       )}
                    </div>

                    <div className="flex-1 p-10 flex flex-col items-center justify-center relative">
                       {!isRunning && !finalResult && (
                          <div className="text-center space-y-6 opacity-40">
                             <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                                <Database size={48} className="text-slate-500"/>
                             </div>
                             <div className="space-y-2">
                                <p className="text-white text-xl font-black italic">等待后端注入数据...</p>
                                <p className="text-slate-500 text-xs font-bold">点击左侧启动按钮开始抓取</p>
                             </div>
                          </div>
                       )}

                       {isRunning && (
                          <div className="text-center space-y-8 animate-pulse">
                             <div className="relative">
                                <div className="w-32 h-32 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <Activity size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400"/>
                             </div>
                             <div className="space-y-2">
                                <p className="text-white font-black tracking-widest uppercase text-lg">抓取中 (Proxy Active)</p>
                                <p className="text-slate-500 text-xs font-mono font-bold tracking-widest">Instance Status: {runtimeStatus}</p>
                             </div>
                          </div>
                       )}

                       {finalResult && (
                          <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-700">
                             <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-inner overflow-hidden relative group">
                                <div className="absolute top-6 right-6 text-slate-700 font-mono text-[10px] group-hover:text-blue-400 transition-colors">RAW_DATA_OBJECT</div>
                                <pre className="text-emerald-400 font-mono text-base h-full overflow-y-auto custom-scrollbar leading-relaxed">
                                   <code>{typeof finalResult === 'object' ? JSON.stringify(finalResult, null, 3) : finalResult}</code>
                                </pre>
                             </div>
                             <div className="mt-8 flex items-center justify-between px-4">
                                <div className="flex items-center gap-4 text-slate-500">
                                   <div className="flex -space-x-3">
                                      {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">A{i}</div>)}
                                   </div>
                                   <span className="text-[11px] font-black uppercase tracking-widest">Workflow Chain Completed</span>
                                </div>
                                <button 
                                  onClick={() => {setFinalResult(null); setRuntimeStatus('Idle'); setPollingUrl(null);}}
                                  className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase"
                                >
                                   <RefreshCw size={14}/> 重置
                                </button>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'code' && (
           <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-blue-600 p-6 rounded-3xl text-white mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Terminal size={24}/>
                    <span className="font-black">生产环境集成代码参考</span>
                 </div>
                 <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full">SWA Integration</span>
              </div>
              <CodeBlock code={FRONTEND_FILES[0].content} title="SwaIntegration.js" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[600px] animate-in fade-in duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="px-8 py-10 border-t border-slate-200 bg-white/50 text-center">
         <div className="flex items-center justify-center gap-8 mb-4 grayscale opacity-40">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tighter"><Activity size={16}/> SWA</div>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tighter"><Server size={16}/> Durable</div>
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tighter"><Database size={16}/> Managed Identity</div>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Azure Hybrid Integration Visualizer | SWA Proxy Activated</p>
      </footer>
    </div>
  );
};

export default App;

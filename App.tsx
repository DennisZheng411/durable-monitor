
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from './types';
import { FRONTEND_FILES } from './constants';
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
  Settings,
  Info,
  ShieldCheck,
  Server,
  Database,
  Terminal,
  RefreshCw,
  Cpu,
  Braces,
  ChevronRight,
  TrendingUp,
  MapPin,
  BarChart3,
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'run-workflow' | 'code' | 'logs'>('link-guide');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
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
   * 生产级 CORS 桥接：
   * 解决 SWA 链接后端时，系统 Webhook 路径（/runtime/webhooks）
   * 不在默认 /api 前缀下的路由冲突问题。
   */
  const resolveSwaPath = (absoluteUrl: string) => {
    try {
      // 提取核心路径部分
      const urlObj = new URL(absoluteUrl);
      const path = urlObj.pathname + urlObj.search;
      // 强制添加 /api 前缀，让 SWA 识别并转发
      const proxyPath = `/api${path}`;
      addLog(`🛡️ 隧道重定向: ${proxyPath.substring(0, 40)}...`, "warn");
      return proxyPath;
    } catch (e) {
      return absoluteUrl;
    }
  };

  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setInstanceId(null);
    setRuntimeStatus('Pending');
    setActiveTab('run-workflow');
    addLog("🚀 向 SWA 隧道发送触发指令...", "info");

    try {
      const response = await fetch('/api/HttpStart', { method: 'POST' });
      if (!response.ok) throw new Error(`后端拒绝连接 (${response.status})`);
      
      const clientUrls = await response.json();
      setInstanceId(clientUrls.id);
      const statusUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      
      addLog(`✅ 实例已在线: ${clientUrls.id}`, "info");

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(statusUrl);
          if (!statusRes.ok) return;
          
          const statusInfo = await statusRes.json();
          setRuntimeStatus(statusInfo.runtimeStatus);
          
          if (statusInfo.runtimeStatus === 'Completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setFinalResult(statusInfo.output);
            setIsRunning(false);
            addLog("📊 任务收尾，结果已入库", "info");
          } else if (['Failed', 'Terminated', 'Canceled'].includes(statusInfo.runtimeStatus)) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsRunning(false);
            addLog(`❌ 流程非正常结束: ${statusInfo.runtimeStatus}`, "error");
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 2500);

    } catch (err: any) {
      addLog(`❌ 故障: ${err.message}`, "error");
      setRuntimeStatus('Failed');
      setIsRunning(false);
    }
  };

  // 辅助函数：尝试从输出中提取销售数字
  const extractAmount = (data: any) => {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const match = str.match(/\$(\d+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f0f4f8] text-slate-900">
      {/* 顶部导航 */}
      <header className="bg-slate-900 text-white px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-2xl border-b border-blue-500/30">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Server size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none uppercase">Durable Monitor</h1>
            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Azure Hybrid Cloud Explorer</span>
          </div>
        </div>

        <nav className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '系统架构' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '实时任务' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '物理日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10">
        
        {activeTab === 'link-guide' && (
           <div className="grid lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
                 <div className="flex items-center gap-4 text-blue-600">
                    <Layers size={32} />
                    <h2 className="text-3xl font-black tracking-tight">架构解析</h2>
                 </div>
                 <p className="text-slate-500 font-medium leading-relaxed">
                    基于您日志中的表现，系统已通过 <b>Function Chaining (函数链)</b> 和 <b>Fan-out/Fan-in (扇出/扇入)</b> 模式完成了复杂计算。
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">01</div>
                       <div>
                          <h4 className="font-black text-sm uppercase">Starter 触发</h4>
                          <p className="text-xs text-slate-400">接收 HTTP 请求并生成 Instance ID</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">02</div>
                       <div>
                          <h4 className="font-black text-sm uppercase">Orchestrator 编排</h4>
                          <p className="text-xs text-slate-400">管理状态流转，根据城市列表并发启动计算任务</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 font-black text-xs">03</div>
                       <div>
                          <h4 className="font-black text-sm uppercase">Activity 执行</h4>
                          <p className="text-xs text-slate-400">真实的 CPU 密集型任务（如计算销售额）</p>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setActiveTab('run-workflow')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    立即启动监控终端 <ChevronRight size={18}/>
                 </button>
              </div>
              <div className="hidden lg:block relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-[3rem]"></div>
                 <div className="p-8 bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 h-full">
                    <div className="flex items-center gap-2 mb-6">
                       <div className="w-2 h-2 rounded-full bg-red-500"></div>
                       <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Diagram</span>
                    </div>
                    <CodeBlock code={`// 逻辑结构模拟
[FunctionName("SalesOrchestrator")]
public async Task Run(...) {
  var cities = await context.CallActivityAsync("GetCities");
  var tasks = cities.Select(c => 
    context.CallActivityAsync("Calculate", c));
  var results = await Task.WhenAll(tasks);
  return await context.CallActivityAsync("Report", results);
}`} title="SalesWorkflow.cs" />
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'run-workflow' && (
           <div className="grid lg:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
              {/* 控制侧栏 */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                       <Settings size={14}/> Mission Control
                    </h3>
                    
                    <div className="space-y-6">
                       <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-end">
                          <div>
                             <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Current Status</span>
                             <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : runtimeStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="font-black text-slate-900 text-xl">{runtimeStatus}</span>
                             </div>
                          </div>
                          <Clock size={24} className="text-slate-200" />
                       </div>

                       <button 
                         onClick={startRealWorkflow}
                         disabled={isRunning}
                         className="group w-full py-6 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4 active:scale-95"
                       >
                          {isRunning ? <Loader2 size={24} className="animate-spin"/> : <Play size={24} fill="currentColor"/>}
                          <span className="text-lg uppercase tracking-tight">Execute Pipeline</span>
                       </button>

                       {instanceId && (
                          <div className="pt-4 border-t border-slate-100">
                             <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Active Instance ID</span>
                             <div className="bg-slate-900 rounded-xl p-3">
                                <code className="text-[10px] text-blue-400 font-mono break-all leading-tight opacity-80">{instanceId}</code>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                       <h4 className="font-black text-lg mb-2 flex items-center gap-2 uppercase tracking-tighter">
                          <ShieldCheck size={20}/> Cloud Proxy Active
                       </h4>
                       <p className="text-xs text-blue-100/70 font-bold leading-relaxed">
                          所有请求正经由 SWA 边缘节点进行同源重写，物理链路状态：<span className="text-emerald-300">ESTABLISHED</span>
                       </p>
                    </div>
                    <Activity className="absolute -bottom-6 -right-6 text-white/5 w-32 h-32 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                 </div>
              </div>

              {/* 核心展示区 */}
              <div className="lg:col-span-8 space-y-6">
                 {/* 实时可视化大屏 */}
                 <div className="bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px] relative border-b-[16px] border-b-blue-600">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl"><Monitor size={24}/></div>
                          <div>
                             <span className="text-white font-black block text-lg tracking-tight uppercase">Workflow Visualizer</span>
                             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                                <span className="text-blue-500">Live</span> Data Stream <Activity size={10} className="animate-pulse"/>
                             </div>
                          </div>
                       </div>
                       {finalResult && (
                          <div className="bg-emerald-500/20 text-emerald-400 px-5 py-2 rounded-full border border-emerald-500/30 flex items-center gap-2 animate-in zoom-in">
                             <CheckCircle2 size={14}/>
                             <span className="text-[10px] font-black uppercase tracking-widest">Process Finalized</span>
                          </div>
                       )}
                    </div>

                    <div className="flex-1 p-10 flex flex-col items-center justify-center">
                       {!isRunning && !finalResult && (
                          <div className="text-center space-y-6">
                             <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-white/10 shadow-inner group hover:scale-110 transition-transform cursor-pointer">
                                <Database size={40} className="text-slate-600 group-hover:text-blue-500 transition-colors"/>
                             </div>
                             <p className="text-slate-500 text-sm font-black uppercase tracking-widest italic opacity-50">Awaiting Signal...</p>
                          </div>
                       )}

                       {isRunning && (
                          <div className="text-center space-y-8 animate-pulse">
                             <div className="relative inline-block">
                                <div className="w-40 h-40 border-[6px] border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                                <Cpu size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 opacity-50"/>
                             </div>
                             <div className="space-y-1">
                                <p className="text-white font-black text-2xl uppercase tracking-tighter">Polling Proxy Tunnel</p>
                                <p className="text-slate-600 font-mono text-xs font-bold uppercase">Status: {runtimeStatus}</p>
                             </div>
                          </div>
                       )}

                       {finalResult && (
                          <div className="w-full space-y-8 animate-in fade-in zoom-in duration-500">
                             {/* 可视化看板 */}
                             <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-blue-500/50 transition-colors">
                                   <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block mb-2 flex items-center gap-2">
                                      <TrendingUp size={12}/> Global Sales Report
                                   </span>
                                   <div className="flex items-baseline gap-2">
                                      <span className="text-5xl font-black text-emerald-400 tracking-tighter">
                                         ${extractAmount(finalResult) || "---"}
                                      </span>
                                      <span className="text-slate-600 text-sm font-bold uppercase">USD</span>
                                   </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center">
                                   <div className="flex items-center gap-4 mb-4">
                                      <MapPin className="text-blue-500" size={20}/>
                                      <span className="text-white font-black text-sm uppercase">Active Markets</span>
                                   </div>
                                   <div className="flex gap-2">
                                      {['NY', 'TK', 'LD', 'SG'].map(city => (
                                         <div key={city} className="flex-1 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-3/4 animate-in slide-in-from-left duration-1000"></div>
                                         </div>
                                      ))}
                                   </div>
                                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-3 tracking-widest text-center">Calculated across 4 clusters</p>
                                </div>
                             </div>

                             {/* 原始 JSON */}
                             <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 relative group">
                                <div className="absolute top-6 right-8 text-[9px] font-black text-slate-700 uppercase tracking-widest">JSON_RAW</div>
                                <pre className="text-blue-300 font-mono text-sm leading-relaxed overflow-x-auto max-h-[200px] custom-scrollbar">
                                   <code>{typeof finalResult === 'object' ? JSON.stringify(finalResult, null, 3) : finalResult}</code>
                                </pre>
                             </div>
                          </div>
                       )}
                    </div>
                    
                    {/* 底部重置按钮 */}
                    {finalResult && (
                      <div className="absolute bottom-8 right-8">
                         <button 
                            onClick={() => {setFinalResult(null); setRuntimeStatus('Idle'); setInstanceId(null);}}
                            className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border border-white/5"
                         >
                            <RefreshCw size={12}/> New Session
                         </button>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[650px] animate-in slide-in-from-right-4 duration-500">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="px-8 py-10 border-t border-slate-200 bg-white text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Cloud Native Architectural Visualizer</p>
         <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
            <div className="flex items-center gap-2 font-black text-[10px] uppercase"><Activity size={14}/> SWA Edge</div>
            <div className="flex items-center gap-2 font-black text-[10px] uppercase"><Cpu size={14}/> Durable Engine</div>
            <div className="flex items-center gap-2 font-black text-[10px] uppercase"><BarChart3 size={14}/> Real-time Analytics</div>
         </div>
      </footer>
    </div>
  );
};

export default App;

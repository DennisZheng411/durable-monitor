
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
  Cpu
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'run-workflow' | 'code' | 'logs'>('link-guide');
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('Idle');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const pollIntervalRef = useRef<number | null>(null);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  // 核心逻辑：触发并轮询结果
  const startRealWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setFinalResult(null);
    setRuntimeStatus('Starting...');
    addLog("🚀 正在触发后端流程: POST /api/HttpStart", "info");

    try {
      // 1. 触发 Starter 函数
      const response = await fetch('/api/HttpStart', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`触发失败: ${response.status}`);
      
      const clientUrls = await response.json();
      const statusUrl = clientUrls.statusQueryGetUri;
      addLog(`✅ 实例已启动: ID = ${clientUrls.id.substring(0, 8)}...`, "info");
      addLog(`🔍 开始轮询状态...`, "info");

      // 2. 开始轮询
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(statusUrl);
          const statusInfo = await statusRes.json();
          
          setRuntimeStatus(statusInfo.runtimeStatus);
          addLog(`当前状态: ${statusInfo.runtimeStatus}`, "info");

          if (statusInfo.runtimeStatus === 'Completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setFinalResult(statusInfo.output);
            setIsRunning(false);
            addLog("🎉 任务圆满完成！已获取结果。", "info");
          } else if (statusInfo.runtimeStatus === 'Failed' || statusInfo.runtimeStatus === 'Terminated') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsRunning(false);
            addLog("❌ 后端任务执行出错", "error");
          }
        } catch (pollErr) {
          console.error("轮询异常:", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      addLog(`❌ 启动失败: ${err.message}`, "error");
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
      <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-300">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Azure SWA + Durable</h1>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Connected</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '配置指南' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '运行任务' },
            { id: 'code', icon: <Code2 size={14}/>, label: '前端源码' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '实时日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        
        {activeTab === 'link-guide' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl border-t-8 border-t-emerald-500">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                       <CheckCircle2 size={32}/>
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900">物理链路已建立</h2>
                       <p className="text-slate-500 font-medium">现在，您的前端可以调用 <code className="bg-slate-100 px-1 text-blue-600">/api/HttpStart</code> 了</p>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                       <h4 className="font-black text-blue-900 mb-2 flex items-center gap-2"><Cpu size={18}/> 1. 发起 (Trigger)</h4>
                       <p className="text-xs text-blue-700">前端向 /api/HttpStart 发送 POST 请求。后端返回一个包含状态查询地址的 JSON。</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                       <h4 className="font-black text-amber-900 mb-2 flex items-center gap-2"><RefreshCw size={18}/> 2. 轮询 (Poll)</h4>
                       <p className="text-xs text-amber-700">由于 Durable 函数是长时间运行的任务，前端需要每隔 2 秒请求一次状态地址直到完成。</p>
                    </div>
                 </div>

                 <div className="flex justify-center">
                    <button 
                      onClick={() => setActiveTab('run-workflow')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3"
                    >
                       去运行真实任务 <ArrowRightLeft size={18}/>
                    </button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'run-workflow' && (
           <div className="animate-in zoom-in-95 duration-500 grid md:grid-cols-3 gap-8">
              {/* 左侧：控制面板 */}
              <div className="md:col-span-1 space-y-6">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                    <h3 className="text-lg font-black mb-6">执行控制器</h3>
                    <div className="space-y-4">
                       <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">当前状态</span>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : runtimeStatus === 'Completed' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                             <span className="font-black text-slate-700">{runtimeStatus}</span>
                          </div>
                       </div>
                       
                       <button 
                         onClick={startRealWorkflow}
                         disabled={isRunning}
                         className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                       >
                          {isRunning ? <Loader2 size={20} className="animate-spin"/> : <Play size={20}/>}
                          {isRunning ? '正在运行...' : '开始执行后端流程'}
                       </button>

                       {finalResult && (
                         <button 
                           onClick={() => {setFinalResult(null); setRuntimeStatus('Idle');}}
                           className="w-full py-3 border border-slate-200 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50"
                         >
                            清除结果
                         </button>
                       )}
                    </div>
                 </div>

                 <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                       <h4 className="font-black mb-2 flex items-center gap-2"><Info size={18}/> 提示</h4>
                       <p className="text-xs text-blue-100 leading-relaxed font-medium">
                          点击运行后，应用将真正访问您的 Azure Function 后端。如果返回 404，请确认您的函数名为 "HttpStart"。
                       </p>
                    </div>
                    <Terminal size={100} className="absolute -bottom-4 -right-4 text-blue-500/20 rotate-12" />
                 </div>
              </div>

              {/* 右侧：结果展示 */}
              <div className="md:col-span-2">
                 <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[500px]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Database size={20}/></div>
                          <span className="text-white font-black italic">FINAL RESULT FROM BACKEND</span>
                       </div>
                       {finalResult && <span className="text-[10px] bg-emerald-500 text-white px-2 py-1 rounded-full font-black animate-pulse">LIVE DATA</span>}
                    </div>

                    <div className="flex-1 p-10 flex flex-col items-center justify-center relative">
                       {!isRunning && !finalResult && (
                          <div className="text-center space-y-4">
                             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                                <Activity size={32} className="text-slate-600"/>
                             </div>
                             <p className="text-slate-500 font-bold italic">等待数据注入...</p>
                          </div>
                       )}

                       {isRunning && (
                          <div className="text-center space-y-6">
                             <div className="relative">
                                <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                <Cpu size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse"/>
                             </div>
                             <div className="space-y-1">
                                <p className="text-white font-black tracking-widest uppercase text-sm">Orchestration in Progress</p>
                                <p className="text-slate-500 text-xs font-mono">Status: {runtimeStatus}</p>
                             </div>
                          </div>
                       )}

                       {finalResult && (
                          <div className="w-full animate-in fade-in zoom-in-95 duration-500">
                             <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-inner overflow-hidden">
                                <pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                                   <code>{typeof finalResult === 'object' ? JSON.stringify(finalResult, null, 2) : finalResult}</code>
                                </pre>
                             </div>
                             <div className="mt-8 flex items-center justify-center gap-4">
                                <div className="flex -space-x-2">
                                   {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">A{i}</div>)}
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Backend Activities Completed Successfully</p>
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
              <CodeBlock code={FRONTEND_FILES[0].content} title="SwaIntegration.js" />
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[600px]">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="px-8 py-10 border-t border-slate-200 bg-white/50 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Azure Hybrid Integration Visualizer | Production Data Mode</p>
      </footer>
    </div>
  );
};

export default App;

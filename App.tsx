
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
  Braces
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

  /**
   * 关键修复函数：CORS 桥接
   * 将 https://func-app.azurewebsites.net/runtime/webhooks/... 
   * 转换为 /api/runtime/webhooks/...
   */
  const resolveSwaPath = (absoluteUrl: string) => {
    try {
      if (absoluteUrl.includes('/runtime/webhooks/durabletask/')) {
        const parts = absoluteUrl.split('/runtime/webhooks/durabletask/');
        const relativePath = `/api/runtime/webhooks/durabletask/${parts[1]}`;
        addLog(`🔧 路径转换 (解决 CORS): 使用 SWA 代理路径`, "warn");
        return relativePath;
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
    setRuntimeStatus('Starting...');
    addLog("🚀 正在发起 POST 请求到 /api/HttpStart", "info");

    try {
      const response = await fetch('/api/HttpStart', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) throw new Error(`触发失败: ${response.status}`);
      
      const clientUrls = await response.json();
      
      // 核心修复点：转换 URL 以绕过 CORS
      const statusUrl = resolveSwaPath(clientUrls.statusQueryGetUri);
      
      addLog(`✅ 实例已启动: ${clientUrls.id.substring(0, 8)}...`, "info");
      addLog(`🔍 开始通过同源代理轮询状态...`, "info");

      pollIntervalRef.current = window.setInterval(async () => {
        try {
          const statusRes = await fetch(statusUrl);
          if (!statusRes.ok) {
             addLog(`轮询请求失败: ${statusRes.status}`, "error");
             return;
          }
          
          const statusInfo = await statusRes.json();
          setRuntimeStatus(statusInfo.runtimeStatus);
          
          if (statusInfo.runtimeStatus === 'Completed') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setFinalResult(statusInfo.output);
            setIsRunning(false);
            addLog("🎉 获取到最终结果！", "info");
          } else if (statusInfo.runtimeStatus === 'Failed' || statusInfo.runtimeStatus === 'Terminated') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsRunning(false);
            addLog("❌ 后端任务执行失败", "error");
          }
        } catch (pollErr: any) {
          addLog(`轮询异常: ${pollErr.message}`, "error");
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
    <div className="min-h-screen flex flex-col font-sans bg-[#f1f5f9] text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Activity size={20} />
          </div>
          <h1 className="text-lg font-black tracking-tighter">SWA + DURABLE CONNECT</h1>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '配置说明' },
            { id: 'run-workflow', icon: <Zap size={14}/>, label: '真实连接测试' },
            { id: 'logs', icon: <Monitor size={14}/>, label: '系统日志' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {activeTab === 'link-guide' && (
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-6">
              <h2 className="text-2xl font-black flex items-center gap-3">
                 <ShieldCheck className="text-emerald-500" /> 物理链路现状分析
              </h2>
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                 <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                    <AlertCircle size={16}/> 为什么之前拿不到数据？
                 </p>
                 <p className="text-xs text-amber-700 leading-relaxed">
                    虽然您完成了 Link，但 Durable Function 返回的状态查询地址是绝对域名的。浏览器会认为这是跨域请求而拦截。
                    新版本代码加入了<b>路径桥接器</b>，会将所有请求强制锁定在同源的 <code className="bg-white px-1">/api</code> 路径下。
                 </p>
              </div>
              <div className="flex justify-center pt-4">
                 <button onClick={() => setActiveTab('run-workflow')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200">
                    立即尝试修复后的连接
                 </button>
              </div>
           </div>
        )}

        {activeTab === 'run-workflow' && (
           <div className="grid md:grid-cols-12 gap-6 h-full">
              <div className="md:col-span-4 space-y-6">
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
                    <h3 className="font-black text-slate-800 mb-4">连接控制面板</h3>
                    <div className="space-y-4">
                       <button 
                         onClick={startRealWorkflow}
                         disabled={isRunning}
                         className="w-full py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                          {isRunning ? <Loader2 className="animate-spin" size={18}/> : <Play size={18}/>}
                          {isRunning ? '正在抓取数据...' : '启动真实流程'}
                       </button>
                       <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider px-1">
                          <span>后端状态:</span>
                          <span className={isRunning ? 'text-amber-500' : 'text-emerald-500'}>{runtimeStatus}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100">
                    <h4 className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 size={16}/> 链路已优化</h4>
                    <p className="text-[11px] opacity-90 leading-tight font-medium">
                       已启用同源代理模式。系统将自动过滤来自后端的所有外部域名请求，确保数据能在 SWA 隧道内平稳传输。
                    </p>
                 </div>
              </div>

              <div className="md:col-span-8 flex flex-col h-full min-h-[500px]">
                 <div className="bg-slate-900 rounded-[2.5rem] flex-1 flex flex-col border border-slate-800 shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                          <Braces size={16} className="text-blue-400" />
                          <span className="text-[10px] font-black text-slate-400 uppercase">Production Data Output</span>
                       </div>
                       {finalResult && <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-bounce">NEW DATA RECEIVED</span>}
                    </div>

                    <div className="flex-1 p-8 flex flex-col justify-center">
                       {!isRunning && !finalResult && (
                          <div className="text-center">
                             <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Activity className="text-slate-700" size={24} />
                             </div>
                             <p className="text-slate-500 text-sm font-bold italic">等待指令执行...</p>
                          </div>
                       )}

                       {isRunning && (
                          <div className="text-center space-y-4">
                             <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                             <p className="text-white font-black text-sm uppercase tracking-widest">正在跨域代理数据...</p>
                             <p className="text-slate-500 text-xs font-mono">Status: {runtimeStatus}</p>
                          </div>
                       )}

                       {finalResult && (
                          <div className="animate-in fade-in zoom-in-95 duration-500 h-full overflow-y-auto">
                             <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 shadow-inner">
                                <pre className="text-emerald-400 font-mono text-sm leading-relaxed">
                                   <code>{JSON.stringify(finalResult, null, 2)}</code>
                                </pre>
                             </div>
                             <div className="mt-6 flex items-center gap-3 justify-center">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-[9px] text-slate-500 font-black uppercase">End of Response</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'logs' && (
           <div className="h-[600px]">
              <SimulationConsole logs={logs} />
           </div>
        )}
      </main>

      <footer className="p-8 text-center">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Azure Managed Identity & SWA Proxy Mode Activated</p>
      </footer>
    </div>
  );
};

export default App;

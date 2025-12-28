
import React, { useState, useEffect } from 'react';
import { StepStatus, LogEntry, CityData } from './types';
import { FRONTEND_FILES } from './constants';
import SimulationConsole from './components/SimulationConsole';
import { 
  Play, 
  Zap, 
  Settings2, 
  Construction, 
  CheckCircle2,
  Code2,
  Copy,
  Terminal as TerminalIcon,
  Monitor,
  Wifi,
  Activity,
  CloudUpload,
  Cpu,
  Shield,
  Loader2,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Github,
  Globe,
  Lock,
  ArrowRight,
  FileText,
  AlertCircle,
  FolderOpen,
  FolderTree,
  Command,
  MapPin,
  MousePointer2,
  LifeBuoy,
  ListChecks,
  Rocket,
  CheckCircle,
  Key,
  Link2,
  ThumbsUp,
  Sparkles,
  SearchCode
} from 'lucide-react';

const App: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'code' | 'azure-deploy'>('simulation');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [reportResult, setReportResult] = useState<string | null>(null);
  
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [pollingUrl, setPollingUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'active' | 'error'>('idle');

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date().toLocaleTimeString(), level, message }]);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setLogs([]);
    setCurrentStep(0);
    setReportResult(null);
    setPollingUrl(null);
    setConnectionStatus('idle');
  };

  useEffect(() => {
    let interval: any;
    if (pollingUrl && isRunning) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(pollingUrl);
          const data = await res.json();
          addLog(`Azure Status: ${data.runtimeStatus}`, 'info');
          if (data.runtimeStatus === 'Running') {
            setCurrentStep(3);
          } else if (data.runtimeStatus === 'Completed') {
            setCurrentStep(6);
            setReportResult(`Success: ${JSON.stringify(data.output)}`);
            setIsRunning(false);
            setPollingUrl(null);
            setConnectionStatus('active');
            addLog("Execution Complete!", 'info');
          } else if (data.runtimeStatus === 'Failed') {
             addLog(`Execution Failed: ${data.output}`, 'error');
             setIsRunning(false);
             setPollingUrl(null);
             setConnectionStatus('error');
          }
        } catch (e: any) {
          addLog(`Status Polling Error: ${e.message}`, 'error');
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [pollingUrl, isRunning]);

  const handleAction = async () => {
    if (isRunning) return;
    if (isRemoteMode) {
       if (!remoteUrl) return;
       await startRealAzureWorkflow();
    } else {
       await startLocalSimulation();
    }
  };

  const startLocalSimulation = async () => {
    setIsRunning(true);
    setLogs([]);
    setCurrentStep(1);
    addLog("Starting Simulated Workflow...", 'info');
    await new Promise(r => setTimeout(r, 1000));
    setCurrentStep(3);
    addLog("Orchestrator defined steps...", 'info');
    await new Promise(r => setTimeout(r, 2000));
    setCurrentStep(6);
    setReportResult("Simulated Result: SUCCESS");
    setIsRunning(false);
  };

  const startRealAzureWorkflow = async () => {
    setIsRunning(true);
    setConnectionStatus('checking');
    setLogs([]);
    addLog(`Initiating HTTP Start...`, 'info');
    try {
      const res = await fetch(remoteUrl, { method: 'POST' });
      const data = await res.json();
      setPollingUrl(data.statusQueryGetUri);
      setCurrentStep(2);
      setConnectionStatus('active');
    } catch (e: any) {
      addLog(`Connection Error: ${e.message}`, 'error');
      setConnectionStatus('error');
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 py-5 sticky top-0 z-50 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Azure Durable Monitor</h1>
            <div className="flex items-center gap-2">
               <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 font-black rounded-full uppercase tracking-widest">Enterprise Dashboard</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'simulation', icon: <Monitor size={14}/>, label: '监控面板' },
            { id: 'azure-deploy', icon: <CloudUpload size={14}/>, label: '部署指南' },
            { id: 'code', icon: <Code2 size={14}/>, label: '查看源码' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-6 py-2.5 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-10">
        
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                 <div className="flex justify-between items-center">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button onClick={() => { setIsRemoteMode(false); resetSimulation(); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${!isRemoteMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>模拟演示</button>
                        <button onClick={() => { setIsRemoteMode(true); resetSimulation(); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${isRemoteMode ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}>真实连接</button>
                    </div>
                 </div>

                 {isRemoteMode ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                       <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 space-y-4">
                          <h3 className="text-xs font-black text-purple-800 flex items-center gap-2"><Info size={14}/> 准备工作</h3>
                          <ul className="text-[11px] text-purple-700/80 font-bold space-y-2">
                             <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0"/> 粘贴 <b>HttpStart</b> URL (包含 <code>code=...</code>)</li>
                             <li className="flex items-start gap-2"><ChevronRight size={12} className="mt-0.5 shrink-0"/> 确保已在 Function App 的 <b>CORS</b> 中添加此网站域名</li>
                          </ul>
                       </div>
                       <input 
                          type="text" 
                          placeholder="粘贴你的 Azure Function URL..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs font-mono focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                          value={remoteUrl}
                          onChange={(e) => setRemoteUrl(e.target.value)}
                       />
                    </div>
                 ) : (
                    <div className="text-sm font-medium text-slate-400 italic">当前为本地模拟模式，用于展示架构。</div>
                 )}
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden min-h-[500px]">
                <div className="grid grid-cols-3 gap-8 relative z-10 mb-20">
                   {[
                      { step: 1, label: 'Starter', icon: <Zap /> },
                      { step: 2, label: 'Orchestrator', icon: <Settings2 /> },
                      { step: 4, label: 'Activities', icon: <Construction /> }
                   ].map((item, i) => (
                      <div key={i} className={`p-8 rounded-[2.5rem] border-2 text-center flex flex-col items-center gap-4 transition-all duration-700 ${currentStep >= item.step ? 'border-blue-500 bg-blue-50/50 shadow-xl' : 'border-slate-50 opacity-30'}`}>
                         <div className={`p-5 rounded-3xl ${currentStep >= item.step ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{item.icon}</div>
                         <div className="font-black text-slate-900 text-lg">{item.label}</div>
                      </div>
                   ))}
                </div>

                {!isRunning && !reportResult && (
                   <div className="flex flex-col items-center justify-center py-20 gap-8">
                      <button onClick={handleAction} className={`p-16 rounded-[4rem] text-white transition-all shadow-2xl active:scale-95 ${isRemoteMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                         {isRemoteMode ? <Wifi size={64} /> : <Play size={64} fill="white" />}
                      </button>
                      <p className="font-black text-slate-800 text-xl tracking-tight">点击开始触发</p>
                   </div>
                )}

                {isRunning && (
                   <div className="flex flex-col items-center py-20 gap-10">
                      <Loader2 size={80} className="text-blue-600 animate-spin" />
                      <div className="text-center space-y-2">
                         <h3 className="text-2xl font-black">正在同步数据...</h3>
                         <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Polling Azure Live Status</p>
                      </div>
                   </div>
                )}

                {reportResult && (
                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl animate-in slide-in-from-bottom-8">
                     <div className="flex items-center gap-3 mb-6">
                        <ShieldCheck className="text-emerald-500" />
                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Final Result</h4>
                     </div>
                     <div className="text-3xl font-black font-mono break-all leading-tight mb-10">{reportResult}</div>
                     <button onClick={resetSimulation} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                        <RefreshCw size={14} /> 重置
                     </button>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
               <SimulationConsole logs={logs} />
            </div>
          </div>
        )}

        {activeTab === 'azure-deploy' && (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 pb-20">
              
              <div className="bg-slate-900 border-2 border-slate-700 p-10 rounded-[3rem] shadow-2xl text-white space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-600 text-white p-3 rounded-2xl animate-pulse"><SearchCode /></div>
                    <h3 className="text-2xl font-black italic">部署排障指南</h3>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">第一步：看日志</h4>
                       <p className="text-slate-400 text-sm leading-relaxed">
                          点击你截图中的 <b>"Build and Deploy Job"</b> 蓝色文字。它会展开黑色的控制台。往下拉，找红色的文字。
                       </p>
                    </div>
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">第二步：修复 CORS 报错</h4>
                       <p className="text-slate-400 text-sm leading-relaxed">
                          如果部署成功但连接失败，请确保：
                       </p>
                       <ul className="space-y-2 text-xs font-bold list-disc pl-5 opacity-90 text-slate-300">
                          <li>进入 Function App &rarr; 左侧菜单 CORS</li>
                          <li>添加你的 SWA URL (例如 https://white-sea-xxxx.azurestaticapps.net)</li>
                          <li>勾选 Enable Access-Control-Allow-Credentials</li>
                       </ul>
                    </div>
                 </div>
              </div>

              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden text-slate-900">
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="bg-slate-900 p-2 rounded-xl text-white"><Lock size={18}/></div>
                       <h3 className="text-2xl font-black italic text-slate-900">联通后端 (最后一步)</h3>
                    </div>
                    <p className="text-slate-500 font-medium max-w-2xl leading-relaxed">
                       如果 GitHub 终于变绿了，恭喜你！最后只需要去 Azure Portal 的 Function App 里配置 <b>CORS</b>。
                    </p>
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-blue-600">
                       https://[你的-swa-域名].azurestaticapps.net
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'code' && (
           <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl animate-in fade-in duration-700">
              <h2 className="text-white text-3xl font-black mb-8 flex items-center gap-3"><Code2 /> 源代码文件</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {FRONTEND_FILES.map((f, i) => (
                    <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-white/5 group hover:border-blue-500/50 transition-all cursor-pointer">
                       <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/5 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><FileText size={20}/></div>
                          <button onClick={() => { navigator.clipboard.writeText(f.content); alert('Copied!'); }} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
                       </div>
                       <div className="font-black text-white text-sm mb-1">{f.path}</div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;

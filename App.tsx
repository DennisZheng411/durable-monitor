
import React, { useState, useEffect } from 'react';
import { LogEntry } from './types';
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
  ExternalLink,
  ShieldCheck,
  Server,
  AlertCircle,
  Database
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'link-guide' | 'test-connection' | 'code' | 'logs'>('link-guide');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{status: 'idle' | 'success' | 'error', message: string}>({status: 'idle', message: ''});
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { 
      timestamp: new Date().toLocaleTimeString(), 
      level, 
      message 
    }]);
  };

  const testApiConnection = async () => {
    setIsTesting(true);
    setTestResult({status: 'idle', message: '正在测试 /api/HttpStart...'});
    addLog("发起连通性测试: GET /api/HttpStart", "info");

    try {
      // 模拟请求，真实环境中这里会调用您的 Durable Function Starter
      const response = await fetch('/api/HttpStart', { method: 'GET' });
      
      if (response.status === 404) {
        throw new Error("路径未找到 (404)。请确认已经在 Azure Portal 中完成了 Link 操作，并且函数代码已部署。");
      }
      
      if (response.ok || response.status === 202) {
        setTestResult({status: 'success', message: '连接成功！SWA 已成功识别后端函数。'});
        addLog("✅ 链路通畅: 已通过 SWA 代理访问到后端", "info");
      } else {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
    } catch (err: any) {
      setTestResult({status: 'error', message: err.message});
      addLog(`❌ 测试失败: ${err.message}`, "error");
    } finally {
      setIsTesting(false);
    }
  };

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
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linked: mydurabledemo1226</span>
            </div>
          </div>
        </div>

        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'link-guide', icon: <Link2 size={14}/>, label: '配置确认' },
            { id: 'test-connection', icon: <Zap size={14}/>, label: '连通性测试' },
            { id: 'code', icon: <Code2 size={14}/>, label: '前端代码' },
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
                       <h2 className="text-2xl font-black text-slate-900">您的配置完全正确！</h2>
                       <p className="text-slate-500 font-medium italic">“这就是将 SWA 与现有 Function App 桥接的最佳方式。”</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-8">
                    <h4 className="font-black text-slate-700 mb-4 flex items-center gap-2">
                       <Info size={18} className="text-blue-500"/> 
                       接下来会发生什么？
                    </h4>
                    <ul className="space-y-4 text-sm text-slate-600 font-medium">
                       <li className="flex gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                          <span><b>统一域名</b>：您的函数现在可以通过 <code className="bg-blue-50 text-blue-700 px-1.5 rounded">/api/HttpStart</code> 访问，而不是原来的 <code className="text-slate-400 text-xs">...azurewebsites.net</code>。</span>
                       </li>
                       <li className="flex gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                          <span><b>免去 CORS</b>：SWA 的内置代理会自动处理所有跨域头，您无需在后端代码中设置 <code className="bg-slate-200 px-1">Access-Control-Allow-Origin</code>。</span>
                       </li>
                       <li className="flex gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                          <span><b>身份认证</b>：SWA 可以通过内置的 <code className="bg-slate-200 px-1">/.auth/me</code> 轻松将用户信息透传给您的 Durable Function。</span>
                       </li>
                    </ul>
                 </div>

                 <div className="flex justify-center">
                    <button 
                      onClick={() => setActiveTab('test-connection')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3"
                    >
                       开始测试链路 <ArrowRightLeft size={18}/>
                    </button>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Server size={20}/></div>
                       <h4 className="font-black">后端 (mydurabledemo1226)</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                       它作为“受管后端”运行。Azure 会确保只有来自您 SWA 的请求能通过默认身份验证，提高了安全性。
                    </p>
                 </div>
                 <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Globe size={20}/></div>
                       <h4 className="font-black">前端 (staticwebapp1228-2)</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                       它是您的静态资源托管地。现在它多了一个虚拟的 <code className="font-bold">/api</code> 目录，所有的 API 调用都应指向这里。
                    </p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'test-connection' && (
           <div className="animate-in zoom-in-95 duration-500 space-y-8">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-xl text-center">
                 <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all duration-500 ${
                    testResult.status === 'success' ? 'bg-emerald-500 text-white rotate-[360deg]' : 
                    testResult.status === 'error' ? 'bg-red-500 text-white animate-shake' : 'bg-blue-600 text-white'
                 }`}>
                    {isTesting ? <Loader2 className="animate-spin" size={32}/> : 
                     testResult.status === 'success' ? <CheckCircle2 size={32}/> : 
                     testResult.status === 'error' ? <AlertCircle size={32}/> : <Play size={32}/>}
                 </div>
                 <h2 className="text-2xl font-black mb-2">链路连通性自检</h2>
                 <p className="text-slate-400 text-sm mb-8 font-medium">点击下方按钮，我们将尝试通过 SWA 代理访问您的后端接口</p>
                 
                 <div className="max-w-md mx-auto mb-10 p-6 rounded-2xl bg-slate-50 border border-slate-100 min-h-[100px] flex items-center justify-center">
                    <p className={`font-bold ${testResult.status === 'success' ? 'text-emerald-600' : testResult.status === 'error' ? 'text-red-600' : 'text-slate-400'}`}>
                       {testResult.message || "准备就绪"}
                    </p>
                 </div>

                 <div className="flex flex-col gap-4 items-center">
                    <button 
                      onClick={testApiConnection}
                      disabled={isTesting}
                      className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                    >
                       {isTesting ? '正在验证...' : '立即运行测试'}
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       Endpoint: {window.location.origin}/api/HttpStart
                    </p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'code' && (
           <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-2xl mb-8">
                 <h4 className="font-black text-blue-900 flex items-center gap-2 mb-2">
                    <Settings size={18}/> 开发建议
                 </h4>
                 <p className="text-sm text-blue-700 font-medium">
                    在您的本地开发环境 (localhost)，请使用 <b>Azure Static Web Apps CLI (SWA CLI)</b> 进行开发。
                    它能模拟 Azure 上的代理行为：<code className="bg-white/50 px-1">swa start http://localhost:3000 --api-location http://localhost:7071</code>
                 </p>
              </div>
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
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Azure Hybrid Integration Visualizer | Post-Link Deployment Phase</p>
      </footer>
    </div>
  );
};

export default App;

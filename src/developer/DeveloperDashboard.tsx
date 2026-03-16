import React, { useState } from 'react';
import { useDeveloperSystem } from './DeveloperSystem';
import { 
  Terminal, 
  Activity, 
  Layers, 
  X, 
  Cpu, 
  Database, 
  Zap, 
  ShieldAlert,
  ChevronRight,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { isActive, deactivate, metrics, logs, modules, toggleModule, executeCommand } = useDeveloperSystem();
  const [activeTab, setActiveTab] = useState<'console' | 'metrics' | 'modules'>('console');
  const [command, setCommand] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>(['AutoFix Dev Console v1.0.0', 'Type "help" for commands']);

  if (!isActive) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    const result = executeCommand(command);
    setConsoleOutput(prev => [...prev, `> ${command}`, result]);
    setCommand('');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-full max-h-[800px] rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-slate-300">
        
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-500 p-1.5 rounded-lg">
              <Terminal size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Developer System</h2>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Internal Engineering Toolkit</p>
            </div>
          </div>
          <button 
            onClick={deactivate}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-20 md:w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col">
            <nav className="p-2 space-y-1">
              <button 
                onClick={() => setActiveTab('console')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'console' ? 'bg-brand-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
              >
                <Terminal size={20} />
                <span className="hidden md:block font-medium">Console</span>
              </button>
              <button 
                onClick={() => setActiveTab('metrics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'metrics' ? 'bg-brand-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
              >
                <Activity size={20} />
                <span className="hidden md:block font-medium">Metrics</span>
              </button>
              <button 
                onClick={() => setActiveTab('modules')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'modules' ? 'bg-brand-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
              >
                <Layers size={20} />
                <span className="hidden md:block font-medium">Modules</span>
              </button>
            </nav>

            <div className="mt-auto p-4 border-t border-slate-700 hidden md:block">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mb-2">
                <ShieldAlert size={12} /> Security Status
              </div>
              <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded text-[10px] font-bold inline-block">
                ENCRYPTED SESSION
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
            {activeTab === 'console' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-1 mb-4 custom-scrollbar">
                  {consoleOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('>') ? 'text-brand-400' : 'text-slate-300'}>
                      {line}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleCommand} className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2">
                  <ChevronRight size={18} className="text-brand-500" />
                  <input 
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent border-none outline-none text-brand-500 placeholder:text-slate-600 font-mono"
                    autoFocus
                  />
                </form>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricCard icon={<Cpu size={20}/>} label="CPU Usage" value={`${metrics.cpu}%`} color="text-blue-400" />
                  <MetricCard icon={<Database size={20}/>} label="Memory" value={`${metrics.memory}MB`} color="text-purple-400" />
                  <MetricCard icon={<Zap size={20}/>} label="Latency" value={`${metrics.latency}ms`} color="text-amber-400" />
                  <MetricCard icon={<Activity size={20}/>} label="AI Inference" value={`${metrics.aiSpeed}ms`} color="text-emerald-400" />
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Terminal size={18} className="text-slate-400" /> System Logs
                    </h3>
                    <button className="text-slate-500 hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs h-64 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                      <div key={i} className="border-l-2 border-slate-700 pl-3 py-1 hover:bg-slate-800/50 transition-colors">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-3">
                  {modules.map(mod => (
                    <div key={mod.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{mod.name}</h4>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">v{mod.version}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">ID: {mod.id}</p>
                      </div>
                      <button 
                        onClick={() => toggleModule(mod.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mod.enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                      >
                        {mod.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-brand-500/5 border border-brand-500/20 rounded-2xl">
                  <h3 className="font-bold text-brand-400 mb-2 flex items-center gap-2">
                    <RefreshCw size={18} /> Module Hot-Reload
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Modules can be reloaded in real-time without affecting the core application state. 
                    Use this for rapid testing of AI parameters and data pipeline overrides.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
    <div className={`p-3 rounded-xl bg-slate-800 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

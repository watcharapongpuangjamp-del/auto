import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../types';

interface DeveloperSystemContextType {
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  logs: string[];
  addLog: (message: string) => void;
  metrics: SystemMetrics;
  modules: AppModule[];
  toggleModule: (id: string) => void;
  executeCommand: (cmd: string) => string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  latency: number;
  aiSpeed: number;
}

interface AppModule {
  id: string;
  name: string;
  enabled: boolean;
  version: string;
}

const DeveloperSystemContext = createContext<DeveloperSystemContextType | undefined>(undefined);

export const DeveloperSystemProvider: React.FC<{ children: React.ReactNode, userRole?: UserRole }> = ({ children, userRole }) => {
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({ cpu: 12, memory: 450, latency: 24, aiSpeed: 120 });
  const [modules, setModules] = useState<AppModule[]>([
    { id: 'ai-diagnosis', name: 'AI Diagnosis Engine', enabled: true, version: '2.5-flash' },
    { id: 'ocr-engine', name: 'Vehicle OCR', enabled: true, version: '1.0.2' },
    { id: 'inventory-sync', name: 'Inventory Sync', enabled: true, version: '1.4.0' },
    { id: 'remote-support', name: 'Remote Support Layer', enabled: false, version: '0.9.0' },
  ]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  }, []);

  const activate = useCallback(() => {
    // Only allow if user is ADMIN or in dev environment (simulated)
    setIsActive(true);
    addLog('Developer Mode Activated');
  }, [addLog]);

  const deactivate = useCallback(() => {
    setIsActive(false);
    addLog('Developer Mode Deactivated');
  }, [addLog]);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    const mod = modules.find(m => m.id === id);
    addLog(`Module ${mod?.name} ${!mod?.enabled ? 'enabled' : 'disabled'}`);
  };

  const executeCommand = (cmd: string): string => {
    addLog(`Executing: ${cmd}`);
    const parts = cmd.toLowerCase().split(' ');
    const action = parts[0];

    switch (action) {
      case 'status':
        return `System: OK | CPU: ${metrics.cpu}% | MEM: ${metrics.memory}MB`;
      case 'clear':
        setLogs([]);
        return 'Logs cleared';
      case 'diag':
        return 'Running diagnostics... All systems nominal.';
      case 'restart':
        return 'Service restart initiated (Simulated)';
      case 'help':
        return 'Available: status, clear, diag, restart, help';
      default:
        return `Unknown command: ${action}`;
    }
  };

  // Simulate metrics updates
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 20) + 5,
        memory: 440 + Math.floor(Math.random() * 40),
        latency: 20 + Math.floor(Math.random() * 15),
        aiSpeed: 110 + Math.floor(Math.random() * 30),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

  // Global keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsActive(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DeveloperSystemContext.Provider value={{
      isActive,
      activate,
      deactivate,
      logs,
      addLog,
      metrics,
      modules,
      toggleModule,
      executeCommand
    }}>
      {children}
    </DeveloperSystemContext.Provider>
  );
};

export const useDeveloperSystem = () => {
  const context = useContext(DeveloperSystemContext);
  if (!context) throw new Error('useDeveloperSystem must be used within DeveloperSystemProvider');
  return context;
};

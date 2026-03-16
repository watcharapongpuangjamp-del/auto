
import React, { useState } from 'react';
import { LayoutDashboard, FilePlus, Search, Wrench, Menu, Settings, FileCheck, Package, MapPin, ClipboardList, Kanban, Users, ChevronDown, Lock, Timer, Contact, HelpCircle, Smartphone, Monitor } from 'lucide-react';
import { Employee, UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: Employee;
  availableUsers: Employee[];
  onSwitchUser: (user: Employee) => void;
  allowSwitchUser?: boolean;
  onStartTutorial?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  isOpen, 
  setIsOpen,
  currentUser,
  availableUsers,
  onSwitchUser,
  allowSwitchUser = true,
  onStartTutorial
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Guard against missing user
  if (!currentUser) return null;

  // Core Daily Workflow Items
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'ภาพรวม (Dashboard)', 
      icon: LayoutDashboard,
      roles: [UserRole.ADMIN, UserRole.MECHANIC, UserRole.STAFF],
      elementId: 'nav-dashboard'
    },
    { 
      id: 'reception', 
      label: '1. รับลูกค้า (Reception)', 
      icon: ClipboardList,
      roles: [UserRole.ADMIN, UserRole.MECHANIC, UserRole.STAFF],
      elementId: 'nav-reception'
    },
    { 
      id: 'diagnosis', 
      label: '2. AI วิเคราะห์ (Diagnosis)', 
      icon: Wrench,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-diagnosis'
    },
    { 
      id: 'create', 
      label: '3. ใบเสนอราคา (Quote)', 
      icon: FilePlus,
      roles: [UserRole.ADMIN, UserRole.STAFF],
      elementId: 'nav-create'
    },
    { 
      id: 'tracking', 
      label: '4. ติดตามงาน (Tracking)', 
      icon: Kanban,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-tracking'
    },
    { 
      id: 'workload', 
      label: 'ภาระงานช่าง (Workload)', 
      icon: Users,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-workload'
    },
    { 
      id: 'mechanic_dashboard', 
      label: 'แดชบอร์ดช่าง (Dashboard)', 
      icon: LayoutDashboard,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-mechanic-dashboard'
    },
    { 
      id: 'mechanic_app', 
      label: 'แอปช่างซ่อม (My Jobs)', 
      icon: Smartphone,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-mechanic-app'
    },
    { 
      id: 'receipts', 
      label: '5. ใบเสร็จรับเงิน (Receipts)', 
      icon: FileCheck,
      roles: [UserRole.ADMIN, UserRole.STAFF],
      elementId: 'nav-receipts'
    },
    { 
      id: 'inventory', 
      label: 'สต็อคอะไหล่ (Stock)', 
      icon: Package,
      roles: [UserRole.ADMIN, UserRole.MECHANIC],
      elementId: 'nav-inventory'
    },
    { 
      id: 'customers', 
      label: 'ข้อมูลลูกค้า (Customers)', 
      icon: Contact,
      roles: [UserRole.ADMIN, UserRole.STAFF],
      elementId: 'nav-customers'
    },
    { 
      id: 'settings', 
      label: 'ตั้งค่า & เครื่องมือ', 
      icon: Settings,
      roles: [UserRole.ADMIN, UserRole.MECHANIC, UserRole.STAFF],
      elementId: 'nav-settings'
    },
    { 
      id: 'support', 
      label: 'ช่วยเหลือระยะไกล', 
      icon: Monitor,
      roles: [UserRole.ADMIN, UserRole.MECHANIC, UserRole.STAFF],
      elementId: 'nav-support'
    },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  const getRoleColor = (role?: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return 'bg-purple-500';
      case UserRole.MECHANIC: return 'bg-blue-500';
      default: return 'bg-brand-500';
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div 
        id="sidebar-container"
        className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 h-16 bg-slate-800 flex-shrink-0">
          <h1 className="text-xl font-bold text-brand-500 flex items-center gap-2">
            <Wrench className="w-6 h-6" />
            AutoQuote AI
          </h1>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto flex-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={item.elementId}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-brand-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 pt-0">
           <button
             id="btn-help"
             onClick={onStartTutorial}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700 hover:border-slate-600"
           >
             <HelpCircle size={20} />
             <span className="font-medium text-sm">แนะนำการใช้งาน</span>
           </button>
        </div>

        <div className="relative p-4 bg-slate-800 border-t border-slate-700">
          <button 
            onClick={() => allowSwitchUser && setShowUserMenu(!showUserMenu)}
            disabled={!allowSwitchUser}
            className={`w-full flex items-center justify-between hover:bg-slate-700 p-2 rounded-lg transition-colors group ${!allowSwitchUser ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${getRoleColor(currentUser.role)} flex items-center justify-center text-white font-bold text-sm`}>
                {currentUser.name?.charAt(0) || '?'}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white truncate max-w-[100px]">{currentUser.name || 'Guest'}</p>
                <div className="flex items-center gap-1">
                   <p className="text-xs text-slate-400">{currentUser.role}</p>
                   {!allowSwitchUser && <Lock size={10} className="text-slate-500" />}
                </div>
              </div>
            </div>
            {allowSwitchUser && <ChevronDown size={16} className="text-slate-500 group-hover:text-white" />}
          </button>

          {allowSwitchUser && showUserMenu && (
            <div className="absolute bottom-full left-0 w-full mb-2 px-4 z-50">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden py-1 border border-slate-200">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                  สลับผู้ใช้งาน (Switch User)
                </div>
                {availableUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSwitchUser(user);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between
                      ${currentUser.id === user.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}
                    `}
                  >
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.position}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold
                      ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                        user.role === UserRole.MECHANIC ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                    `}>
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;

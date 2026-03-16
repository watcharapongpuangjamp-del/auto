
import React from 'react';
import { Bell, X, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onViewRelated: (type: string, id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClose,
  onViewRelated
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'WARNING': return <AlertTriangle className="text-amber-500" size={18} />;
      case 'ERROR': return <AlertCircle className="text-red-500" size={18} />;
      default: return <Info className="text-blue-500" size={18} />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'เมื่อครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  return (
    <div className="absolute top-16 right-4 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col max-h-[80vh]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-brand-600" />
          <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
          {unreadCount > 0 && (
            <span className="bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
              title="อ่านทั้งหมด"
            >
              <CheckCheck size={16} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bell size={48} className="mx-auto mb-3 opacity-20" />
            <p>ไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-slate-50 transition-colors relative group ${!notification.isRead ? 'bg-brand-50/30' : ''}`}
                onClick={() => {
                  if (!notification.isRead) onMarkAsRead(notification.id);
                  if (notification.relatedId && notification.relatedType) {
                    onViewRelated(notification.relatedType, notification.relatedId);
                  }
                }}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-bold ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.relatedId && (
                      <button className="mt-2 text-[10px] font-bold text-brand-600 hover:underline">
                        ดูรายละเอียด &rarr;
                      </button>
                    )}
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <button 
            onClick={onClearAll}
            className="w-full py-2 text-xs font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 size={14} />
            <span>ล้างการแจ้งเตือนทั้งหมด</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

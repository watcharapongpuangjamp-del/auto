
import React, { useState } from 'react';
import { Estimate, RepairStage } from '../types';
import { Search, Car, Clock, CheckCircle, Phone, MapPin, AlertCircle } from 'lucide-react';

interface CustomerPortalProps {
  estimates: Estimate[];
  shopName: string;
  shopPhone: string;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ estimates, shopName, shopPhone }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundJob, setFoundJob] = useState<Estimate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    
    // Search by License Plate or Phone
    const job = estimates.find(est => 
      ((est.vehicle?.licensePlate || '').replace(/\s/g, '') === searchQuery.replace(/\s/g, '') ||
       (est.customer?.phone || '').includes(searchQuery)) &&
      est.status !== 'CANCELLED'
    );
    
    setFoundJob(job || null);
  };

  const getStageStep = (stage?: RepairStage) => {
    switch (stage) {
      case RepairStage.QUEUED: return 1;
      case RepairStage.IN_PROGRESS: return 2;
      case RepairStage.WAITING_PARTS: return 2;
      case RepairStage.QC: return 3;
      case RepairStage.READY: return 4;
      default: return 0;
    }
  };

  const currentStep = foundJob ? getStageStep(foundJob.repairStage) : 0;
  const steps = [
    { id: 1, label: 'รับรถ/รอคิว', icon: Clock },
    { id: 2, label: 'กำลังซ่อม', icon: Car },
    { id: 3, label: 'ตรวจสอบ QC', icon: AlertCircle },
    { id: 4, label: 'รถเสร็จ/พร้อมรับ', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600">
            <Car size={24} />
            <h1 className="font-bold text-lg">AutoTracker</h1>
          </div>
          <a href={`tel:${shopPhone}`} className="text-sm font-medium text-slate-600 flex items-center gap-1">
            <Phone size={14} />
            {shopPhone}
          </a>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-800">เช็คสถานะงานซ่อม</h2>
          <p className="text-sm text-slate-500">กรอกเลขทะเบียนรถ หรือ เบอร์โทรศัพท์</p>
          
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text"
              placeholder="เช่น 1กข1234 หรือ 0812345678"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 text-center font-bold text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <button 
              type="submit"
              className="w-full mt-3 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
            >
              ค้นหา
            </button>
          </form>
        </div>

        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {foundJob ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{foundJob.vehicle?.licensePlate || 'N/A'}</h3>
                      <p className="text-xs text-slate-300">{foundJob.vehicle?.make || ''} {foundJob.vehicle?.model || ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs opacity-70">Job No.</div>
                      <div className="font-mono font-bold">{foundJob.estimateNumber}</div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="relative">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                      
                      <div className="space-y-6">
                        {steps.map((step) => {
                          const Icon = step.icon;
                          const isActive = step.id === currentStep;
                          const isCompleted = step.id < currentStep;
                          
                          return (
                            <div key={step.id} className="relative flex items-center gap-4">
                              <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                                ${isActive ? 'bg-brand-600 border-brand-600 text-white shadow-lg scale-110' : 
                                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                  'bg-white border-slate-200 text-slate-300'}
                              `}>
                                <Icon size={14} />
                              </div>
                              <div className={isActive ? 'font-bold text-slate-800' : isCompleted ? 'text-slate-600' : 'text-slate-300'}>
                                {step.label}
                                {isActive && (
                                  <span className="ml-2 text-xs text-brand-600 animate-pulse font-normal">(สถานะปัจจุบัน)</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">ราคาประเมินเบื้องต้น</span>
                    <span className="text-xl font-bold text-slate-800">
                      ~฿{foundJob.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-full">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{shopName}</h4>
                    <p className="text-xs text-slate-500">ติดต่อสอบถามเพิ่มเติมได้ที่ {shopPhone}</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Search size={32} />
                </div>
                <h3 className="font-bold text-slate-700">ไม่พบข้อมูล</h3>
                <p className="text-sm text-slate-500 mt-1">กรุณาตรวจสอบเลขทะเบียนหรือเบอร์โทรศัพท์อีกครั้ง</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <footer className="text-center py-6 text-xs text-slate-400">
        Powered by AutoQuote AI
      </footer>
    </div>
  );
};

export default CustomerPortal;

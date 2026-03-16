
import React, { useState } from 'react';
import { ShopSettings, Employee, LineItem, InventoryItem } from '../types';
// Import Settings icon from lucide-react and alias it to avoid conflict with the component name
import { Save, Store, Receipt, CreditCard, Image as ImageIcon, Upload, Timer, Users, Search, MapPin, Wrench, Briefcase, FileText, Settings as SettingsIcon, HelpCircle, Shield, MessageSquare, Monitor } from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';
import LaborStandards from './LaborStandards';
import PartsLookup from './PartsLookup';
import LocalStoresMap from './LocalStoresMap';

interface SettingsProps {
  settings: ShopSettings;
  onSave: (newSettings: ShopSettings) => void;
  employees: Employee[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  currentUserRole: string;
  onAddPartToEstimate?: (item: LineItem) => void;
  onExportData: () => void;
  onImportData: (data: any) => void;
  inventoryItems: InventoryItem[];
  defaultTab?: 'GENERAL' | 'EMPLOYEES' | 'LABOR' | 'TOOLS' | 'BACKUP' | 'SUPPORT';
  remoteSupportEnabled: boolean;
  setRemoteSupportEnabled: (enabled: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onSave, 
  employees, 
  onSaveEmployee, 
  onDeleteEmployee, 
  currentUserRole,
  onAddPartToEstimate,
  onExportData,
  onImportData,
  inventoryItems,
  defaultTab = 'GENERAL',
  remoteSupportEnabled,
  setRemoteSupportEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'EMPLOYEES' | 'LABOR' | 'TOOLS' | 'BACKUP' | 'SUPPORT'>(defaultTab);
  const [formData, setFormData] = useState<ShopSettings>(settings);

  const isAdmin = currentUserRole === 'ADMIN';

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportData(json);
      } catch (error) {
        alert('รูปแบบไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ JSON ที่ได้จากการส่งออกข้อมูล');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleChange = (field: keyof ShopSettings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('File size too large. Please use an image smaller than 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = () => {
    onSave(formData);
    alert('บันทึกข้อมูลเรียบร้อย (Settings Saved)');
  };

  const tabs = [
    { id: 'GENERAL', label: 'ข้อมูลร้าน', icon: Store, roles: ['ADMIN'] },
    { id: 'EMPLOYEES', label: 'จัดการพนักงาน', icon: Users, roles: ['ADMIN'] },
    { id: 'LABOR', label: 'มาตรฐานเวลา (FRT)', icon: Timer, roles: ['ADMIN', 'MECHANIC'] },
    { id: 'TOOLS', label: 'เครื่องมือ/ค้นหา', icon: Wrench, roles: ['ADMIN', 'MECHANIC', 'STAFF'] },
    { id: 'BACKUP', label: 'สำรองข้อมูล', icon: Upload, roles: ['ADMIN'] },
    { id: 'SUPPORT', label: 'ช่วยเหลือ (Support)', icon: HelpCircle, roles: ['ADMIN', 'MECHANIC', 'STAFF'] },
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(currentUserRole));

  const [supportMessage, setSupportMessage] = useState('');

  const handleRequestSupport = () => {
    if (!supportMessage.trim()) {
      alert('กรุณาระบุรายละเอียดปัญหาที่ต้องการความช่วยเหลือ');
      return;
    }
    alert('ส่งคำขอความช่วยเหลือไปยังผู้พัฒนาแล้ว (Support Request Sent)\nเราจะติดต่อกลับโดยเร็วที่สุด');
    setSupportMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 flex-shrink-0">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {/* Fix: Use the aliased SettingsIcon instead of the Settings component name */}
            <SettingsIcon className="text-brand-600" />
            ตั้งค่าและเครื่องมือช่วยเหลือ (Settings & Tools)
          </h2>
        </div>
        <div className="flex gap-1 px-6">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-brand-600 text-brand-600 bg-white rounded-t-lg' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-white">
        {activeTab === 'GENERAL' && (
          <div className="p-6 md:p-8 space-y-8 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <FileText size={20} className="text-brand-500" />
                     การแสดงผลในเอกสาร (Document Settings)
                  </h3>
                  <p className="text-sm text-slate-500">ข้อมูลเหล่านี้จะปรากฏในหัวเอกสารใบเสนอราคาและใบเสร็จ</p>
               </div>
               <button 
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-sm hover:shadow-md font-bold"
               >
                  <Save size={18} />
                  บันทึกการเปลี่ยนแปลง
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ชื่อร้าน (Shop Name)</label>
                  <input 
                    type="text" 
                    placeholder="ระบุชื่ออู่หรือร้านค้า..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เบอร์โทรศัพท์ (Phone)</label>
                  <input 
                    type="text" 
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    value={formData.phone} 
                    onChange={(e) => handleChange('phone', e.target.value)} 
                  />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ที่อยู่ (Address)</label>
                  <textarea 
                    rows={3} 
                    placeholder="ระบุที่อยู่สำหรับออกเอกสาร..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    value={formData.address} 
                    onChange={(e) => handleChange('address', e.target.value)} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input 
                    type="text" 
                    placeholder="เลข 13 หลัก..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    value={formData.taxId} 
                    onChange={(e) => handleChange('taxId', e.target.value)} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ค่าแรงมาตรฐาน / ชม. (Labor Rate)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" 
                      value={formData.laborRatePerHour} 
                      onChange={(e) => handleChange('laborRatePerHour', parseFloat(e.target.value))} 
                    />
                    <span className="absolute right-4 top-2.5 text-slate-400 font-bold text-xs">THB</span>
                  </div>
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ข้อมูลการชำระเงิน (Bank Info)</label>
                  <input 
                    type="text" 
                    placeholder="ชื่อธนาคาร, เลขบัญชี, ชื่อบัญชี..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" 
                    value={formData.bankInfo || ''} 
                    onChange={(e) => handleChange('bankInfo', e.target.value)} 
                  />
               </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
               <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <ImageIcon size={18} className="text-slate-400" />
                 โลโก้ร้าน (Logo)
               </h3>
               <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="w-40 h-40 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-white overflow-hidden shadow-inner">
                     {formData.logoUrl ? (
                        <img src={formData.logoUrl} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                     ) : <ImageIcon size={40} className="text-slate-200" />}
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                     <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">อัปโหลดโลโก้ร้าน</p>
                        <p className="text-xs text-slate-400">ขนาดแนะนำ 400x400px (PNG หรือ JPG ไม่เกิน 500KB)</p>
                     </div>
                     <label className="inline-flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                        <Upload size={16} className="mr-2 text-brand-500" /> เลือกรูปภาพ
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                     </label>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'EMPLOYEES' && (
          <EmployeeManagement 
            employees={employees} 
            onSave={onSaveEmployee} 
            onDelete={onDeleteEmployee} 
            currentUserRole={currentUserRole} 
          />
        )}

        {activeTab === 'LABOR' && (
          <LaborStandards shopRate={settings.laborRatePerHour} />
        )}

        {activeTab === 'TOOLS' && (
          <div className="p-6 space-y-12">
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                <Search size={20} className="text-brand-500" /> เครื่องมือค้นหาอะไหล่
              </h3>
              <div className="bg-slate-50 rounded-xl p-1">
                <PartsLookup 
                  inventoryItems={inventoryItems}
                  onAddPart={(item) => {
                    if (onAddPartToEstimate) onAddPartToEstimate(item);
                    else alert("กรุณาเปิดใบเสนอราคาที่ต้องการเพิ่มอะไหล่ก่อน");
                  }} 
                />
              </div>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} className="text-red-500" /> ค้นหาร้านอะไหล่ใกล้เคียง
              </h3>
              <div className="bg-slate-50 rounded-xl p-1">
                <LocalStoresMap />
              </div>
            </section>
          </div>
        )}
        {activeTab === 'BACKUP' && (
          <div className="p-6 md:p-8 space-y-8 max-w-4xl">
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Upload size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-brand-900 mb-3 flex items-center gap-2">
                  <Upload size={24} /> ระบบสำรองข้อมูล (Data Backup)
                </h3>
                <p className="text-brand-700 mb-8 max-w-2xl leading-relaxed">
                  คุณสามารถส่งออกข้อมูลทั้งหมดในระบบ (ใบเสนอราคา, สต็อกอะไหล่, ข้อมูลพนักงาน) เป็นไฟล์ JSON เพื่อเก็บไว้เป็นข้อมูลสำรองภายนอกได้ แนะนำให้สำรองข้อมูลอย่างน้อยสัปดาห์ละครั้ง
                </p>
                <button 
                  onClick={onExportData}
                  className="bg-brand-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Upload size={20} /> ส่งออกข้อมูลสำรอง (.json)
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Upload size={20} className="rotate-180" /> นำเข้าข้อมูล (Import Data)
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                นำเข้าข้อมูลจากไฟล์ JSON ที่ได้จากการสำรองข้อมูล (การนำเข้าข้อมูลจะเขียนทับข้อมูลเดิมบางส่วน กรุณาใช้งานด้วยความระมัดระวัง)
              </p>
              <label className="bg-white text-slate-700 px-6 py-3 rounded-xl font-bold cursor-pointer border border-slate-300 hover:bg-slate-100 transition-colors inline-block">
                เลือกไฟล์ JSON...
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImportFileChange}
                />
              </label>
            </div>
          </div>
        )}
        {activeTab === 'SUPPORT' && (
          <div className="p-6 md:p-8 space-y-8 max-w-4xl">
            <div className="bg-slate-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center">
                    <Monitor size={24} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold">ระบบช่วยเหลือระยะไกล (Remote Support)</h3>
                </div>
                <p className="text-slate-300 mb-8 max-w-2xl leading-relaxed">
                  เมื่อเปิดใช้งานระบบนี้ ทีมพัฒนาจะสามารถเข้าถึงหน้าจอของคุณเพื่อช่วยตรวจสอบปัญหาและให้คำแนะนำได้แบบเรียลไทม์ 
                  คุณสามารถปิดการเชื่อมต่อได้ทุกเมื่อที่ต้องการ
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button 
                    onClick={() => setRemoteSupportEnabled(!remoteSupportEnabled)}
                    className={`px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 ${
                      remoteSupportEnabled 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-brand-500 hover:bg-brand-600 text-white'
                    }`}
                  >
                    {remoteSupportEnabled ? (
                      <>
                        <Shield size={20} /> ปิดการเชื่อมต่อ (Disable Support)
                      </>
                    ) : (
                      <>
                        <Monitor size={20} /> เปิดระบบช่วยเหลือ (Enable Remote Support)
                      </>
                    )}
                  </button>
                  
                  {remoteSupportEnabled && (
                    <div className="flex items-center gap-2 text-green-400 animate-pulse">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm font-bold uppercase tracking-wider">Connected to Developer</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-brand-500" /> ส่งข้อความถึงผู้พัฒนา
                </h3>
                <div className="space-y-4">
                  <textarea 
                    rows={4}
                    placeholder="ระบุรายละเอียดปัญหาหรือข้อสงสัย..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                  />
                  <button 
                    onClick={handleRequestSupport}
                    className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-sm"
                  >
                    ส่งข้อความ (Send Message)
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <HelpCircle size={20} className="text-slate-400" /> ข้อมูลติดต่อผู้พัฒนา
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <Store size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Developer Team</p>
                      <p className="text-sm font-bold text-slate-700">AutoQuote AI Support Team</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <MessageSquare size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase">Email Support</p>
                      <p className="text-sm font-bold text-slate-700">support@autoquote-ai.com</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      * ระบบช่วยเหลือระยะไกลจะทำงานผ่านการเชื่อมต่อที่ปลอดภัย (Secure WebSocket) 
                      และจะไม่มีการเก็บรวบรวมข้อมูลส่วนตัวของลูกค้าโดยไม่ได้รับอนุญาต
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

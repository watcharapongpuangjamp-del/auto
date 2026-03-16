
import React, { useState, useMemo } from 'react';
import { Estimate, Customer } from '../types';
import { Contact, Search, Phone, MapPin, History, Car, ArrowRight, Wallet, FileText, User, MessageSquare, Send, Sparkles, Loader2, Star } from 'lucide-react';
import { generateStatusUpdate } from '../services/geminiService';

interface CustomerManagementProps {
  estimates: Estimate[];
  onUpdateCustomer: (phone: string, newData: Customer) => void;
  onViewJob: (estimate: Estimate) => void;
}

interface AggregatedCustomer {
  info: Customer;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  vehicles: Set<string>; // License plates
  history: Estimate[];
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ estimates, onUpdateCustomer, onViewJob }) => {
  const [query, setQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AggregatedCustomer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Customer>({ id: '', name: '', phone: '', address: '' });
  const [activeSubTab, setActiveSubTab] = useState<'CONTACT' | 'HISTORY' | 'COMMUNICATION'>('CONTACT');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 1. Aggregate Customers from Estimates
  const customers = useMemo(() => {
    const map = new Map<string, AggregatedCustomer>();

    estimates.forEach(est => {
      // Use phone as primary key for grouping (simple deduplication)
      const key = est.customer?.phone?.trim();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          info: est.customer,
          totalVisits: 0,
          totalSpent: 0,
          lastVisit: '',
          vehicles: new Set<string>(),
          history: []
        });
      }

      const entry = map.get(key);
      if (!entry) return;
      
      // Update Info (Take latest)
      if (est.date > entry.lastVisit) {
          entry.info = est.customer;
          entry.lastVisit = est.date;
      }

      // Calc Totals
      const total = est.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - (i.discount || 0)/100)), 0) * (1 + est.taxRate);
      if (est.status !== 'CANCELLED') {
          entry.totalSpent += total;
          entry.totalVisits += 1;
      }

      entry.vehicles.add(`${est.vehicle.licensePlate} (${est.vehicle.make})`);
      entry.history.push(est);
    });

    // Sort history for each customer
    map.forEach(c => {
        c.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Array.from(map.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [estimates]);

  const filteredCustomers = customers.filter(c => 
    (c.info?.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.info?.phone || '').includes(query) ||
    Array.from(c.vehicles).some((v: string) => v.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectCustomer = (cust: AggregatedCustomer) => {
    setSelectedCustomer(cust);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (selectedCustomer) {
        setEditForm(selectedCustomer.info);
        setIsEditing(true);
    }
  };

  const handleSave = () => {
      if (selectedCustomer) {
          onUpdateCustomer(selectedCustomer.info.phone, editForm);
          setIsEditing(false);
          // Manually update selected customer view momentarily
          setSelectedCustomer({
              ...selectedCustomer,
              info: editForm
          });
      }
  };

  const handleGenerateUpdate = async (job: Estimate) => {
    setIsGeneratingMessage(true);
    try {
      const msg = await generateStatusUpdate(job);
      setGeneratedMessage(msg);
    } catch (error) {
      console.error("Failed to generate message", error);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const handleSendMessage = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setGeneratedMessage('');
      alert("ส่งข้อความอัปเดตสถานะเรียบร้อยแล้ว");
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      {/* LEFT: Customer List */}
      <div className={`md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${selectedCustomer ? 'hidden md:flex' : 'flex h-full'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Contact className="text-brand-600" />
            ฐานข้อมูลลูกค้า
          </h2>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อ, เบอร์โทร, ทะเบียนรถ..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
           {filteredCustomers.length === 0 ? (
               <div className="p-8 text-center text-slate-400">
                   <p>ไม่พบข้อมูลลูกค้า</p>
               </div>
           ) : (
               <div className="divide-y divide-slate-100">
                   {filteredCustomers.map((cust, idx) => (
                       <div 
                         key={idx}
                         onClick={() => handleSelectCustomer(cust)}
                         className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedCustomer?.info.phone === cust.info.phone ? 'bg-brand-50 border-l-4 border-brand-500' : ''}`}
                       >
                           <div className="flex justify-between items-start mb-1">
                               <h3 className="font-bold text-slate-800">{cust.info?.name}</h3>
                               <span className="text-xs text-slate-400">{cust.lastVisit}</span>
                           </div>
                           <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                               <Phone size={14} /> {cust.info?.phone}
                           </div>
                           <div className="flex justify-between items-center text-xs">
                               <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                   {cust.totalVisits} visits
                               </span>
                               <span className="font-bold text-brand-600">
                                   ฿{cust.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                               </span>
                           </div>
                       </div>
                   ))}
               </div>
           )}
        </div>
      </div>

      {/* RIGHT: Customer Detail & History */}
      <div className={`flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${!selectedCustomer ? 'hidden md:flex justify-center items-center' : 'flex h-full'}`}>
        
        {!selectedCustomer ? (
            <div className="text-center text-slate-400 p-8">
                <User size={64} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-slate-600">เลือกลูกค้าเพื่อดูรายละเอียด</h3>
                <p>คลิกที่รายชื่อลูกค้าด้านซ้ายเพื่อดูประวัติการซ่อม</p>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                {/* Header Profile */}
                <div className="p-6 border-b border-slate-200 bg-slate-50">
                    {isEditing ? (
                        <div className="space-y-4 max-w-lg">
                            <h3 className="font-bold text-slate-800">แก้ไขข้อมูลลูกค้า</h3>
                            <div>
                                <label className="text-xs font-bold text-slate-500">ชื่อ-นามสกุล</label>
                                <input className="w-full p-2 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">เบอร์โทรศัพท์</label>
                                <input className="w-full p-2 border rounded" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500">ที่อยู่ / Tax Address</label>
                                <textarea className="w-full p-2 border rounded" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 text-sm font-bold">บันทึก</button>
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm">ยกเลิก</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-start">
                                <button onClick={() => setSelectedCustomer(null)} className="md:hidden text-slate-500 mb-4 flex items-center gap-1 text-sm font-bold"><ArrowRight className="rotate-180" size={16} /> กลับ</button>
                                <button onClick={startEdit} className="text-brand-600 hover:underline text-sm font-medium">แก้ไขข้อมูล</button>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 mb-2">{selectedCustomer.info?.name}</h1>
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <p className="flex items-center gap-2"><Phone size={16} /> {selectedCustomer.info?.phone}</p>
                                        <p className="flex items-center gap-2"><MapPin size={16} /> {selectedCustomer.info?.address || 'ไม่ระบุที่อยู่'}</p>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {Array.from(selectedCustomer.vehicles).map((v, i) => (
                                            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                                <Car size={12} /> {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center min-w-[100px]">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">ยอดใช้จ่ายรวม</p>
                                        <p className="text-xl font-bold text-green-600">฿{selectedCustomer.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                        <Wallet size={16} className="mx-auto mt-2 text-green-200" />
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center min-w-[100px]">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">จำนวนเข้าซ่อม</p>
                                        <p className="text-xl font-bold text-brand-600">{selectedCustomer.totalVisits}</p>
                                        <History size={16} className="mx-auto mt-2 text-brand-200" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar">
                    <button 
                        onClick={() => setActiveSubTab('CONTACT')}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'CONTACT' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <User size={16} /> ข้อมูลติดต่อ (Contact Details)
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('HISTORY')}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'HISTORY' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <History size={16} /> ประวัติรถยนต์ (Vehicle History)
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('COMMUNICATION')}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'COMMUNICATION' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <MessageSquare size={16} /> บันทึกการสื่อสาร (Communication Logs)
                    </button>
                </div>

                {/* Tab Content */}
                {activeSubTab === 'CONTACT' && (
                    <div className="flex-1 overflow-auto p-6 bg-slate-50">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Contact className="text-brand-600" /> ข้อมูลทั่วไป
                                    </h3>
                                    <button onClick={startEdit} className="text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-brand-100">
                                        แก้ไขข้อมูล
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ชื่อ-นามสกุล</p>
                                        <p className="text-slate-800 font-medium">{selectedCustomer.info?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เบอร์โทรศัพท์</p>
                                        <p className="text-slate-800 font-medium flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" /> {selectedCustomer.info?.phone}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ที่อยู่ (Address)</p>
                                        <p className="text-slate-800 font-medium flex items-start gap-2">
                                            <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" /> 
                                            {selectedCustomer.info?.address || <span className="text-slate-400 italic">ไม่ได้ระบุที่อยู่</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                                    <Car className="text-brand-600" /> รถยนต์ของลูกค้า ({selectedCustomer.vehicles.size} คัน)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Array.from(selectedCustomer.vehicles).map((v, i) => (
                                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-brand-600">
                                                <Car size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{(v as string).split('(')[0].trim()}</p>
                                                <p className="text-xs text-slate-500">{(v as string).split('(')[1]?.replace(')', '') || 'ไม่ระบุรุ่น'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'HISTORY' && (
                    <div className="flex-1 overflow-auto p-0">
                        <div className="p-4 bg-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 sticky top-0 border-y border-slate-200">
                            <History size={16} /> ประวัติการเข้าใช้บริการ (Service History)
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">วันที่ (Date)</th>
                                    <th className="px-6 py-3">Job No.</th>
                                    <th className="px-6 py-3">รถยนต์ (Vehicle)</th>
                                    <th className="px-6 py-3">รายการสำคัญ (Summary)</th>
                                    <th className="px-6 py-3 text-right">ยอดเงิน</th>
                                    <th className="px-6 py-3 text-center">สถานะ</th>
                                    <th className="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {selectedCustomer.history.map(job => {
                                    const total = job.items.reduce((s, i) => s + (i.quantity * i.unitPrice * (1 - (i.discount||0)/100)), 0) * (1 + job.taxRate);
                                    return (
                                        <tr key={job.id} className="hover:bg-slate-50 group">
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{job.date}</td>
                                            <td className="px-6 py-4 font-bold text-brand-700">{job.estimateNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{job.vehicle.licensePlate}</div>
                                                <div className="text-xs text-slate-400">{job.vehicle.make}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                                                {job.items[0]?.description} {job.items.length > 1 && `+${job.items.length - 1} more`}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 text-center">
                                                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                                    ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                                      job.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}
                                                 `}>
                                                     {job.status}
                                                 </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                  onClick={() => onViewJob(job)}
                                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all text-xs font-bold shadow-sm"
                                                  title="View Full Details"
                                                >
                                                    <FileText size={14} />
                                                    ดูรายละเอียด
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {activeSubTab === 'COMMUNICATION' && (
                    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Status Update Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MessageSquare className="text-brand-600" />
                                    ส่งอัปเดตสถานะงานซ่อม
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">เลือกงานที่กำลังดำเนินการเพื่อสร้างข้อความอัปเดตอัตโนมัติ</p>
                                
                                <div className="space-y-3 mb-6">
                                    {selectedCustomer.history.filter(j => j.status === 'APPROVED').map(job => (
                                        <button 
                                            key={job.id}
                                            onClick={() => handleGenerateUpdate(job)}
                                            className="w-full p-3 text-left bg-slate-50 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-white transition-all group"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-slate-700">{job.vehicle.licensePlate}</span>
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">{job.repairStage || 'QUEUED'}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">{job.estimateNumber} - {job.items[0]?.description}</p>
                                        </button>
                                    ))}
                                    {selectedCustomer.history.filter(j => j.status === 'APPROVED').length === 0 && (
                                        <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">
                                            ไม่มีงานที่กำลังดำเนินการในขณะนี้
                                        </div>
                                    )}
                                </div>

                                {generatedMessage && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="relative">
                                            <label className="text-xs font-bold text-brand-600 flex items-center gap-1 mb-1">
                                                <Sparkles size={12} /> AI Generated Message
                                            </label>
                                            <textarea 
                                                className="w-full p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-slate-700 min-h-[150px] focus:ring-2 focus:ring-brand-500 outline-none"
                                                value={generatedMessage}
                                                onChange={e => setGeneratedMessage(e.target.value)}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSendMessage}
                                            disabled={isSending}
                                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2 transition-all shadow-md"
                                        >
                                            {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                            {isSending ? 'กำลังส่ง...' : 'ส่งข้อความหาลูกค้า'}
                                        </button>
                                    </div>
                                )}
                                {isGeneratingMessage && (
                                    <div className="flex flex-col items-center justify-center py-12 text-brand-600">
                                        <Loader2 className="animate-spin mb-2" size={32} />
                                        <p className="text-sm font-bold">AI กำลังร่างข้อความ...</p>
                                    </div>
                                )}
                            </div>

                            {/* Satisfaction & Feedback Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Star className="text-orange-500" />
                                    ความพึงพอใจ & ผลตอบรับ
                                </h3>
                                <div className="space-y-6">
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <p className="text-xs font-bold text-orange-800 uppercase mb-2">คะแนนเฉลี่ย (Avg. Satisfaction)</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex text-orange-400">
                                                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill={s <= 4 ? "currentColor" : "none"} />)}
                                            </div>
                                            <span className="text-2xl font-bold text-orange-800">4.2 / 5.0</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ผลตอบรับล่าสุด (Recent Feedback)</h4>
                                        {[
                                            { date: '2024-03-10', rating: 5, comment: 'บริการดีมากครับ ช่างอธิบายละเอียด เข้าใจง่าย' },
                                            { date: '2024-02-15', rating: 4, comment: 'งานเรียบร้อยดี แต่รอนานไปนิดนึงครับ' }
                                        ].map((f, i) => (
                                            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex text-orange-400">
                                                        {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={s <= f.rating ? "currentColor" : "none"} />)}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">{f.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 italic">"{f.comment}"</p>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                                        ส่งแบบสอบถามหลังบริการ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;

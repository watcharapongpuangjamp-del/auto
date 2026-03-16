
import React, { useState } from 'react';
import { Estimate, ItemType, ShopSettings } from '../types';
import { Printer, Download, Loader2, ArrowLeft, Wrench, Clock, QrCode, ClipboardCheck } from 'lucide-react';

interface JobCardPreviewProps {
  estimate: Estimate;
  shopSettings?: ShopSettings;
  onBack: () => void;
}

const JobCardPreview: React.FC<JobCardPreviewProps> = ({ 
  estimate, 
  shopSettings, 
  onBack 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const element = document.getElementById('job-card-pdf-content');
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      // Use global html2pdf from script tag
      const html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        throw new Error('html2pdf library not loaded');
      }
      
      const opt = {
        margin: 10,
        filename: `JobCard_${estimate.vehicle?.licensePlate || 'Job'}_${estimate.estimateNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const checklistItems = [
    "ตรวจระดับน้ำมันเครื่อง/น้ำมันเบรก",
    "ตรวจสภาพสายพานหน้าเครื่อง",
    "ตรวจเช็คระบบไฟส่องสว่าง",
    "ตรวจเช็คแรงดันลมยาง/สภาพยาง",
    "ตรวจเช็คระบบช่วงล่าง/ลูกหมาก",
    "ตรวจเช็คหม้อน้ำ/ท่อยาง"
  ];

  return (
    <div className="h-full bg-gray-100 p-4 lg:p-8 overflow-auto">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
          <ArrowLeft size={20} /> กลับ (Back)
        </button>
        <div className="flex gap-3">
          <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>PDF</span>
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
            <Printer size={18} />
            พิมพ์ใบสั่งซ่อม (Print Job Card)
          </button>
        </div>
      </div>

      <div id="job-card-pdf-content" className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] text-slate-900 relative border-t-[12px] border-slate-900">
        
        {/* Top Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
          <div className="flex gap-4">
             <div className="w-16 h-16 bg-slate-900 flex items-center justify-center rounded-lg text-white">
                <Wrench size={32} />
             </div>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Job Card</h1>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em]">Repair & Inspection Order</h2>
                <div className="mt-2 text-[10px] font-bold text-slate-400">
                  REF NO: <span className="text-slate-900 text-sm ml-1 font-mono">{estimate.estimateNumber}</span>
                </div>
             </div>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 mb-1">
                <QrCode size={64} className="text-slate-300" />
             </div>
             <p className="text-[8px] text-slate-400 font-mono">SCAN TO UPDATE STATUS</p>
          </div>
        </div>

        {/* Customer & Vehicle Header Info */}
        <div className="grid grid-cols-3 gap-3 mb-6">
           <div className="col-span-2 border-2 border-slate-900 rounded-lg p-3 bg-slate-50/50">
             <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">ทะเบียน (License Plate)</p>
                   <p className="text-2xl font-black text-slate-900">{estimate.vehicle?.licensePlate || 'N/A'}</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">ยี่ห้อ/รุ่น (Vehicle)</p>
                   <p className="text-lg font-bold text-slate-800">{estimate.vehicle?.make || ''} {estimate.vehicle?.model || ''}</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">เลขไมล์ (Mileage)</p>
                   <p className="font-bold text-slate-800">{estimate.vehicle?.mileage ? Number(estimate.vehicle.mileage).toLocaleString() : '-'} km</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">เจ้าของรถ (Customer)</p>
                   <p className="font-bold text-slate-800">{estimate.customer?.name || 'N/A'}</p>
                </div>
             </div>
           </div>
           <div className="border-2 border-slate-200 rounded-lg p-3 bg-white">
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1 text-center">Fuel Level</p>
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                 <div 
                   className="h-full bg-orange-400" 
                   style={{ width: `${estimate.vehicle?.fuelLevel || 0}%` }}
                 ></div>
              </div>
              <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-1 px-1">
                 <span>E</span><span>1/2</span><span>F</span>
              </div>
              <p className="text-center font-bold text-slate-600 mt-2 text-xs">IN: {estimate.date}</p>
           </div>
        </div>

        {/* Work Orders Table */}
        <div className="mb-6">
           <h3 className="text-[11px] font-black text-slate-900 mb-2 uppercase flex items-center gap-2">
             <Wrench size={14} /> รายการซ่อมและเปลี่ยนอะไหล่ (Work Instructions)
           </h3>
           <table className="w-full text-[11px] border-collapse border-2 border-slate-900">
             <thead>
               <tr className="bg-slate-900 text-white">
                 <th className="p-2 text-center w-8 border border-slate-700">#</th>
                 <th className="p-2 text-left border border-slate-700">รายการสั่งงาน (Instruction Detail)</th>
                 <th className="p-2 text-center w-14 border border-slate-700">จำนวน</th>
                 <th className="p-2 text-center w-24 border border-slate-700">ผลงานซ่อม</th>
                 <th className="p-2 text-left border border-slate-700">หมายเหตุช่าง</th>
               </tr>
             </thead>
             <tbody>
               {(estimate.items || []).map((item, index) => (
                 <tr key={item.id} className="min-h-[45px] border-b border-slate-200">
                   <td className="p-2 text-center text-slate-400 font-mono border-r border-slate-200">{index + 1}</td>
                   <td className="p-2 border-r border-slate-200">
                     <p className="font-bold text-slate-800 leading-tight">{item.description}</p>
                     {item.partNumber && <p className="text-[8px] text-slate-500 mt-0.5">PN: {item.partNumber}</p>}
                     {item.type === ItemType.LABOR && item.standardHours && (
                        <p className="text-[8px] text-blue-600 font-bold">FRT: {item.standardHours} h</p>
                     )}
                   </td>
                   <td className="p-2 text-center font-bold border-r border-slate-200">{item.quantity}</td>
                   <td className="p-2 border-r border-slate-200">
                      <div className="flex gap-2 justify-center">
                         <div className="flex items-center gap-1">
                            <div className="w-4 h-4 border-2 border-slate-400 rounded"></div>
                            <span className="text-[8px] font-bold">DONE</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <div className="w-4 h-4 border-2 border-slate-400 rounded"></div>
                            <span className="text-[8px] font-bold">N/A</span>
                         </div>
                      </div>
                   </td>
                   <td className="p-2 border-r border-slate-200"></td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* Inspection Checklist & Symptoms */}
        <div className="grid grid-cols-2 gap-6 mb-6">
           <div>
              <h3 className="text-[11px] font-black text-slate-900 mb-2 uppercase flex items-center gap-2">
                <ClipboardCheck size={14} /> รายการตรวจเช็คมาตรฐาน (Standard Checklist)
              </h3>
              <div className="border-2 border-slate-900 rounded-lg p-3 space-y-2">
                 {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] border-b border-slate-100 pb-1 last:border-0">
                       <span className="text-slate-700">{item}</span>
                       <div className="flex gap-2">
                          <span className="flex items-center gap-1"><div className="w-3 h-3 border border-slate-400 rounded"></div> OK</span>
                          <span className="flex items-center gap-1"><div className="w-3 h-3 border border-slate-400 rounded"></div> ADJ</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div>
              <h3 className="text-[11px] font-black text-slate-900 mb-2 uppercase flex items-center gap-2">
                <Clock size={14} /> บันทึกอาการแจ้งซ่อม (Symptoms / Request)
              </h3>
              <div className="border-2 border-slate-200 rounded-lg p-3 bg-slate-50 min-h-[120px] text-[10px] text-slate-600 whitespace-pre-wrap">
                 {estimate.vehicle?.checkInNotes || estimate.notes || "ไม่มีข้อมูลเพิ่มเติม"}
              </div>
           </div>
        </div>

        {/* Footer Signatures */}
        <div className="mt-auto pt-10 grid grid-cols-2 gap-12">
           <div className="text-center">
              <div className="border-b-2 border-slate-300 h-12 mb-2"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase">พนักงานรับรถ (Service Advisor)</p>
              <p className="text-[8px] text-slate-400">Date: ____/____/____</p>
           </div>
           <div className="text-center">
              <div className="border-b-2 border-slate-300 h-12 mb-2"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase">ช่างผู้รับผิดชอบ (Mechanic Sign-off)</p>
              <p className="text-[8px] text-slate-400">Time Finished: ________</p>
           </div>
        </div>

        <div className="mt-8 text-[8px] text-slate-400 text-center uppercase tracking-widest border-t border-slate-100 pt-4">
           AutoQuote AI - Professional Workshop Management System
        </div>
      </div>
    </div>
  );
};

export default JobCardPreview;

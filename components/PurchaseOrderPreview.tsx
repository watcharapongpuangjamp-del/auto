import React, { useState } from 'react';
import { PurchaseOrder, ShopSettings } from '../types';
import { Printer, Download, Loader2, ArrowLeft } from 'lucide-react';

interface PurchaseOrderPreviewProps {
  purchaseOrder: PurchaseOrder;
  shopSettings?: ShopSettings;
  onBack: () => void;
}

const PurchaseOrderPreview: React.FC<PurchaseOrderPreviewProps> = ({ 
  purchaseOrder, 
  shopSettings, 
  onBack
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const element = document.getElementById('po-pdf-content');
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
        filename: `${purchaseOrder.poNumber}.pdf`,
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
          <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm">
            <Printer size={18} />
            พิมพ์ (Print)
          </button>
        </div>
      </div>

      <div id="po-pdf-content" className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-[15mm] text-slate-900 relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">ใบสั่งซื้อ</h1>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">PURCHASE ORDER</h2>
            
            <div className="mt-4 space-y-1 text-sm">
               <p><span className="font-bold text-slate-700">ถึง (To Vendor):</span> {purchaseOrder.vendorName}</p>
               <p><span className="font-bold text-slate-700">วันที่ (Date):</span> {purchaseOrder.date}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-brand-600 mb-2">{purchaseOrder.poNumber}</div>
             <div className="text-xs text-slate-500 max-w-[250px] leading-relaxed">
                <strong>ผู้ออกเอกสาร (Buyer):</strong><br/>
                {shopSettings?.name}<br/>
                {shopSettings?.address}<br/>
                Tel: {shopSettings?.phone}
             </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="py-3 px-2 text-center w-12">#</th>
              <th className="py-3 px-2 text-left">รายการ (Description)</th>
              <th className="py-3 px-2 text-left w-32">P/N</th>
              <th className="py-3 px-2 text-center w-20">Job Ref.</th>
              <th className="py-3 px-2 text-center w-20">จำนวน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchaseOrder.items.map((item, index) => (
              <tr key={index}>
                <td className="py-3 px-2 text-center text-slate-400">{index + 1}</td>
                <td className="py-3 px-2 font-medium text-slate-800">{item.description}</td>
                <td className="py-3 px-2 font-mono text-slate-500 text-xs">{item.partNumber || '-'}</td>
                <td className="py-3 px-2 text-center text-xs bg-slate-50 rounded">{item.relatedJobNumber}</td>
                <td className="py-3 px-2 text-center font-bold text-slate-800">{item.quantityNeeded}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer info */}
        <div className="mt-12 grid grid-cols-2 gap-12">
           <div className="text-xs text-slate-500 border border-slate-200 p-4 rounded bg-slate-50">
             <h4 className="font-bold mb-2">หมายเหตุ (Notes):</h4>
             <p>{purchaseOrder.notes || '-'}</p>
             <p className="mt-2">โปรดระบุเลขที่ใบสั่งซื้อในใบกำกับภาษี/ใบส่งของทุกครั้ง</p>
           </div>
           
           <div className="text-center mt-8">
              <div className="border-b border-slate-300 w-3/4 mx-auto mb-2"></div>
              <p className="text-xs font-bold text-slate-500 uppercase">ผู้อนุมัติสั่งซื้อ (Authorized Signature)</p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default PurchaseOrderPreview;
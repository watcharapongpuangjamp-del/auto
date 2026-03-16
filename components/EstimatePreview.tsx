
import React, { useState } from 'react';
import { Estimate, ItemType, ShopSettings } from '../types';
import { Printer, Download, Loader2, QrCode } from 'lucide-react';
import { thaiBahtText } from '../utils/thaiBaht';

interface EstimatePreviewProps {
  estimate: Estimate;
  shopSettings?: ShopSettings;
  onBack: () => void;
  documentType?: 'QUOTATION' | 'RECEIPT';
}

const EstimatePreview: React.FC<EstimatePreviewProps> = ({ 
  estimate, 
  shopSettings, 
  onBack,
  documentType = 'QUOTATION' 
}) => {
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const itemsSubtotal = (estimate.items || []).reduce((sum, item) => {
    const discount = item.discount || 0;
    const itemTotal = item.quantity * item.unitPrice * (1 - discount / 100);
    return sum + itemTotal;
  }, 0);
  
  const totalDiscount = estimate.totalDiscount || 0;
  const subtotalAfterDiscount = itemsSubtotal - totalDiscount;
  const vatAmount = subtotalAfterDiscount * (estimate.taxRate || 0);
  const total = subtotalAfterDiscount + vatAmount;

  const shopName = shopSettings?.name || "AutoFix Center";
  const shopAddress = shopSettings?.address || "123 Sukhumvit Road";
  const shopPhone = shopSettings?.phone || "02-123-4567";
  const shopTaxId = shopSettings?.taxId || "N/A";

  const titleTH = documentType === 'RECEIPT' ? 'ใบเสร็จรับเงิน / ใบกำกับภาษี' : 'ใบเสนอราคา';
  const titleEN = documentType === 'RECEIPT' ? 'RECEIPT / TAX INVOICE' : 'QUOTATION';
  const numberLabel = documentType === 'RECEIPT' ? 'เลขที่ใบเสร็จ (Receipt No.)' : 'เลขที่ (Est. No.)';
  const numberValue = documentType === 'RECEIPT' ? (estimate.receiptNumber || estimate.estimateNumber) : estimate.estimateNumber;
  const dateValue = documentType === 'RECEIPT' ? (estimate.receiptDate || estimate.date) : estimate.date;

  const handlePrintClick = () => { window.print(); };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const element = document.getElementById('estimate-pdf-content');
    if (!element) return;
    try {
      const html2pdf = (window as any).html2pdf;
      const opt = {
        margin: 0,
        filename: `${documentType}_${numberValue}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) { console.error(err); } finally { setIsDownloading(false); }
  };

  return (
    <div className="h-full bg-gray-100 p-4 lg:p-8 overflow-auto">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2">
          &larr; ย้อนกลับ
        </button>
        <div className="flex gap-3">
          <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>Download PDF</span>
          </button>
          <button onClick={handlePrintClick} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm">
            <Printer size={18} />
            พิมพ์เอกสาร
          </button>
        </div>
      </div>

      <div id="estimate-pdf-content" className="bg-white shadow-xl mx-auto max-w-[210mm] min-h-[297mm] p-[10mm] md:p-[15mm] text-slate-900 relative">
        <div className="absolute top-4 right-10 text-[10px] font-bold text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-1">
          ต้นฉบับ / ORIGINAL
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-brand-500 pb-6">
          <div className="flex gap-4 items-start">
            {shopSettings?.logoUrl && (
              <div className="w-20 h-20 flex-shrink-0 mr-2 border border-slate-100 rounded-lg p-1">
                <img src={shopSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-brand-600 leading-tight uppercase">{shopName}</div>
              <p className="text-[11px] text-gray-500 whitespace-pre-wrap leading-relaxed max-w-[400px] mt-1">
                {shopAddress}<br />
                โทร: {shopPhone} | เลขประจำตัวผู้เสียภาษี: {shopTaxId}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-slate-800">{titleTH}</h1>
            <h2 className="text-sm text-gray-500 uppercase tracking-wider">{titleEN}</h2>
            <div className="mt-4 text-[11px] space-y-1">
              <p><span className="font-semibold text-slate-500">{numberLabel}:</span> <span className="font-bold">{numberValue}</span></p>
              <p><span className="font-semibold text-slate-500">วันที่ (Date):</span> {dateValue}</p>
              {documentType === 'QUOTATION' && (
                <p><span className="font-semibold text-slate-500">ยืนยันราคาถึง:</span> {estimate.dueDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Vehicle */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
            <h3 className="text-brand-700 text-[10px] font-bold uppercase tracking-widest mb-1">ข้อมูลลูกค้า (Customer)</h3>
            <div className="text-[11px] space-y-0.5">
              <p className="font-bold text-sm text-slate-800">{estimate.customer?.name || 'N/A'}</p>
              <p className="text-slate-500">{estimate.customer?.address || ''}</p>
              <p>โทร: <span className="font-bold">{estimate.customer?.phone || ''}</span></p>
              {estimate.customer?.taxId && <p>เลขประจำตัวผู้เสียภาษี: {estimate.customer.taxId}</p>}
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/30">
            <h3 className="text-brand-700 text-[10px] font-bold uppercase tracking-widest mb-1">ข้อมูลรถยนต์ (Vehicle)</h3>
            <div className="text-[11px] space-y-0.5">
              <p className="font-bold text-sm text-slate-800">{estimate.vehicle?.make || ''} {estimate.vehicle?.model || ''}</p>
              <p>ทะเบียน: <span className="font-bold text-sm px-2 py-0.5 bg-white border border-slate-300 rounded">{estimate.vehicle?.licensePlate || ''}</span></p>
              <p>เลขไมล์: {estimate.vehicle?.mileage ? Number(estimate.vehicle.mileage).toLocaleString() : '-'} km</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-[11px] mb-8 border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2 text-left">รายละเอียดรายการ (Description)</th>
              <th className="py-2 px-2 text-center w-16">จำนวน</th>
              <th className="py-2 px-2 text-right w-24">หน่วยละ</th>
              <th className="py-2 px-2 text-center w-12">ลด%</th>
              <th className="py-2 px-2 text-right w-24">รวมเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-b-2 border-slate-800">
            {(estimate.items || []).map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="py-2 px-2 text-center text-gray-400">{index + 1}</td>
                <td className="py-2 px-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{item.description}</p>
                      <div className="flex flex-wrap gap-x-3">
                        {item.partNumber && <p className="text-[9px] text-slate-400 font-mono">P/N: {item.partNumber}</p>}
                        {item.serialNumber && <p className="text-[9px] text-brand-500 font-mono">S/N: {item.serialNumber}</p>}
                      </div>
                    </div>
                    {item.category && (
                      <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase ml-2">
                        {item.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-center">{item.quantity}</td>
                <td className="py-2 px-2 text-right">{item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                <td className="py-2 px-2 text-center text-gray-400">{item.discount || '-'}</td>
                <td className="py-2 px-2 text-right font-bold">
                  {(item.quantity * item.unitPrice * (1 - (item.discount || 0)/100)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-between items-start break-inside-avoid">
          <div className="flex-1 pr-10">
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">จำนวนเงินตัวอักษร (Total in Words)</p>
              <p className="text-sm font-bold text-brand-800">({thaiBahtText(total)})</p>
            </div>
            {documentType === 'RECEIPT' && shopSettings?.bankInfo && (
              <div className="mt-4 flex items-center gap-4 border border-slate-100 p-2 rounded">
                 <QrCode size={48} className="text-slate-400" />
                 <div className="text-[9px] text-slate-500">
                    <p className="font-bold text-slate-700">ชำระเงินผ่าน (Payment Information):</p>
                    <p>{shopSettings.bankInfo}</p>
                 </div>
              </div>
            )}
          </div>
          
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>รวมเป็นเงิน (Subtotal)</span>
              <span>{itemsSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-[11px] text-red-600 font-bold">
                <span>หักส่วนลดพิเศษ (Discount)</span>
                <span>-{totalDiscount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
              <span>{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-brand-700 border-t-2 border-brand-500 pt-2 mt-2">
              <span>ยอดเงินสุทธิ</span>
              <span>{total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-10 mt-16 break-inside-avoid">
          <div className="text-center">
            <div className="border-b border-slate-300 h-16 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">ผู้รับมอบอำนาจ / Authorized Signature</p>
            <p className="text-[9px] text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-300 h-16 mb-2"></div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">ในนามลูกค้า / Customer Acceptance</p>
            <p className="text-[9px] text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-100 flex justify-between items-end text-[9px] text-slate-400 italic">
          <div>
            <p><strong>หมายเหตุ:</strong> {estimate.notes || shopSettings?.defaultNotes}</p>
            <p className="mt-1">Generated by AutoQuote AI Smart System</p>
          </div>
          <div className="text-right">
            หน้า 1 / 1
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimatePreview;

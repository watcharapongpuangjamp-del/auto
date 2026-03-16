
import React, { useState } from 'react';
import { Estimate } from '../types';
import { FileCheck, Search, Eye, FileText, Check } from 'lucide-react';

interface ReceiptsListProps {
  estimates: Estimate[];
  onViewReceipt: (estimate: Estimate) => void;
  onConvert: (estimate: Estimate) => void;
}

const ReceiptsList: React.FC<ReceiptsListProps> = ({ estimates, onViewReceipt, onConvert }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ISSUED' | 'PENDING'>('ISSUED');

  const issuedReceipts = estimates.filter(e => e.status === 'COMPLETED');
  const pendingEstimates = estimates.filter(e => e.status === 'APPROVED');

  const displayList = activeTab === 'ISSUED' ? issuedReceipts : pendingEstimates;
  const filteredList = displayList.filter(e => 
    (e.customer?.name || '').toLowerCase().includes(query.toLowerCase()) || 
    e.estimateNumber.toLowerCase().includes(query.toLowerCase()) ||
    (e.receiptNumber && e.receiptNumber.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileCheck className="text-brand-600" />
          จัดการใบเสร็จรับเงิน (Receipts)
        </h2>
        <p className="text-sm text-slate-500 mt-1">ออกใบเสร็จรับเงินสำหรับงานซ่อมที่อนุมัติแล้ว และดูประวัติย้อนหลัง</p>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('ISSUED')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ISSUED' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          ออกใบเสร็จแล้ว (Issued)
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'PENDING' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          รอออกใบเสร็จ (Pending)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อลูกค้า หรือ เลขที่เอกสาร..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">{activeTab === 'ISSUED' ? 'Receipt No.' : 'Est No.'}</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    {activeTab === 'ISSUED' ? 'ยังไม่มีใบเสร็จที่ออกแล้ว' : 'ไม่มีรายการที่รออนุมัติ'}
                  </td>
                </tr>
              ) : (
                filteredList.map(est => {
                  const subtotal = est.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - (i.discount||0)/100)), 0);
                  const total = subtotal * (1 + est.taxRate);

                  return (
                    <tr key={est.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {activeTab === 'ISSUED' ? est.receiptNumber : est.estimateNumber}
                      </td>
                      <td className="px-4 py-3">{est.customer?.name}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {activeTab === 'ISSUED' ? est.receiptDate : est.date}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{est.vehicle.licensePlate}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {total.toLocaleString('th-TH', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activeTab === 'ISSUED' ? (
                          <button 
                            onClick={() => onViewReceipt(est)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-medium"
                          >
                            <FileText size={14} /> ดูใบเสร็จ
                          </button>
                        ) : (
                          <button 
                            onClick={() => onConvert(est)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-xs font-medium"
                          >
                            <Check size={14} /> ออกใบเสร็จ
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceiptsList;

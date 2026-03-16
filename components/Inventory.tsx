
import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Trash2, Edit2, AlertTriangle, Filter, ShoppingCart, Check, FileText, Printer, Box, Wrench, ArrowRight, X, Store, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { InventoryItem, ProcurementRequest, PurchaseOrder, Estimate, ItemType } from '../types';
import { REPAIR_CATEGORIES } from '../constants';
import { optimizeInventory } from '../services/geminiService';

interface InventoryProps {
  items: InventoryItem[];
  onUpdateItems: (items: InventoryItem[]) => void;
  procurementRequests?: ProcurementRequest[];
  purchaseOrders?: PurchaseOrder[];
  onResolveRequest?: (req: ProcurementRequest, finalItem: InventoryItem) => void;
  onCreatePO?: (requests: ProcurementRequest[], vendor: string) => void;
  onReceivePO?: (po: PurchaseOrder) => void;
  onReceivePOItem?: (poId: string, requestId: string) => void;
  onViewPO?: (po: PurchaseOrder) => void;
  estimates?: Estimate[];
  onEditJob?: (estimate: Estimate) => void;
}

const Inventory: React.FC<InventoryProps> = ({ 
  items, 
  onUpdateItems,
  procurementRequests = [],
  purchaseOrders = [],
  onCreatePO,
  onReceivePO,
  onReceivePOItem,
  onViewPO,
  estimates = [],
  onEditJob
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'WIP' | 'REQUESTS' | 'PO_HISTORY'>('STOCK');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<{ id: string, suggestedMin: number, reason: string }[]>([]);

  // Procurement Selection
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
  const [showPOModal, setShowPOModal] = useState(false);
  const [vendorName, setVendorName] = useState('');

  const emptyForm: InventoryItem = {
    id: '', partNumber: '', officialPartNumber: '', name: '', category: 'General', 
    quantity: 0, minQuantity: 0, costPrice: 0, sellingPrice: 0, 
    location: '', lastUpdated: ''
  };
  const [formData, setFormData] = useState<InventoryItem>(emptyForm);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(items.map(item => item.category)));
    return uniqueCats.sort();
  }, [items]);

  const filteredItems = items.filter(item => {
    if (!item) return false;
    const matchesQuery = (item.name || '').toLowerCase().includes(query.toLowerCase()) || 
                         (item.partNumber || '').toLowerCase().includes(query.toLowerCase()) ||
                         (item.officialPartNumber && item.officialPartNumber.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });

  const pendingRequests = procurementRequests.filter(r => r.status === 'PENDING');
  const activeJobs = (estimates || []).filter(e => e.status === 'APPROVED');

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('ยืนยันการลบรายการนี้?')) {
      onUpdateItems(items.filter(i => i.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.partNumber || !formData.name) {
      alert('กรุณากรอกรหัสและชื่ออะไหล่');
      return;
    }
    if (editingItem) {
      onUpdateItems(items.map(i => i.id === editingItem.id ? { ...formData, lastUpdated: new Date().toISOString().split('T')[0] } : i));
    } else {
      onUpdateItems([...items, { ...formData, id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, lastUpdated: new Date().toISOString().split('T')[0] }]);
    }
    setShowModal(false);
    setEditingItem(null);
    setFormData(emptyForm);
  };

  const toggleRequestSelection = (id: string) => {
    const newSet = new Set(selectedRequestIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRequestIds(newSet);
  };

  const handleConfirmCreatePO = () => {
    if (!vendorName.trim()) {
      alert('กรุณาระบุชื่อร้านค้า (Vendor)');
      return;
    }
    if (onCreatePO) {
       const selectedReqs = procurementRequests.filter(r => selectedRequestIds.has(r.id));
       onCreatePO(selectedReqs, vendorName);
       setSelectedRequestIds(new Set());
       setShowPOModal(false);
       setActiveTab('PO_HISTORY');
    }
  };

  const handleAiOptimize = async () => {
    setIsOptimizing(true);
    try {
      const results = await optimizeInventory(items, estimates);
      setOptimizationResults(results);
    } catch (error) {
      console.error("Optimization failed", error);
      alert("การวิเคราะห์ล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimization = () => {
    const newItems = items.map(item => {
      const result = optimizationResults.find(r => r.id === item.id);
      if (result) {
        return { ...item, minQuantity: result.suggestedMin };
      }
      return item;
    });
    onUpdateItems(newItems);
    setOptimizationResults([]);
    alert("ปรับปรุงจุดสั่งซื้อเรียบร้อยแล้ว");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-brand-600" />
            คลังอะไหล่ (Inventory)
          </h2>
          <p className="text-sm text-slate-500">จัดการจำนวนอะไหล่ ตรวจสอบการเบิกใช้ และจัดซื้อ</p>
        </div>
        <div className="flex flex-wrap gap-2">
             <button 
                onClick={() => setActiveTab('STOCK')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'STOCK' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                รายการสต็อค
            </button>
            <button 
                onClick={() => setActiveTab('WIP')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'WIP' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Wrench size={14} />
                งานระหว่างซ่อม ({activeJobs.length})
            </button>
            <button 
                id="inventory-tab-requests"
                onClick={() => setActiveTab('REQUESTS')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors relative ${activeTab === 'REQUESTS' ? 'bg-orange-100 text-orange-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                ขอซื้อ (Requests)
                {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{pendingRequests.length}</span>}
            </button>
            <button 
                onClick={() => setActiveTab('PO_HISTORY')}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'PO_HISTORY' ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                ใบสั่งซื้อ (PO)
            </button>
             <button 
            onClick={() => { setEditingItem(null); setFormData(emptyForm); setShowModal(true); }}
            className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 text-sm font-bold ml-2"
            >
            <Plus size={16} /> เพิ่มอะไหล่
            </button>
        </div>
      </div>

      {activeTab === 'STOCK' && (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Total Items</p>
                <p className="text-2xl font-bold text-slate-800">{items.length}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{items.filter(i => i.quantity > 0 && i.quantity <= i.minQuantity).length}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{items.filter(i => i.quantity === 0).length}</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={20} /></div>
            </div>
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 shadow-sm flex items-center justify-between col-span-1 md:col-span-3">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-100 text-brand-600 rounded-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-800">AI Stock Optimization</p>
                  <p className="text-xs text-brand-600">วิเคราะห์ประวัติการซ่อมเพื่อปรับจุดสั่งซื้อ (Min Qty) ให้เหมาะสมกับความต้องการจริง</p>
                </div>
              </div>
              <button 
                onClick={handleAiOptimize}
                disabled={isOptimizing}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isOptimizing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {isOptimizing ? 'กำลังวิเคราะห์...' : 'เริ่มการวิเคราะห์'}
              </button>
            </div>
        </div>

        {optimizationResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-brand-500 overflow-hidden mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="p-4 bg-brand-500 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-bold">ผลการวิเคราะห์จาก AI</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOptimizationResults([])} className="px-3 py-1 text-xs font-bold bg-white/20 hover:bg-white/30 rounded">ยกเลิก</button>
                <button onClick={applyOptimization} className="px-3 py-1 text-xs font-bold bg-white text-brand-600 hover:bg-brand-50 rounded">นำไปใช้ทั้งหมด</button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-left border-b">
                    <th className="pb-2">อะไหล่</th>
                    <th className="pb-2 text-center">Min เดิม</th>
                    <th className="pb-2 text-center text-brand-600">Min ใหม่</th>
                    <th className="pb-2">เหตุผล</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {optimizationResults.map(res => {
                    const item = items.find(i => i.id === res.id);
                    if (!item) return null;
                    return (
                      <tr key={res.id}>
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-center text-slate-400">{item.minQuantity}</td>
                        <td className="py-2 text-center font-bold text-brand-600">{res.suggestedMin}</td>
                        <td className="py-2 text-xs text-slate-600">{res.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                type="text"
                placeholder="ค้นหารหัสอะไหล่ หรือ ชื่อ (Search Part No. or Name)"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                />
            </div>
            <div className="relative w-full md:w-64">
                <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <select 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                >
                <option value="All">ทุกหมวดหมู่ (All Categories)</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
                </select>
            </div>
            </div>
            
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600">
                <tr>
                    <th className="px-4 py-3">Part No. (SKU)</th>
                    <th className="px-4 py-3 bg-slate-100/50">Official P/N</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{item.partNumber}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 bg-slate-50/50">{item.officialPartNumber || '-'}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{item.category}</span></td>
                    <td className="px-4 py-3">{item.location}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{item.costPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.sellingPrice.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                    <td className="px-4 py-3 text-center">
                        {item.quantity === 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Out of Stock</span>
                        ) : item.quantity <= item.minQuantity ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Low Stock</span>
                        ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">In Stock</span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-1 text-slate-400 hover:text-brand-600"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
      </>
      )}

      {activeTab === 'WIP' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
                    <Wrench size={20} /> ตรวจสอบการใช้อะไหล่ในงานซ่อม (Parts Usage Monitor)
                </h3>
                <p className="text-sm text-indigo-600 mt-1">
                    แสดงรายการอะไหล่ที่ถูกตัดสต็อกไปใช้ในงานซ่อมที่ยังไม่ปิดงาน (Approved Jobs)
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-3">Job ID</th>
                            <th className="px-6 py-3">Vehicle</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Parts Used (รายการอะไหล่ที่เบิก)</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {activeJobs.map(job => {
                             const parts = job.items.filter(i => i.type === ItemType.PART);
                             return (
                                <tr key={job.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{job.estimateNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{job.vehicle.licensePlate}</div>
                                        <div className="text-xs text-slate-500">{job.vehicle.make} {job.vehicle.model}</div>
                                    </td>
                                    <td className="px-6 py-4">{job.customer?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        {parts.length > 0 ? (
                                            <ul className="space-y-1">
                                                {parts.map(part => (
                                                    <li key={part.id} className="text-xs flex items-center gap-2">
                                                        <Box size={12} className="text-blue-500" />
                                                        <span className="font-medium text-slate-700">{part.description}</span>
                                                        <span className="text-slate-500">x{part.quantity}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No parts assigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => onEditJob && onEditJob(job)}
                                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-brand-600 text-xs font-bold shadow-sm inline-flex items-center gap-1"
                                        >
                                            <Plus size={14} /> เพิ่มอะไหล่
                                        </button>
                                    </td>
                                </tr>
                             );
                        })}
                        {activeJobs.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400">ไม่มีงานซ่อมที่กำลังดำเนินการ</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
      
      {activeTab === 'REQUESTS' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">รายการอะไหล่ที่ต้องสั่งซื้อ (Procurement Requests)</h3>
                    <p className="text-sm text-slate-500">เลือกรายการที่ต้องการเพื่อออกใบสั่งซื้อ (PO)</p>
                </div>
                <button 
                    disabled={selectedRequestIds.size === 0}
                    onClick={() => setShowPOModal(true)}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                >
                    <ShoppingCart size={18} />
                    สร้างใบสั่งซื้อ (PO) {selectedRequestIds.size > 0 && `(${selectedRequestIds.size})`}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <input type="checkbox" 
                                    checked={pendingRequests.length > 0 && selectedRequestIds.size === pendingRequests.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedRequestIds(new Set(pendingRequests.map(r => r.id)));
                                        else setSelectedRequestIds(new Set());
                                    }}
                                />
                            </th>
                            <th className="px-6 py-3">Description</th>
                            <th className="px-6 py-3">P/N</th>
                            <th className="px-6 py-3 text-center">Qty Needed</th>
                            <th className="px-6 py-3">Job Ref</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pendingRequests.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <input type="checkbox" 
                                        checked={selectedRequestIds.has(req.id)}
                                        onChange={() => toggleRequestSelection(req.id)}
                                    />
                                </td>
                                <td className="px-6 py-4 font-medium">{req.description}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.partNumber || '-'}</td>
                                <td className="px-6 py-4 text-center font-bold text-brand-600">{req.quantityNeeded}</td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{req.relatedJobNumber}</td>
                                <td className="px-6 py-4 text-xs text-slate-400">{new Date(req.requestDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {pendingRequests.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-slate-400 italic">ไม่มีรายการขอซื้อค้างอยู่</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'PO_HISTORY' && (
        <div className="space-y-4">
            {purchaseOrders.map(po => (
                <div key={po.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div 
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedPoId(expandedPoId === po.id ? null : po.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${po.status === 'RECEIVED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{po.poNumber}</h4>
                                <p className="text-xs text-slate-500">Vendor: {po.vendorName} | {po.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${po.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {po.status}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onViewPO && onViewPO(po); }}
                                    className="p-2 text-slate-400 hover:text-brand-600"
                                >
                                    <Printer size={18} />
                                </button>
                                {po.status !== 'RECEIVED' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onReceivePO && onReceivePO(po); }}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                                    >
                                        Receive All
                                    </button>
                                )}
                                {expandedPoId === po.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                            </div>
                        </div>
                    </div>

                    {expandedPoId === po.id && (
                        <div className="p-4 border-t bg-slate-50">
                            <table className="w-full text-xs">
                                <thead className="text-slate-500 uppercase">
                                    <tr className="border-b">
                                        <th className="p-2 text-left">Item</th>
                                        <th className="p-2 text-left">P/N</th>
                                        <th className="p-2 text-center">Qty</th>
                                        <th className="p-2 text-center">Job Ref</th>
                                        <th className="p-2 text-right">Status</th>
                                        <th className="p-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {po.items.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="p-2 font-medium">{item.description}</td>
                                            <td className="p-2 font-mono">{item.partNumber || '-'}</td>
                                            <td className="p-2 text-center font-bold">{item.quantityNeeded}</td>
                                            <td className="p-2 text-center text-slate-500">{item.relatedJobNumber}</td>
                                            <td className="p-2 text-right">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.status === 'RECEIVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-2 text-right">
                                                {item.status !== 'RECEIVED' && po.status !== 'RECEIVED' && (
                                                    <button 
                                                        onClick={() => onReceivePOItem && onReceivePOItem(po.id, item.id)}
                                                        className="px-2 py-1 bg-white border border-green-600 text-green-600 rounded text-[10px] font-bold hover:bg-green-600 hover:text-white transition-colors"
                                                    >
                                                        Receive Item
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ))}
            {purchaseOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 italic">ไม่มีประวัติใบสั่งซื้อ</div>
            )}
        </div>
      )}

      {/* PO Creation Modal */}
      {showPOModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold mb-4">ออกใบสั่งซื้อ (Create PO)</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">สั่งซื้อจากร้านค้า (Vendor Name)</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                            placeholder="ระบุชื่อร้านค้า..."
                            value={vendorName}
                            onChange={(e) => setVendorName(e.target.value)}
                          />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 font-bold mb-2">Selected Items:</p>
                          <ul className="space-y-1">
                              {procurementRequests.filter(r => selectedRequestIds.has(r.id)).map(r => (
                                  <li key={r.id} className="text-xs flex justify-between">
                                      <span>{r.description}</span>
                                      <span className="font-bold">x{r.quantityNeeded}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowPOModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button onClick={handleConfirmCreatePO} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">ยืนยันการสั่งซื้อ</button>
                  </div>
              </div>
          </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Part Number (Internal SKU)</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.partNumber} onChange={(e) => setFormData({...formData, partNumber: e.target.value})} placeholder="SKU-001" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Official Part No. (P/N)</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm" 
                  value={formData.officialPartNumber || ''} onChange={(e) => setFormData({...formData, officialPartNumber: e.target.value})} placeholder="e.g. 15400-RAF-T01" />
              </div>

               <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <input 
                  type="text" 
                  list="category-suggestions"
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  placeholder="Select or type..."
                />
                <datalist id="category-suggestions">
                  {Array.from(new Set([...categories, ...REPAIR_CATEGORIES])).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Qty</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Min Qty (Alert)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.minQuantity} onChange={(e) => setFormData({...formData, minQuantity: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cost Price</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.costPrice} onChange={(e) => {
                    const cost = Number(e.target.value);
                    setFormData({...formData, costPrice: cost, sellingPrice: Math.ceil(cost / 0.4)});
                  }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Selling Price</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.sellingPrice} onChange={(e) => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
              </div>
              <div className="col-span-2">
                 <label className="block text-xs font-medium text-slate-700 mb-1">Location / Shelf</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500" 
                  value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;

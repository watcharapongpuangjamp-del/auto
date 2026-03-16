
import React, { useState } from 'react';
import { Search, Loader2, PlusCircle, ExternalLink, ShieldCheck, Tag, Hash, Info, ShoppingBag, Package, Box } from 'lucide-react';
import { searchPartsPricing } from '../services/geminiService';
import { SearchResult, LineItem, ItemType, InventoryItem } from '../types';

interface PartsLookupProps {
  onAddPart: (item: LineItem) => void;
  inventoryItems?: InventoryItem[];
  initialQuery?: string;
}

const PartsLookup: React.FC<PartsLookupProps> = ({ onAddPart, inventoryItems = [], initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const localMatches = query.trim() 
    ? inventoryItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.partNumber?.toLowerCase().includes(query.toLowerCase()) ||
        item.officialPartNumber?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setResults([]);
    
    try {
      const data = await searchPartsPricing(searchQuery);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleAdd = (result: SearchResult) => {
    const cost = result.price || 0;
    onAddPart({
      id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: result.title,
      quantity: 1,
      unitPrice: Math.ceil(cost / 0.4),
      costPrice: cost,
      type: ItemType.PART,
      partNumber: result.partNumber,
      officialPrice: result.officialPrice
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Search className="text-brand-500" />
          ค้นหาอะไหล่ & ตรวจสอบราคา (Parts Intelligence)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          เปรียบเทียบราคาตลาด ราคาศูนย์บริการ และค้นหาหมายเลขพาร์ทแท้จาก AI
        </p>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-sm text-lg font-medium"
              placeholder="พิมพ์ชื่ออะไหล่ หรือ รุ่นรถ เช่น 'น้ำมันเครื่อง Toyota Altis'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 font-bold flex items-center gap-2 shadow-lg shadow-brand-100 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={24} />}
            ค้นหา
          </button>
        </form>

        {localMatches.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package size={16} className="text-brand-500" /> พบในคลังสินค้าของคุณ (In Your Inventory)
            </h3>
            <div className="grid gap-3">
              {localMatches.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-brand-50/50 border border-brand-100 rounded-xl hover:bg-brand-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-600 shadow-sm border border-brand-100">
                      <Box size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono">P/N: {item.partNumber || item.officialPartNumber} | คงเหลือ: <span className="font-bold text-brand-600">{item.quantity}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-black text-brand-700">฿{item.sellingPrice.toLocaleString()}</p>
                      <p className="text-[10px] text-brand-500 font-bold uppercase">ราคาในร้าน</p>
                    </div>
                    <button 
                      onClick={() => onAddPart({
                        id: `part-inv-${Date.now()}`,
                        description: item.name,
                        quantity: 1,
                        unitPrice: item.sellingPrice,
                        costPrice: item.costPrice,
                        type: ItemType.PART,
                        partNumber: item.partNumber || item.officialPartNumber,
                        inventoryId: item.id
                      })}
                      className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all active:scale-95"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 ? (
          <div className="grid gap-6">
            {results.map((item, idx) => (
              <div key={idx} className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-100 transition-all bg-white group border-l-4 border-l-slate-200 hover:border-l-brand-500">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="font-bold text-slate-800 text-xl group-hover:text-brand-700 transition-colors">{item.title}</h4>
                    {item.partNumber && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-sm">
                        <Hash size={12} className="text-brand-400" />
                        <span className="text-xs font-black uppercase tracking-wider">OEM P/N: {item.partNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
                    <div className="flex flex-col">
                      <div className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-1 mb-1 tracking-widest">
                         <Tag size={12} className="text-brand-500" /> ราคาตลาด (Market Price)
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-800">฿{(item.price || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-400 font-bold">ประมาณ</span>
                      </div>
                    </div>
                    
                    {item.officialPrice && (
                      <div className="flex flex-col lg:border-l lg:border-slate-100 lg:pl-12">
                        <div className="text-[10px] text-green-600 uppercase font-black flex items-center gap-1 mb-1 tracking-widest">
                           <ShieldCheck size={14} /> ราคาศูนย์บริการ (Official)
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-green-700">฿{item.officialPrice.toLocaleString()}</span>
                          <span className="text-xs text-green-500/50 font-bold">ศูนย์แท้</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col lg:border-l lg:border-slate-100 lg:pl-12 text-slate-500">
                      <div className="text-[10px] uppercase font-black flex items-center gap-1 mb-1 tracking-widest">
                        <Info size={12} /> แหล่งข้อมูล
                      </div>
                      <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <ShoppingBag size={12} />
                        {item.source || 'ฐานข้อมูล AI'}
                      </div>
                    </div>
                  </div>

                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-bold bg-brand-50 px-3 py-1.5 rounded-lg transition-colors border border-brand-100">
                      <ExternalLink size={14} /> ดูรายละเอียดหน้าร้านค้าออนไลน์
                    </a>
                  )}
                </div>
                
                <div className="mt-6 lg:mt-0 flex flex-row lg:flex-col items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => handleAdd(item)}
                    className="flex-1 lg:flex-none px-6 py-4 bg-white text-brand-600 hover:bg-brand-600 hover:text-white rounded-2xl transition-all shadow-sm border-2 border-brand-100 flex flex-row lg:flex-col items-center justify-center gap-2 font-black group/btn active:scale-95"
                  >
                    <PlusCircle size={24} className="group-hover/btn:rotate-90 transition-transform" />
                    <span className="text-[10px] uppercase tracking-tighter">เพิ่มลงใบเสนอราคา</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="font-bold text-slate-500 text-lg">เริ่มต้นค้นหาอะไหล่</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto italic">ระบุชื่อสินค้าพร้อมยี่ห้อและรุ่นรถเพื่อให้ AI ค้นหาข้อมูลที่แม่นยำที่สุด</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default PartsLookup;

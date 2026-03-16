
import React, { useState, useMemo } from 'react';
import { MAINTENANCE_DATA, ServicePackage } from '../data/maintenanceData';
import { LineItem, ItemType } from '../types';
import { Settings, Check, ChevronRight, X, AlertCircle } from 'lucide-react';

interface ServicePackageSelectorProps {
  onSelectPackage: (items: LineItem[]) => void;
  onClose: () => void;
  initialMake?: string;
  initialModel?: string;
}

const ServicePackageSelector: React.FC<ServicePackageSelectorProps> = ({ 
  onSelectPackage, 
  onClose,
  initialMake = '',
  initialModel = ''
}) => {
  // Normalize initial values to match keys if possible, else default
  const defaultBrand = Object.keys(MAINTENANCE_DATA).find(b => b.toLowerCase() === initialMake.toLowerCase()) || '';
  
  const [selectedBrand, setSelectedBrand] = useState<string>(defaultBrand);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedKm, setSelectedKm] = useState<number | null>(null);

  const brands = Object.keys(MAINTENANCE_DATA);
  
  const models = useMemo(() => {
    if (!selectedBrand) return [];
    return Object.keys(MAINTENANCE_DATA[selectedBrand].models);
  }, [selectedBrand]);

  const packages = useMemo(() => {
    if (!selectedBrand || !selectedModel) return [];
    const modelData = MAINTENANCE_DATA[selectedBrand].models[selectedModel];
    return Object.keys(modelData.packages).map(Number).sort((a, b) => a - b);
  }, [selectedBrand, selectedModel]);

  const currentPackage = useMemo(() => {
    if (!selectedBrand || !selectedModel || !selectedKm) return null;
    return MAINTENANCE_DATA[selectedBrand].models[selectedModel].packages[selectedKm];
  }, [selectedBrand, selectedModel, selectedKm]);

  const handleApply = () => {
    if (!currentPackage) return;
    
    const newItems: LineItem[] = currentPackage.items.map((item, index) => ({
      id: `pkg-item-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      type: item.type || ItemType.OTHER,
      partNumber: item.partNumber
    }));

    onSelectPackage(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="text-brand-400" />
            เลือกแพ็กเกจเช็คระยะ (Service Packages)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">ยี่ห้อ (Brand)</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={selectedBrand}
                onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(''); setSelectedKm(null); }}
              >
                <option value="">-- Select Brand --</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">รุ่น (Model)</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={selectedModel}
                onChange={(e) => { setSelectedModel(e.target.value); setSelectedKm(null); }}
                disabled={!selectedBrand}
              >
                <option value="">-- Select Model --</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">ระยะทาง (Mileage)</label>
              <select 
                className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={selectedKm || ''}
                onChange={(e) => setSelectedKm(Number(e.target.value))}
                disabled={!selectedModel}
              >
                <option value="">-- Select Km --</option>
                {packages.map(km => <option key={km} value={km}>{km.toLocaleString()} km</option>)}
              </select>
            </div>
          </div>

          {/* Package Preview */}
          {currentPackage ? (
            <div className="border rounded-xl border-brand-100 bg-brand-50/30 overflow-hidden">
              <div className="p-4 bg-brand-100/50 border-b border-brand-100 flex justify-between items-center">
                 <h3 className="font-bold text-brand-800">{currentPackage.description}</h3>
                 <span className="text-xs bg-white px-2 py-1 rounded text-brand-600 font-bold shadow-sm">
                   {currentPackage.items.length} รายการ
                 </span>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {currentPackage.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-brand-200 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-slate-700 font-medium">{item.description}</span>
                          {item.partNumber && <span className="block text-[10px] text-slate-500">P/N: {item.partNumber}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-slate-600">฿{(item.unitPrice || 0).toLocaleString()}</span>
                        <span className="block text-[10px] text-slate-400">{item.type}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-4 pt-4 border-t border-brand-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">ประเมินราคาเบื้องต้น (Total Est.)</span>
                  <span className="text-xl font-bold text-brand-700">
                    ฿{currentPackage.items.reduce((sum, i) => sum + (i.unitPrice || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
               <AlertCircle className="mx-auto text-slate-300 mb-2" size={40} />
               <p className="text-slate-400 text-sm">กรุณาเลือกรุ่นรถและระยะทางเพื่อดูรายการตรวจเช็ค</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            ยกเลิก (Cancel)
          </button>
          <button 
            onClick={handleApply}
            disabled={!currentPackage}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 font-bold"
          >
            นำรายการไปใช้ (Use Package) <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicePackageSelector;

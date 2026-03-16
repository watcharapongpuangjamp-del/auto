
import React, { useState } from 'react';
import { Timer, Search, Plus, Trash2, CheckCircle } from 'lucide-react';
import { LaborStandard, LineItem, ItemType } from '../types';
import { DEFAULT_LABOR_STANDARDS } from '../constants';

interface LaborStandardsProps {
  onSelect?: (item: LineItem) => void;
  shopRate?: number;
}

const LaborStandards: React.FC<LaborStandardsProps> = ({ onSelect, shopRate = 400 }) => {
  const [standards, setStandards] = useState<LaborStandard[]>(DEFAULT_LABOR_STANDARDS);
  const [query, setQuery] = useState('');

  const filtered = standards.filter(s => 
    s.description.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase()) ||
    s.code.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (std: LaborStandard) => {
    if (onSelect) {
      onSelect({
        id: `labor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        description: std.description,
        type: ItemType.LABOR,
        category: std.category,
        quantity: 1,
        standardHours: std.standardHours,
        unitPrice: std.standardHours * shopRate,
        actualHours: 0
      });
    }
  };

  const getSkillColor = (level: string) => {
    switch(level) {
      case 'A': return 'bg-red-100 text-red-700 border-red-200';
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Timer className="text-brand-600" />
          มาตรฐานเวลาซ่อม (Labor Time Standards)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          ฐานข้อมูลเวลามาตรฐานสำหรับการซ่อม (FRT - Flat Rate Time)
        </p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="ค้นหารายการซ่อม, รหัส, หรือหมวดหมู่..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3">Code</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-center">Skill</th>
              <th className="px-6 py-3 text-center">Std. Hours</th>
              <th className="px-6 py-3 text-right">Est. Cost (@{shopRate})</th>
              {onSelect && <th className="px-6 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((std, idx) => (
              <tr key={idx} className="hover:bg-slate-50 group">
                <td className="px-6 py-3 font-mono text-slate-500">{std.code}</td>
                <td className="px-6 py-3 font-medium text-slate-700">
                  {std.description}
                  <span className="block text-xs text-slate-400 font-normal">{std.category}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSkillColor(std.skillLevel)}`}>
                    Level {std.skillLevel}
                  </span>
                </td>
                <td className="px-6 py-3 text-center font-bold text-slate-800">
                  {std.standardHours.toFixed(1)} h
                </td>
                <td className="px-6 py-3 text-right font-medium text-brand-600">
                  ฿{(std.standardHours * shopRate).toLocaleString()}
                </td>
                {onSelect && (
                  <td className="px-6 py-3 text-right">
                    <button 
                      onClick={() => handleSelect(std)}
                      className="px-3 py-1.5 bg-white border border-brand-200 text-brand-600 rounded-lg hover:bg-brand-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 ml-auto"
                    >
                      <Plus size={14} /> เลือก
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  ไม่พบรายการที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LaborStandards;

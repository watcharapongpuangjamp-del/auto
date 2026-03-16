
import React, { useMemo, useState, useEffect } from 'react';
import { Estimate, RepairStage, ItemType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend, AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, Car, AlertCircle, CheckCircle, 
  Clock, ArrowRight, DollarSign, Wallet, Activity, Percent, Printer, Plus,
  Users, Settings, Package, Sparkles, Loader2, Calendar
} from 'lucide-react';
import { DEFAULT_EMPLOYEES } from '../constants';
import { forecastRevenue } from '../services/geminiService';

interface DashboardProps {
  estimates: Estimate[];
  onCreateNew: () => void;
  onEdit: (estimate: Estimate) => void;
  onPrintJobCard?: (estimate: Estimate) => void;
  onNavigate?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ estimates, onCreateNew, onEdit, onPrintJobCard, onNavigate }) => {
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastData, setForecastData] = useState<{ month: string, forecastedRevenue: number, confidence: number, insights: string }[]>([]);

  const handleForecast = async () => {
    setIsForecasting(true);
    try {
      const data = await forecastRevenue(estimates);
      setForecastData(data);
    } catch (error) {
      console.error("Forecasting failed", error);
    } finally {
      setIsForecasting(false);
    }
  };
  const getTotal = (est: Estimate) => {
    const sub = est.items.reduce((sum, item) => {
      const discount = item.discount || 0;
      return sum + (item.quantity * item.unitPrice * (1 - discount / 100));
    }, 0);
    return sub * (1 + est.taxRate);
  };

  const getCost = (est: Estimate) => {
    return est.items.reduce((sum, item) => {
      // For parts: Cost Price
      // For Labor: If we tracked actual hours * mechanic cost, we'd use that.
      // Simplify: Use costPrice field if exists
      return sum + ((item.costPrice || 0) * item.quantity);
    }, 0);
  };

  const currentMonth = new Date().toISOString().slice(0, 7); 

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    const completedJobs = estimates.filter(e => e.status === 'COMPLETED' && (e.receiptDate || e.date).startsWith(currentMonth));
    
    const monthlyRevenue = completedJobs.reduce((sum, e) => sum + getTotal(e), 0);
    const monthlyCost = completedJobs.reduce((sum, e) => sum + getCost(e), 0);
    const grossProfit = monthlyRevenue - monthlyCost;
    const profitMargin = monthlyRevenue > 0 ? (grossProfit / monthlyRevenue) * 100 : 0;

    const activeJobs = estimates.filter(e => e.status === 'APPROVED');
    const readyJobs = activeJobs.filter(e => e.repairStage === RepairStage.READY).length;
    const waitingParts = activeJobs.filter(e => e.repairStage === RepairStage.WAITING_PARTS).length;

    return { monthlyRevenue, grossProfit, profitMargin, activeCount: activeJobs.length, readyJobs, waitingParts };
  }, [estimates, currentMonth]);

  // --- Efficiency Logic ---
  const efficiencyData = useMemo(() => {
    const mechanics = DEFAULT_EMPLOYEES.filter(e => e.role === 'MECHANIC');
    
    return mechanics.map(mech => {
      let soldHours = 0;
      let actualHours = 0;

      estimates.filter(e => e.status === 'COMPLETED' || e.status === 'APPROVED').forEach(est => {
        est.items.filter(i => i.type === ItemType.LABOR && i.mechanicId === mech.id).forEach(item => {
           soldHours += item.standardHours || 0;
           actualHours += item.actualHours || (item.standardHours || 0); // Fallback if not tracked
        });
      });

      const eff = actualHours > 0 ? (soldHours / actualHours) * 100 : 100;
      return {
        name: mech.name.split(' ')[0],
        efficiency: Math.round(eff),
        soldHours: soldHours.toFixed(1)
      };
    });
  }, [estimates]);

  // --- Revenue Chart Data ---
  const revenueData = useMemo(() => {
    const data: Record<string, {name: string, revenue: number, profit: number}> = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      data[key] = { 
        name: d.toLocaleDateString('th-TH', { month: 'short' }),
        revenue: 0,
        profit: 0 
      };
    }

    estimates.forEach(e => {
      if (e.status === 'COMPLETED') {
        const key = (e.receiptDate || e.date).slice(0, 7);
        if (data[key]) {
          data[key].revenue += getTotal(e);
          data[key].profit += (getTotal(e) - getCost(e));
        }
      }
    });

    return Object.values(data);
  }, [estimates]);

  const combinedChartData = useMemo(() => {
    const historical = revenueData.map(d => ({
      name: d.name,
      revenue: d.revenue,
      type: 'historical'
    }));

    const forecasted = forecastData.map(d => {
      const date = new Date(d.month + "-01");
      return {
        name: date.toLocaleDateString('th-TH', { month: 'short' }),
        revenue: d.forecastedRevenue,
        type: 'forecast'
      };
    });

    return [...historical, ...forecasted];
  }, [revenueData, forecastData]);

  const STAGE_COLORS = ['#94a3b8', '#3b82f6', '#f97316', '#a855f7', '#22c55e'];

  // --- Stage Data ---
  const stageData = useMemo(() => {
    const stages = {
      [RepairStage.QUEUED]: 0,
      [RepairStage.IN_PROGRESS]: 0,
      [RepairStage.WAITING_PARTS]: 0,
      [RepairStage.QC]: 0,
      [RepairStage.READY]: 0,
    };
    estimates.filter(e => e.status === 'APPROVED').forEach(e => {
      const stage = e.repairStage || RepairStage.QUEUED;
      if (stages[stage] !== undefined) stages[stage]++;
    });
    return Object.entries(stages).map(([key, value]) => ({ name: key, value })).filter(i => i.value > 0);
  }, [estimates]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={onCreateNew}
          className="flex flex-col items-center justify-center p-4 bg-brand-600 text-white rounded-xl shadow-sm hover:bg-brand-700 transition-all group"
        >
          <div className="p-2 bg-white/20 rounded-lg mb-2 group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold">สร้างใบเสนอราคา</span>
        </button>
        <button 
          onClick={() => onNavigate?.('inventory')}
          className="flex flex-col items-center justify-center p-4 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:text-brand-600 transition-all group"
        >
          <div className="p-2 bg-slate-100 rounded-lg mb-2 group-hover:scale-110 transition-transform">
            <Package size={20} />
          </div>
          <span className="text-xs font-bold">จัดการคลังสินค้า</span>
        </button>
        <button 
          onClick={() => onNavigate?.('employees')}
          className="flex flex-col items-center justify-center p-4 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:text-brand-600 transition-all group"
        >
          <div className="p-2 bg-slate-100 rounded-lg mb-2 group-hover:scale-110 transition-transform">
            <Users size={20} />
          </div>
          <span className="text-xs font-bold">จัดการพนักงาน</span>
        </button>
        <button 
          onClick={() => onNavigate?.('settings')}
          className="flex flex-col items-center justify-center p-4 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:text-brand-600 transition-all group"
        >
          <div className="p-2 bg-slate-100 rounded-lg mb-2 group-hover:scale-110 transition-transform">
            <Settings size={20} />
          </div>
          <span className="text-xs font-bold">ตั้งค่าระบบ</span>
        </button>
      </div>

      {/* Profit Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div id="stat-revenue" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">รายได้เดือนนี้ (Revenue)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">
              ฿{stats.monthlyRevenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </h3>
          </div>
          <div className="absolute right-4 top-4 p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
            <Wallet size={20} />
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">กำไรขั้นต้น (Gross Profit)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-green-600">
                ฿{stats.grossProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </h3>
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {stats.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="absolute right-4 top-4 p-3 bg-green-50 text-green-600 rounded-lg group-hover:scale-110 transition-transform">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">รถในศูนย์ (In Shop)</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.activeCount} <span className="text-sm font-normal text-slate-400">คัน</span></h3>
            <p className="text-xs text-orange-500 mt-1">รออะไหล่ {stats.waitingParts} คัน</p>
          </div>
          <div className="absolute right-4 top-4 p-3 bg-orange-50 text-orange-600 rounded-lg group-hover:scale-110 transition-transform">
            <Car size={20} />
          </div>
        </div>

        {/* Efficiency Avg */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">ประสิทธิภาพทีม (Avg Efficiency)</p>
             <h3 className="text-2xl font-bold text-purple-600 mt-1">
              {Math.round(efficiencyData.reduce((a, b) => a + b.efficiency, 0) / (efficiencyData.length || 1))}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">Target: 100%</p>
          </div>
          <div className="absolute right-4 top-4 p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-600" />
              ผลประกอบการ (Profit Analysis)
            </h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#22c55e" fillOpacity={1} fill="url(#colorProf)" strokeWidth={2} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Revenue Forecast */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={20} className="text-brand-600" />
                AI Revenue Forecast (พยากรณ์รายได้)
              </h3>
              <p className="text-xs text-slate-500">วิเคราะห์แนวโน้มรายได้ในอีก 3 เดือนข้างหน้าด้วย AI</p>
            </div>
            <button 
              onClick={handleForecast}
              disabled={isForecasting}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {isForecasting ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
              {isForecasting ? 'กำลังวิเคราะห์...' : 'เริ่มพยากรณ์'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`฿${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    data={combinedChartData.filter(d => d.type === 'historical')}
                    dataKey="revenue" 
                    name="Historical Revenue" 
                    stroke="#0ea5e9" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#0ea5e9", stroke: "none" }}
                  />
                  <Line 
                    type="monotone" 
                    data={combinedChartData.filter(d => d.type === 'forecast' || d === combinedChartData.filter(x => x.type === 'historical').pop())}
                    dataKey="revenue" 
                    name="Forecasted Revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3} 
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "#f59e0b", stroke: "none" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">AI Insights</h4>
              {forecastData.length > 0 ? (
                forecastData.map((d, i) => (
                  <div key={i} className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-brand-800">{new Date(d.month + "-01").toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                      <span className="text-[10px] bg-brand-200 text-brand-700 px-1.5 py-0.5 rounded font-bold">Confidence: {Math.round(d.confidence * 100)}%</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">฿{d.forecastedRevenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{d.insights}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <Calendar size={32} className="mb-2 opacity-20" />
                  <p className="text-sm italic">กดปุ่ม "เริ่มพยากรณ์" เพื่อดูแนวโน้มรายได้</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technician Efficiency */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">ประสิทธิภาพช่าง (Tech Efficiency)</h3>
          <p className="text-xs text-slate-400 mb-6">วัดจาก Hours Sold / Actual Hours</p>
          
          <div className="flex-1 space-y-4">
             {efficiencyData.map((tech, idx) => (
               <div key={idx} className="space-y-1">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium text-slate-700">{tech.name}</span>
                   <span className={`font-bold ${tech.efficiency >= 100 ? 'text-green-600' : tech.efficiency >= 80 ? 'text-blue-600' : 'text-orange-500'}`}>
                     {tech.efficiency}%
                   </span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2">
                   <div 
                     className={`h-2 rounded-full transition-all duration-500 ${tech.efficiency >= 100 ? 'bg-green-500' : tech.efficiency >= 80 ? 'bg-blue-500' : 'bg-orange-500'}`}
                     style={{ width: `${Math.min(tech.efficiency, 100)}%` }}
                   ></div>
                 </div>
                 <p className="text-[10px] text-slate-400 text-right">{tech.soldHours} sold hours</p>
               </div>
             ))}
             {efficiencyData.length === 0 && (
               <div className="text-center text-slate-400 py-8">ไม่มีข้อมูลช่าง</div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-slate-500" />
            รายการล่าสุด (Recent Jobs)
          </h3>
          <button 
            id="btn-create-new"
            onClick={onCreateNew}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            สร้างใหม่ <ArrowRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Job No.</th>
                <th className="px-6 py-4">ลูกค้า (Customer)</th>
                <th className="px-6 py-4">วันที่ (Date)</th>
                <th className="px-6 py-4">ยอดรวม (Total)</th>
                <th className="px-6 py-4 text-center">สถานะ (Status)</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estimates.slice(0, 10).map((est) => {
                const total = getTotal(est);
                
                let statusColor = 'bg-gray-100 text-gray-600';
                // Fix: Explicitly type statusLabel as string to avoid type error on later assignment (e.g. from RepairStage)
                let statusLabel: string = est.status;

                if (est.status === 'APPROVED') {
                    if (est.repairStage) {
                        const stageMap: Record<string, string> = {
                            [RepairStage.QUEUED]: 'bg-slate-100 text-slate-600',
                            [RepairStage.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
                            [RepairStage.WAITING_PARTS]: 'bg-orange-100 text-orange-700',
                            [RepairStage.QC]: 'bg-purple-100 text-purple-700',
                            [RepairStage.READY]: 'bg-teal-100 text-teal-700',
                        };
                        statusColor = stageMap[est.repairStage] || 'bg-blue-100 text-blue-700';
                        statusLabel = est.repairStage.replace('_', ' ');
                    } else {
                        statusColor = 'bg-blue-100 text-blue-700';
                    }
                } else if (est.status === 'COMPLETED') {
                    statusColor = 'bg-green-100 text-green-700';
                } else if (est.status === 'CANCELLED') {
                    statusColor = 'bg-red-100 text-red-700';
                }

                return (
                  <tr key={est.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {est.estimateNumber}
                      <div className="text-xs text-slate-400 font-normal">{est.vehicle.licensePlate}</div>
                    </td>
                    <td className="px-6 py-4">{est.customer?.name}</td>
                    <td className="px-6 py-4 text-slate-500">{est.date}</td>
                    <td className="px-6 py-4 font-medium">
                      {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {onPrintJobCard && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPrintJobCard(est); }}
                            className="text-slate-400 hover:text-slate-700 transition-colors"
                            title="Print Job Card"
                          >
                            <Printer size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => onEdit(est)}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

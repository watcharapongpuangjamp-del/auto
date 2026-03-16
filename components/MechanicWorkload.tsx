
import React from 'react';
import { Estimate, Employee, RepairStage, ItemType } from '../types';
import { Users, Clock, Wrench, CheckCircle, AlertCircle, Calendar, ArrowRight, User } from 'lucide-react';

interface MechanicWorkloadProps {
  estimates: Estimate[];
  employees: Employee[];
  onViewJob: (estimate: Estimate) => void;
}

const MechanicWorkload: React.FC<MechanicWorkloadProps> = ({ estimates, employees, onViewJob }) => {
  const mechanics = employees.filter(e => e.role === 'MECHANIC');
  const activeJobs = estimates.filter(e => e.status === 'APPROVED' && e.repairStage !== RepairStage.READY);

  const getMechanicStats = (mechanicId: string) => {
    const mechanicJobs = activeJobs.filter(job => 
      job.items.some(item => item.mechanicId === mechanicId)
    );

    let totalHours = 0;
    mechanicJobs.forEach(job => {
      job.items.filter(i => i.mechanicId === mechanicId && i.type === ItemType.LABOR).forEach(item => {
        totalHours += item.standardHours || 0;
      });
    });

    const stages = {
      [RepairStage.QUEUED]: mechanicJobs.filter(j => j.repairStage === RepairStage.QUEUED).length,
      [RepairStage.IN_PROGRESS]: mechanicJobs.filter(j => j.repairStage === RepairStage.IN_PROGRESS).length,
      [RepairStage.WAITING_PARTS]: mechanicJobs.filter(j => j.repairStage === RepairStage.WAITING_PARTS).length,
      [RepairStage.QC]: mechanicJobs.filter(j => j.repairStage === RepairStage.QC).length,
    };

    return { jobs: mechanicJobs, totalHours, stages };
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-brand-600" />
            ภาระงานช่าง (Mechanic Workload)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ติดตามงานที่ได้รับมอบหมายและชั่วโมงงานคงเหลือของช่างแต่ละคน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mechanics.map(mechanic => {
          const stats = getMechanicStats(mechanic.id);
          const workloadColor = stats.totalHours > 8 ? 'text-red-600' : stats.totalHours > 6 ? 'text-orange-500' : 'text-green-600';
          const workloadBg = stats.totalHours > 8 ? 'bg-red-50' : stats.totalHours > 6 ? 'bg-orange-50' : 'bg-green-50';

          return (
            <div key={mechanic.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold">
                    {mechanic.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{mechanic.name}</h3>
                    <p className="text-xs text-slate-500">{mechanic.position}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${workloadBg} ${workloadColor}`}>
                  <Clock size={12} />
                  {stats.totalHours.toFixed(1)} ชม.
                </div>
              </div>

              <div className="p-4 grid grid-cols-4 gap-2 border-b border-slate-50">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">รอคิว</p>
                  <p className="text-lg font-bold text-slate-700">{stats.stages[RepairStage.QUEUED]}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">กำลังทำ</p>
                  <p className="text-lg font-bold text-blue-600">{stats.stages[RepairStage.IN_PROGRESS]}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">รออะไหล่</p>
                  <p className="text-lg font-bold text-orange-500">{stats.stages[RepairStage.WAITING_PARTS]}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">ตรวจงาน</p>
                  <p className="text-lg font-bold text-purple-600">{stats.stages[RepairStage.QC]}</p>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายการงาน (Assigned Jobs)</h4>
                {stats.jobs.length > 0 ? (
                  stats.jobs.map(job => (
                    <div 
                      key={job.id} 
                      onClick={() => onViewJob(job)}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-brand-300 hover:bg-white transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-700">{job.vehicle.licensePlate}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          job.repairStage === RepairStage.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          job.repairStage === RepairStage.WAITING_PARTS ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          {job.repairStage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">{job.customer?.name}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar size={10} />
                          {job.date}
                        </div>
                        <ArrowRight size={12} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-300 text-sm italic">
                    ไม่มีงานที่ได้รับมอบหมาย
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MechanicWorkload;

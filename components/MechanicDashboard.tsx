import React from 'react';
import { Estimate, Employee, RepairStage, ItemType } from '../types';
import { Clock, Wrench, CheckCircle, AlertCircle, TrendingUp, Car } from 'lucide-react';

interface MechanicDashboardProps {
  estimates: Estimate[];
  currentUser: Employee;
}

const MechanicDashboard: React.FC<MechanicDashboardProps> = ({ estimates, currentUser }) => {
  // Filter jobs where the current mechanic is assigned to at least one labor item
  const myAssignedJobs = estimates.filter(est => 
    est.items.some(item => item.type === ItemType.LABOR && item.mechanicId === currentUser.id)
  );

  // Active jobs (not completed or cancelled)
  const activeJobs = myAssignedJobs.filter(est => 
    est.status === 'APPROVED' || est.status === 'SENT' || est.status === 'DRAFT'
  );

  // Calculate total estimated hours for assigned labor items in active jobs
  const totalEstimatedHours = activeJobs.reduce((total, est) => {
    const jobHours = est.items
      .filter(item => item.type === ItemType.LABOR && item.mechanicId === currentUser.id)
      .reduce((sum, item) => sum + (item.standardHours || 0), 0);
    return total + jobHours;
  }, 0);

  // Calculate progress stats
  const stageStats = {
    [RepairStage.QUEUED]: activeJobs.filter(j => j.repairStage === RepairStage.QUEUED).length,
    [RepairStage.IN_PROGRESS]: activeJobs.filter(j => j.repairStage === RepairStage.IN_PROGRESS).length,
    [RepairStage.WAITING_PARTS]: activeJobs.filter(j => j.repairStage === RepairStage.WAITING_PARTS).length,
    [RepairStage.QC]: activeJobs.filter(j => j.repairStage === RepairStage.QC).length,
    [RepairStage.READY]: activeJobs.filter(j => j.repairStage === RepairStage.READY).length,
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case RepairStage.QUEUED: return 'รอคิวซ่อม (Queued)';
      case RepairStage.IN_PROGRESS: return 'กำลังซ่อม (In Progress)';
      case RepairStage.WAITING_PARTS: return 'รออะไหล่ (Waiting Parts)';
      case RepairStage.QC: return 'รอตรวจสอบ (QC)';
      case RepairStage.READY: return 'พร้อมส่งมอบ (Ready)';
      default: return stage;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mechanic Dashboard</h1>
          <p className="text-slate-500">Welcome back, {currentUser.name}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Date</p>
          <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('th-TH')}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Wrench size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold text-slate-800">{activeJobs.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Est. Hours</p>
            <p className="text-2xl font-bold text-slate-800">{totalEstimatedHours.toFixed(1)} h</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-800">
              {myAssignedJobs.length > 0 
                ? Math.round((myAssignedJobs.filter(j => j.status === 'COMPLETED').length / myAssignedJobs.length) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-500" /> Current Progress
          </h3>
          <div className="space-y-5">
            {Object.entries(stageStats).map(([stage, count]) => (
              <div key={stage} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 font-medium">{getStageLabel(stage)}</span>
                  <span className="font-bold text-slate-800">{count} jobs</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      stage === RepairStage.IN_PROGRESS ? 'bg-blue-500' :
                      stage === RepairStage.READY ? 'bg-green-500' :
                      stage === RepairStage.WAITING_PARTS ? 'bg-orange-500' :
                      stage === RepairStage.QC ? 'bg-purple-500' :
                      'bg-slate-400'
                    }`}
                    style={{ width: `${activeJobs.length > 0 ? (count / activeJobs.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle size={18} className="text-brand-500" /> Recent Assigned Jobs
          </h3>
          <div className="space-y-3">
            {activeJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 text-slate-400">
                    <Car size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{job.vehicle.licensePlate}</p>
                    <p className="text-xs text-slate-500">{job.vehicle.make} {job.vehicle.model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    job.repairStage === RepairStage.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                    job.repairStage === RepairStage.READY ? 'bg-green-100 text-green-700' :
                    job.repairStage === RepairStage.WAITING_PARTS ? 'bg-orange-100 text-orange-700' :
                    job.repairStage === RepairStage.QC ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {job.repairStage || 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(job.date).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
            ))}
            {activeJobs.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No active jobs assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;

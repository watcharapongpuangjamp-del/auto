
import React, { useState } from 'react';
import { Estimate, RepairStage, ItemType } from '../types';
import { Car, Clock, AlertCircle, CheckCircle, Wrench, Package, ClipboardList, ArrowRight, Box, Printer, GripVertical, BrainCircuit, Sparkles } from 'lucide-react';

interface JobTrackingProps {
  estimates: Estimate[];
  onUpdateStage: (estimate: Estimate, newStage: RepairStage) => void;
  onViewJob: (estimate: Estimate) => void;
  onPrintJobCard?: (estimate: Estimate) => void;
}

const STAGES = [
  { id: RepairStage.QUEUED, label: 'รอคิวซ่อม (Queued)', color: 'bg-slate-100 border-slate-200 text-slate-600', icon: ClipboardList },
  { id: RepairStage.IN_PROGRESS, label: 'กำลังซ่อม (In Progress)', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Wrench },
  { id: RepairStage.WAITING_PARTS, label: 'รออะไหล่ (Waiting Parts)', color: 'bg-orange-50 border-orange-200 text-orange-700', icon: Package },
  { id: RepairStage.QC, label: 'ตรวจสอบ (QC / Test)', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: AlertCircle },
  { id: RepairStage.READY, label: 'รถเสร็จ (Ready)', color: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle },
];

const JobTracking: React.FC<JobTrackingProps> = ({ estimates, onUpdateStage, onViewJob, onPrintJobCard }) => {
  const [draggedJob, setDraggedJob] = useState<Estimate | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'licensePlate' | 'customerName' | 'date'>('date');

  const activeJobs = estimates.filter(e => e.status === 'APPROVED');

  const getSortedJobs = (jobs: Estimate[]) => {
    return [...jobs].sort((a, b) => {
      switch (sortBy) {
        case 'licensePlate':
          return a.vehicle.licensePlate.localeCompare(b.vehicle.licensePlate);
        case 'customerName':
          return (a.customer?.name || '').localeCompare(b.customer?.name || '');
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });
  };

  const getStageIcon = (stageId: string) => {
    const stage = STAGES.find(s => s.id === stageId);
    const Icon = stage?.icon || ClipboardList;
    return <Icon size={16} />;
  };

  const handleMove = (job: Estimate, direction: 'next' | 'prev') => {
    const currentIndex = STAGES.findIndex(s => s.id === (job.repairStage || RepairStage.QUEUED));
    if (currentIndex === -1) return;

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < STAGES.length) {
      onUpdateStage(job, STAGES[newIndex].id as RepairStage);
    }
  };

  const handleDragStart = (e: React.DragEvent, job: Estimate) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', job.id);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault(); 
    if (draggedJob && draggedJob.repairStage !== stageId) {
       if (dragOverStage !== stageId) {
         setDragOverStage(stageId);
       }
       e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedJob && draggedJob.repairStage !== stageId) {
      onUpdateStage(draggedJob, stageId as RepairStage);
    }
    setDraggedJob(null);
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="p-6 pb-2 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Car className="text-brand-600" />
            ติดตามสถานะงานซ่อม (Job Tracking)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            กระดานติดตามสถานะรถที่กำลังซ่อม (Active Jobs Kanban Board) - ลากและวางเพื่อเปลี่ยนสถานะ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">เรียงตาม:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="date">วันที่</option>
            <option value="licensePlate">เลขทะเบียน</option>
            <option value="customerName">ชื่อลูกค้า</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {STAGES.map((stage) => {
            const jobsInStage = getSortedJobs(activeJobs.filter(job => (job.repairStage || RepairStage.QUEUED) === stage.id));
            const isDragOver = dragOverStage === stage.id;
            
            return (
              <div 
                key={stage.id} 
                className={`flex-1 flex flex-col min-w-[280px] max-w-[350px] rounded-xl shadow-sm border h-full transition-colors duration-200
                  ${isDragOver ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-200' : 'bg-white border-slate-200'}
                `}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className={`p-3 border-b border-slate-100 flex items-center justify-between font-semibold text-sm rounded-t-xl ${stage.color.split(' ')[2]} ${isDragOver ? 'bg-brand-100' : ''}`}>
                  <div className="flex items-center gap-2">
                    {getStageIcon(stage.id)}
                    {stage.label}
                  </div>
                  <span className="bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs text-slate-600">
                    {jobsInStage.length}
                  </span>
                </div>

                <div className={`p-3 flex-1 overflow-y-auto space-y-3 ${isDragOver ? 'bg-brand-50' : 'bg-slate-50/50'}`}>
                  {jobsInStage.map(job => {
                    const parts = job.items.filter(i => i.type === ItemType.PART);
                    const hasDiagnosis = !!job.diagnosis?.aiAnalysisResult;
                    
                    return (
                      <div 
                        key={job.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, job)}
                        onDragEnd={handleDragEnd}
                        className={`
                          bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative
                          ${draggedJob?.id === job.id ? 'opacity-50 border-brand-300 ring-2 ring-brand-100 rotate-2' : 'border-slate-200'}
                        `}
                      >
                        <div onClick={() => onViewJob(job)}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical size={14} className="text-slate-300 cursor-grab" />
                              <span className="font-bold text-slate-800 text-lg">{job.vehicle.licensePlate}</span>
                            </div>
                            <button 
                               onClick={(e) => { e.stopPropagation(); onPrintJobCard && onPrintJobCard(job); }}
                               className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 rounded hover:bg-blue-50 transition-colors"
                               title="Print Job Card"
                            >
                               <Printer size={14} />
                            </button>
                          </div>
                          
                          <div className="text-sm text-slate-600 mb-1 line-clamp-1 pl-6">
                            {job.customer?.name}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 pl-6">
                            <Clock size={12} />
                            <span>In: {job.date}</span>
                          </div>

                          {/* AI Diagnosis Section */}
                          {hasDiagnosis && (
                            <div className="pl-6 mb-3">
                              <div className="text-[10px] font-bold text-purple-600 uppercase mb-1 flex items-center gap-1">
                                <BrainCircuit size={10} /> AI Analysis Findings
                              </div>
                              <div className="bg-purple-50/50 p-2 rounded border border-purple-100/50">
                                <p className="text-[10px] text-slate-700 line-clamp-2 leading-tight mb-1">
                                  {job.diagnosis?.aiAnalysisResult}
                                </p>
                                {job.diagnosis?.aiSuggestedItems && job.diagnosis.aiSuggestedItems.length > 0 && (
                                  <div className="mt-1.5 pt-1.5 border-t border-purple-100">
                                    <div className="text-[9px] font-bold text-purple-500 mb-1 flex items-center gap-1">
                                      <Sparkles size={8} /> Suggested Items:
                                    </div>
                                    <ul className="space-y-1">
                                      {job.diagnosis.aiSuggestedItems.slice(0, 2).map((sug, idx) => (
                                        <li key={idx} className="text-[9px] text-slate-600 flex justify-between items-center gap-2">
                                          <span className="truncate">• {sug.description}</span>
                                          <span className="font-bold text-slate-800 flex-shrink-0">฿{sug.estimatedPrice.toLocaleString()}</span>
                                        </li>
                                      ))}
                                      {job.diagnosis.aiSuggestedItems.length > 2 && (
                                        <li className="text-[8px] text-slate-400 italic pl-2">
                                          + {job.diagnosis.aiSuggestedItems.length - 2} more suggestions...
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Parts List Section */}
                          <div className="pl-6 mb-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                              <Box size={10} /> อะไหล่ที่เบิก (Stock Issued)
                            </div>
                            {parts.length > 0 ? (
                              <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                                {parts.map((part) => (
                                  <div key={part.id} className="text-[10px] bg-slate-50 p-1 rounded border border-slate-100 flex justify-between items-start">
                                    <div className="flex-1 pr-2">
                                      <p className="font-bold text-slate-700 leading-tight">{part.description}</p>
                                      {part.partNumber && <p className="text-[8px] text-slate-400 font-mono">P/N: {part.partNumber}</p>}
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-1 rounded font-bold">x{part.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-400 italic">ไม่มีรายการเบิกอะไหล่</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 pl-6">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMove(job, 'prev'); }}
                            disabled={stage.id === RepairStage.QUEUED}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30"
                            title="Move Back"
                          >
                            <ArrowRight className="rotate-180" size={14} />
                          </button>
                          
                          <span className="text-[10px] text-slate-300 font-mono">{job.estimateNumber}</span>

                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMove(job, 'next'); }}
                            disabled={stage.id === RepairStage.READY}
                            className="p-1 hover:bg-brand-50 hover:text-brand-600 rounded text-slate-400 disabled:opacity-30"
                            title="Move Next"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {jobsInStage.length === 0 && (
                    <div className="text-center py-8 text-slate-300 text-xs italic border-2 border-dashed border-slate-200 rounded-lg">
                      ลากงานมาวางที่นี่ (Drop jobs here)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JobTracking;

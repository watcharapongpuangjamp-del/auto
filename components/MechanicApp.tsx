import React, { useState } from 'react';
import { Estimate, RepairStage, Employee, TimelineEvent } from '../types';
import { Play, Pause, CheckCircle, Camera, Clock, Wrench, AlertCircle, ChevronLeft, Image as ImageIcon } from 'lucide-react';

interface MechanicAppProps {
  estimates: Estimate[];
  currentUser: Employee;
  onSaveEstimate: (est: Estimate, silent?: boolean) => void;
}

const MechanicApp: React.FC<MechanicAppProps> = ({ estimates, currentUser, onSaveEstimate }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Filter jobs that are active and not completely done
  const activeJobs = estimates.filter(e => 
    e.status === 'APPROVED' || 
    (e.status === 'DRAFT' && e.repairStage && e.repairStage !== RepairStage.READY && e.repairStage !== RepairStage.RECEPTION)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const selectedJob = estimates.find(e => e.id === selectedJobId);

  const handleUpdateStage = (job: Estimate, newStage: RepairStage, actionText: string) => {
    const newTimelineEvent: TimelineEvent = {
      date: new Date().toISOString(),
      action: actionText,
      note: `โดยช่าง: ${currentUser.name}`
    };
    
    const updatedJob: Estimate = {
      ...job,
      repairStage: newStage,
      timeline: [...(job.timeline || []), newTimelineEvent]
    };
    
    onSaveEstimate(updatedJob, true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, job: Estimate) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for demo
      alert('ขนาดไฟล์ใหญ่เกินไป กรุณาใช้รูปภาพขนาดไม่เกิน 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const updatedJob: Estimate = {
        ...job,
        repairPhotos: [...(job.repairPhotos || []), base64String],
        timeline: [...(job.timeline || []), {
          date: new Date().toISOString(),
          action: 'อัปโหลดรูปภาพหน้างาน',
          note: `โดยช่าง: ${currentUser.name}`
        }]
      };
      onSaveEstimate(updatedJob, true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const getStageColor = (stage?: RepairStage) => {
    switch (stage) {
      case RepairStage.QUEUED: return 'bg-slate-100 text-slate-700';
      case RepairStage.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case RepairStage.WAITING_PARTS: return 'bg-orange-100 text-orange-700';
      case RepairStage.QC: return 'bg-purple-100 text-purple-700';
      case RepairStage.READY: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStageLabel = (stage?: RepairStage) => {
    switch (stage) {
      case RepairStage.QUEUED: return 'รอคิวซ่อม';
      case RepairStage.IN_PROGRESS: return 'กำลังซ่อม';
      case RepairStage.WAITING_PARTS: return 'รออะไหล่';
      case RepairStage.QC: return 'รอตรวจสอบ (QC)';
      case RepairStage.READY: return 'พร้อมส่งมอบ';
      default: return stage || 'รอดำเนินการ';
    }
  };

  if (selectedJob) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Mobile Header */}
        <div className="bg-white px-4 py-3 border-b flex items-center justify-between shadow-sm sticky top-0 z-10">
          <button 
            onClick={() => setSelectedJobId(null)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center flex-1">
            <h2 className="font-bold text-slate-800 text-lg">{selectedJob.vehicle.licensePlate}</h2>
            <p className="text-xs text-slate-500">{selectedJob.vehicle.make} {selectedJob.vehicle.model}</p>
          </div>
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {/* Status Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-slate-500">สถานะปัจจุบัน</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStageColor(selectedJob.repairStage)}`}>
                {getStageLabel(selectedJob.repairStage)}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleUpdateStage(selectedJob, RepairStage.IN_PROGRESS, 'เริ่มงานซ่อม')}
                disabled={selectedJob.repairStage === RepairStage.IN_PROGRESS}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                  selectedJob.repairStage === RepairStage.IN_PROGRESS 
                    ? 'bg-blue-50 border-blue-200 text-blue-600' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Play size={24} className="mb-1" />
                <span className="text-xs font-medium">เริ่มงาน</span>
              </button>
              
              <button 
                onClick={() => handleUpdateStage(selectedJob, RepairStage.WAITING_PARTS, 'พักงาน/รออะไหล่')}
                disabled={selectedJob.repairStage === RepairStage.WAITING_PARTS}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                  selectedJob.repairStage === RepairStage.WAITING_PARTS 
                    ? 'bg-orange-50 border-orange-200 text-orange-600' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <Pause size={24} className="mb-1" />
                <span className="text-xs font-medium">พักงาน</span>
              </button>

              <button 
                onClick={() => handleUpdateStage(selectedJob, RepairStage.QC, 'ซ่อมเสร็จ/ส่ง QC')}
                disabled={selectedJob.repairStage === RepairStage.QC || selectedJob.repairStage === RepairStage.READY}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                  selectedJob.repairStage === RepairStage.QC || selectedJob.repairStage === RepairStage.READY
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-600'
                }`}
              >
                <CheckCircle size={24} className="mb-1" />
                <span className="text-xs font-medium">เสร็จงาน</span>
              </button>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-slate-400" /> อาการที่แจ้ง
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
              {selectedJob.diagnosis?.symptoms || selectedJob.notes || 'ไม่มีการระบุอาการ'}
            </p>
          </div>

          {/* Tasks */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Wrench size={18} className="text-slate-400" /> รายการซ่อม/อะไหล่
            </h3>
            <div className="space-y-2">
              {selectedJob.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.description}</p>
                    <p className="text-xs text-slate-500 mt-1">ประเภท: {item.type === 'PART' ? 'อะไหล่' : item.type === 'LABOR' ? 'ค่าแรง' : 'อื่นๆ'}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-700">x{item.quantity}</span>
                </div>
              ))}
              {selectedJob.items.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">ไม่มีรายการซ่อม</p>
              )}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-slate-400" /> รูปภาพหน้างาน
              </h3>
              <label className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-blue-100 flex items-center gap-1">
                <Camera size={14} /> เพิ่มรูป
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={(e) => handlePhotoUpload(e, selectedJob)}
                />
              </label>
            </div>
            
            {selectedJob.repairPhotos && selectedJob.repairPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedJob.repairPhotos.map((photo, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={photo} alt={`Repair photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Camera size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">ยังไม่มีรูปภาพ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-white px-4 py-4 border-b shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-800">งานซ่อมของฉัน</h1>
        <p className="text-sm text-slate-500">ช่าง: {currentUser.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {activeJobs.length > 0 ? (
          activeJobs.map(job => (
            <div 
              key={job.id} 
              onClick={() => setSelectedJobId(job.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{job.vehicle.licensePlate}</h3>
                  <p className="text-sm text-slate-500">{job.vehicle.make} {job.vehicle.model}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStageColor(job.repairStage)}`}>
                  {getStageLabel(job.repairStage)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg">
                <AlertCircle size={14} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{job.diagnosis?.symptoms || job.notes || 'ไม่มีการระบุอาการ'}</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={14} />
                  <span>รับรถ: {new Date(job.date).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-medium text-xs">
                  ดูรายละเอียด <ChevronLeft size={14} className="rotate-180" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">ไม่มีงานค้าง</h3>
            <p className="text-sm text-slate-500">คุณทำผลงานได้ยอดเยี่ยมมาก!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicApp;

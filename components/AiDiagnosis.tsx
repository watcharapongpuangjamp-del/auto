
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowRight, BrainCircuit, FileText, Usb, Cable, CheckCircle, Activity, Gauge, Zap, AlertTriangle, Info, FastForward } from 'lucide-react';
import { diagnoseVehicleIssue } from '../services/geminiService';
import { obdService } from '../services/obdService';
import { AiDiagnosisResult, Estimate, DiagnosisData, RepairStage, HealthCheckResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AiDiagnosisProps {
  onSaveDiagnosis: (jobId: string, data: DiagnosisData) => void;
  openJobs: Estimate[]; 
  initialJobId?: string;
  onNavigateToEstimate: (jobId: string) => void;
}

const AiDiagnosis: React.FC<AiDiagnosisProps> = ({ onSaveDiagnosis, openJobs, initialJobId, onNavigateToEstimate }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');
  const [vehicle, setVehicle] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [obdCodes, setObdCodes] = useState<string[]>([]);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  
  const [result, setResult] = useState<AiDiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanningObd, setScanningObd] = useState(false);
  const [quickScanning, setQuickScanning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'BASIC' | 'HEALTH_CHECK'>('BASIC');

  // Sync with prop
  useEffect(() => {
    if (initialJobId) setSelectedJobId(initialJobId);
  }, [initialJobId]);

  // When a job is selected, load its existing diagnosis data if available
  useEffect(() => {
    if (selectedJobId) {
      const job = openJobs.find(j => j.id === selectedJobId);
      if (job) {
        setVehicle(`${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.licensePlate})`);
        
        // Load existing data if available
        if (job.diagnosis) {
            setSymptoms(job.diagnosis.symptoms);
            setObdCodes(job.diagnosis.obdCodes || []);
            setHealthResult(job.diagnosis.healthCheck || null);
            
            if (job.diagnosis.aiAnalysisResult) {
                setResult({
                    rootCause: "Loaded from Record", 
                    analysis: job.diagnosis.aiAnalysisResult,
                    suggestedItems: job.diagnosis.aiSuggestedItems || []
                });
            }
        } else {
            // Pre-fill from reception notes
            setSymptoms(job.vehicle.checkInNotes || job.notes || '');
            setResult(null);
            setObdCodes([]);
            setHealthResult(null);
        }
        setIsSaved(!!job.diagnosis);
      }
    } else {
      setVehicle('');
      setSymptoms('');
      setResult(null);
      setObdCodes([]);
      setHealthResult(null);
      setIsSaved(false);
    }
  }, [selectedJobId, openJobs]);

  const handleDiagnose = async () => {
    if (!vehicle || !symptoms) return;

    setLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      // Build a comprehensive prompt
      let fullSymptoms = symptoms;
      
      if (obdCodes.length > 0) {
          fullSymptoms += `\n[OBD2 Codes Detected]: ${obdCodes.join(', ')}`;
      }

      if (healthResult) {
          fullSymptoms += `\n[Health Check Report]: Score ${healthResult.overallScore}/100.`;
          fullSymptoms += `\nIssues Found: ${healthResult.issues.map(i => `${i.title} (${i.severity})`).join(', ')}`;
          fullSymptoms += `\nLive Data Snapshot: RPM=${healthResult.snapshotData.rpm}, Temp=${healthResult.snapshotData.coolantTemp}C, LTFT=${healthResult.snapshotData.ltft}%, Voltage=${healthResult.snapshotData.voltage}V`;
      }

      const diagnosis = await diagnoseVehicleIssue(fullSymptoms, vehicle);
      setResult(diagnosis);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleScanObd = async () => {
    setScanningObd(true);
    try {
      const scanResult = await obdService.connectAndScan();
      if (scanResult.success) {
        if (scanResult.codes.length > 0) {
          setObdCodes(prev => Array.from(new Set([...prev, ...scanResult.codes])));
          alert(`พบ DTC: ${scanResult.codes.join(', ')}`);
        } else {
          alert('ไม่พบ Code ปัญหา (No DTC)');
        }
      } else {
        alert(`Connection Failed: ${scanResult.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Cannot connect device.');
    } finally {
      setScanningObd(false);
    }
  };

  const handleQuickScan = async () => {
    setQuickScanning(true);
    try {
      const scanResult = await obdService.quickScan();
      if (scanResult.success) {
        if (scanResult.codes.length > 0) {
          setObdCodes(prev => Array.from(new Set([...prev, ...scanResult.codes])));
          alert(`Quick Scan found DTC: ${scanResult.codes.join(', ')}`);
        } else {
          alert('Quick Scan: No DTCs found.');
        }
      } else {
        alert(`Quick Scan Failed: ${scanResult.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Cannot connect device for quick scan.');
    } finally {
      setQuickScanning(false);
    }
  };

  const handleHealthCheck = async () => {
      setScanningObd(true);
      try {
          const report = await obdService.performHealthCheck();
          setHealthResult(report);
          // Auto-append findings to symptoms
          const summary = `Health Check: ${report.overallScore}/100. Issues: ${report.issues.map(i => i.title).join(', ')}.`;
          if (!symptoms.includes("Health Check")) {
              setSymptoms(prev => prev ? `${prev}\n\n${summary}` : summary);
          }
      } catch (e) {
          console.error(e);
          alert("Health Check Failed");
      } finally {
          setScanningObd(false);
      }
  };

  const handleSaveToJob = () => {
    if (!selectedJobId || !result) {
        alert("กรุณาเลือกใบงานและทำการวิเคราะห์ก่อนบันทึก");
        return;
    }

    const diagnosisData: DiagnosisData = {
        symptoms: symptoms,
        obdCodes: obdCodes,
        ...(healthResult ? { healthCheck: healthResult } : {}),
        ...(result.analysis ? { aiAnalysisResult: result.analysis } : {}),
        ...(result.suggestedItems ? { aiSuggestedItems: result.suggestedItems } : {}),
        performedAt: new Date().toISOString()
    };

    onSaveDiagnosis(selectedJobId, diagnosisData);
    setIsSaved(true);
    if(confirm("บันทึกผลวิเคราะห์เรียบร้อย! ต้องการไปหน้าทำใบเสนอราคาเลยหรือไม่?")) {
        onNavigateToEstimate(selectedJobId);
    }
  };

  const renderHealthGauge = (score: number) => {
      const data = [{ name: 'Score', value: score }, { name: 'Rest', value: 100 - score }];
      const color = score > 80 ? '#22c55e' : score > 50 ? '#eab308' : '#ef4444';
      
      return (
        <div className="relative w-32 h-32 mx-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={25} outerRadius={40} startAngle={90} endAngle={-270} dataKey="value">
                        <Cell key="score" fill={color} />
                        <Cell key="rest" fill="#f1f5f9" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold" style={{ color }}>{score}</span>
                <span className="text-[10px] text-slate-400">SCORE</span>
            </div>
        </div>
      );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" />
            AI วิเคราะห์อาการ (Smart Diagnosis)
            </h2>
            <p className="text-sm text-slate-500 mt-1">
            ผสานพลัง OBD2 Health Check และ Gemini AI เพื่อการวินิจฉัยแม่นยำ
            </p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            <button 
                onClick={() => setActiveTab('BASIC')}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'BASIC' ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                AI Analysis
            </button>
            <button 
                onClick={() => setActiveTab('HEALTH_CHECK')}
                className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'HEALTH_CHECK' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Health Check (OBD)
            </button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto grid lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: Controls & Input */}
        <div className="space-y-6">
          
          {/* Job Selector */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
              <FileText size={16} /> เลือกใบงาน (Select Job)
            </label>
            <select 
              className="w-full p-2.5 rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              <option value="">-- กรุณาเลือกใบงาน (Select Job) --</option>
              {openJobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.estimateNumber} - {job.vehicle.licensePlate} ({job.repairStage || job.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">ข้อมูลรถ (Vehicle)</label>
            <input
              type="text"
              readOnly={!!selectedJobId}
              placeholder="Toyota Vios..."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-slate-50"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            />
          </div>
          
          {activeTab === 'HEALTH_CHECK' ? (
             <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg">
                 <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                     <Activity className="text-green-400" />
                     Vehicle Health Check
                 </h3>
                 
                 {!healthResult ? (
                     <div className="text-center py-8">
                         <p className="text-slate-400 mb-6 text-sm">เชื่อมต่อ OBD2 เพื่อตรวจสุขภาพรถยนต์แบบเจาะลึก (Engine, Fuel, Electrical)</p>
                         <button 
                            onClick={handleHealthCheck}
                            disabled={scanningObd}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                         >
                             {scanningObd ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                             Start Deep Scan
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-6">
                         <div className="flex justify-between items-center">
                             {renderHealthGauge(healthResult.overallScore)}
                             <div className="space-y-2 flex-1 pl-6">
                                 <div className="flex justify-between text-xs mb-1"><span>Engine</span><span>{healthResult.systemScores.engine}%</span></div>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{width: `${healthResult.systemScores.engine}%`}}></div></div>
                                 
                                 <div className="flex justify-between text-xs mb-1"><span>Fuel System</span><span>{healthResult.systemScores.fuel}%</span></div>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{width: `${healthResult.systemScores.fuel}%`}}></div></div>
                                 
                                 <div className="flex justify-between text-xs mb-1"><span>Electrical</span><span>{healthResult.systemScores.electrical}%</span></div>
                                 <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{width: `${healthResult.systemScores.electrical}%`}}></div></div>
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-2 text-xs bg-slate-700 p-3 rounded-lg border border-slate-600">
                             <div className="flex justify-between"><span>RPM:</span> <span className="font-mono text-green-400">{healthResult.snapshotData.rpm}</span></div>
                             <div className="flex justify-between"><span>Temp:</span> <span className={`font-mono ${healthResult.snapshotData.coolantTemp > 96 ? 'text-red-400' : 'text-green-400'}`}>{healthResult.snapshotData.coolantTemp}°C</span></div>
                             <div className="flex justify-between"><span>Volt:</span> <span className={`font-mono ${healthResult.snapshotData.voltage < 13.2 ? 'text-yellow-400' : 'text-green-400'}`}>{healthResult.snapshotData.voltage}V</span></div>
                             <div className="flex justify-between"><span>LTFT:</span> <span className={`font-mono ${Math.abs(healthResult.snapshotData.ltft) > 10 ? 'text-red-400' : 'text-green-400'}`}>{healthResult.snapshotData.ltft}%</span></div>
                         </div>

                         <button 
                            onClick={handleHealthCheck}
                            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm flex items-center justify-center gap-2"
                         >
                             <Activity size={16} /> Re-Scan
                         </button>
                     </div>
                 )}
             </div>
          ) : (
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">อาการ / OBD2</label>
                <div className="flex gap-2">
                    <button 
                        onClick={handleQuickScan}
                        disabled={quickScanning || scanningObd}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-slate-200 transition-colors border border-slate-200"
                    >
                        {quickScanning ? <Loader2 size={12} className="animate-spin" /> : <FastForward size={12} />}
                        Quick Scan
                    </button>
                    <button 
                        onClick={handleScanObd}
                        disabled={scanningObd || quickScanning}
                        className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-slate-700 transition-colors"
                    >
                        {scanningObd ? <Loader2 size={12} className="animate-spin" /> : <Cable size={12} />}
                        Read DTC Only
                    </button>
                </div>
                </div>
                
                {obdCodes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {obdCodes.map(code => (
                    <span key={code} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1">
                        <Usb size={10} /> {code}
                    </span>
                    ))}
                </div>
                )}

                <textarea
                rows={5}
                placeholder="อธิบายอาการ..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                />
            </div>
          )}

          {activeTab === 'BASIC' && (
            <button
                onClick={handleDiagnose}
                disabled={loading || !vehicle || !symptoms}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold flex justify-center items-center gap-2 shadow-sm"
            >
                {loading ? (
                <>
                    <Loader2 className="animate-spin" />
                    กำลังวิเคราะห์ด้วย AI...
                </>
                ) : (
                <>
                    <Sparkles size={18} />
                    เริ่มวิเคราะห์ (Start Analysis)
                </>
                )}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Output Section */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 flex flex-col">
          {activeTab === 'HEALTH_CHECK' && healthResult ? (
              <div className="flex-1 overflow-auto">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-orange-500" /> Detected Issues
                  </h4>
                  {healthResult.issues.length === 0 ? (
                      <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                          <CheckCircle size={20} /> Systems Nominal. No issues detected.
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {healthResult.issues.map((issue, idx) => (
                              <div key={idx} className={`p-4 rounded-lg border-l-4 shadow-sm bg-white
                                  ${issue.severity === 'CRITICAL' ? 'border-red-500' : issue.severity === 'HIGH' ? 'border-orange-500' : 'border-yellow-400'}
                              `}>
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-slate-800 text-sm">{issue.title}</span>
                                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500">{issue.code}</span>
                                  </div>
                                  <p className="text-xs text-slate-600">{issue.description}</p>
                              </div>
                          ))}
                      </div>
                  )}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h5 className="font-bold text-blue-800 text-xs mb-2 flex items-center gap-1"><Info size={14}/> Recommendation</h5>
                      <p className="text-xs text-blue-600 leading-relaxed">
                          ผลการตรวจนี้เป็นการวิเคราะห์เบื้องต้นจากข้อมูล Sensor. กรุณากดปุ่ม <b>"AI Analysis"</b> เพื่อให้ AI ประมวลผลร่วมกับอาการรถและเสนอแนวทางซ่อม
                      </p>
                  </div>
              </div>
          ) : result ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="prose prose-sm max-w-none text-slate-700 bg-white p-4 rounded-lg border border-slate-200">
                <h4 className="text-purple-700 font-bold mb-2 flex items-center gap-2"><BrainCircuit size={16}/> ผลการวิเคราะห์:</h4>
                <p className="whitespace-pre-wrap leading-relaxed">{result.analysis}</p>
              </div>
              
              <div className="flex-1">
                <h4 className="text-slate-800 font-bold mb-3">รายการซ่อมที่แนะนำ:</h4>
                <ul className="space-y-2 mb-6 max-h-[200px] overflow-y-auto">
                  {result.suggestedItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200 shadow-sm">
                      <span>{item.description}</span>
                      <span className="font-semibold text-slate-600">~฿{item.estimatedPrice.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleSaveToJob}
                disabled={isSaved}
                className={`w-full py-3 text-white rounded-lg font-bold flex justify-center items-center gap-2 mt-auto transition-all
                    ${isSaved ? 'bg-green-600 cursor-default' : 'bg-brand-600 hover:bg-brand-700'}
                `}
              >
                {isSaved ? (
                   <>บันทึกแล้ว <CheckCircle size={18} /></>
                ) : (
                   <>บันทึกผลลงใบงาน <FileText size={18} /></>
                )}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              {activeTab === 'HEALTH_CHECK' ? (
                  <>
                    <Activity size={48} className="mb-4 opacity-20" />
                    <p>กด Start Deep Scan เพื่อเริ่มตรวจสุขภาพ</p>
                  </>
              ) : (
                  <>
                    <BrainCircuit size={48} className="mb-4 opacity-20" />
                    <p>ผลการวิเคราะห์จะแสดงที่นี่</p>
                  </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiDiagnosis;

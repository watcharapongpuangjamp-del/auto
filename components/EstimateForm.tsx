
import React, { useState, useEffect, useRef } from 'react';
import { Estimate, LineItem, ItemType, SearchResult, Employee, ShopSettings, InventoryItem, RepairStage } from '../types';
import { Plus, Trash2, Wand2, Eye, Save, Contact, Clock, CheckCircle, PlayCircle, Search, Loader2, AlertCircle, Settings, X, ExternalLink, ShieldCheck, Timer, DollarSign, User, Package, Box, Wrench, Sparkles, BrainCircuit, Car, Printer, Volume2, SearchCode, Camera, Hash } from 'lucide-react';
import { searchPartsPricing, generateEstimateNote, speakText, extractVehicleInfoFromImage, voiceToEstimate } from '../services/geminiService';
import ServicePackageSelector from './ServicePackageSelector';
import { MAINTENANCE_DATA } from '../data/maintenanceData';
import LaborStandards from './LaborStandards';
import PartsLookup from './PartsLookup';
import { DEFAULT_EMPLOYEES, CAR_BRANDS, CAR_DATA, REPAIR_CATEGORIES } from '../constants';

interface EstimateFormProps {
  initialEstimate: Estimate;
  onSave: (estimate: Estimate, silent?: boolean) => void;
  onPreview: (estimate: Estimate) => void;
  onPrintJobCard?: (estimate: Estimate) => void;
  addedItems?: LineItem[];
  clearAddedItems?: () => void;
  shopSettings?: ShopSettings;
  inventoryItems?: InventoryItem[]; 
}

const EstimateForm: React.FC<EstimateFormProps> = ({ 
  initialEstimate, 
  onSave, 
  onPreview,
  onPrintJobCard,
  addedItems,
  clearAddedItems,
  shopSettings,
  inventoryItems = []
}) => {
  const [estimate, setEstimate] = useState<Estimate>(initialEstimate);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAiSearchModal, setShowAiSearchModal] = useState(true);
  const [quickSearchQuery, setQuickSearchQuery] = useState('Suzuki Swift Cabin Filter');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const filteredInventory = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) || 
    item.partNumber?.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
    item.officialPartNumber?.toLowerCase().includes(inventorySearchQuery.toLowerCase())
  );
  const [manualDescription, setManualDescription] = useState('');
  const [manualType, setManualType] = useState<ItemType>(ItemType.PART);
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState(0);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showPackageSelector, setShowPackageSelector] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [suggestedPackage, setSuggestedPackage] = useState<{km: number, description: string} | null>(null);
  
  const estimateRef = useRef(estimate);

  useEffect(() => { setEstimate(initialEstimate); }, [initialEstimate.id]);
  useEffect(() => { estimateRef.current = estimate; }, [estimate]);

  useEffect(() => {
    if (addedItems && addedItems.length > 0) {
      setEstimate(prev => ({
        ...prev,
        items: [...(prev.items || []), ...addedItems]
      }));
      if(clearAddedItems) clearAddedItems();
    }
  }, [addedItems, clearAddedItems]);

  useEffect(() => {
    const mileage = parseInt(estimate.vehicle?.mileage || '0');
    const make = estimate.vehicle?.make;
    const model = estimate.vehicle?.model;

    if (mileage > 0 && make && model && MAINTENANCE_DATA[make]) {
      const brandData = MAINTENANCE_DATA[make];
      // Find a model that matches or is a substring
      const modelKey = Object.keys(brandData.models).find(m => 
        model.toLowerCase().includes(m.split(' ')[0].toLowerCase())
      );

      if (modelKey) {
        const packages = brandData.models[modelKey].packages;
        // Find the closest package km that is >= current mileage
        const kms = Object.keys(packages).map(Number).sort((a, b) => a - b);
        const nextKm = kms.find(km => km >= mileage && km <= mileage + 2000);
        
        if (nextKm) {
          setSuggestedPackage({ km: nextKm, description: packages[nextKm].description });
        } else {
          setSuggestedPackage(null);
        }
      } else {
        setSuggestedPackage(null);
      }
    } else {
      setSuggestedPackage(null);
    }
  }, [estimate.vehicle?.mileage, estimate.vehicle?.make, estimate.vehicle?.model]);

  const updateCustomer = (field: string, value: string) => {
    setEstimate(prev => ({ ...prev, customer: { ...(prev.customer || {}), [field]: value } as any }));
  };

  const updateVehicle = (field: string, value: any) => {
    setEstimate(prev => ({ ...prev, vehicle: { ...(prev.vehicle || {}), [field]: value } as any }));
  };

  const addManualItem = () => {
    if (!manualDescription || manualPrice <= 0) {
      alert('กรุณาระบุรายละเอียดและราคา');
      return;
    }
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: manualDescription,
      quantity: manualQuantity,
      unitPrice: manualPrice,
      costPrice: 0,
      type: manualType,
      discount: 0
    };
    setEstimate(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    setManualDescription('');
    setManualQuantity(1);
    setManualPrice(0);
    setShowManualForm(false);
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      type: ItemType.PART,
      discount: 0
    };
    setEstimate(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setEstimate(prev => ({
      ...prev,
      items: (prev.items || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const removeItem = (id: string) => {
    setEstimate(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== id) }));
  };

  const handleAiNote = async () => {
    setIsGeneratingNote(true);
    const context = {
        customerName: estimate.customer?.name || 'คุณลูกค้า',
        vehicleInfo: `${estimate.vehicle?.make || ''} ${estimate.vehicle?.model || ''} ${estimate.vehicle?.licensePlate || ''}`,
        itemsList: (estimate.items || []).map(i => i.description).slice(0, 5).join(', ')
    };
    const text = await generateEstimateNote(context);
    if (text) setEstimate(prev => ({ ...prev, notes: text }));
    setIsGeneratingNote(false);
  };

  const handleSpeakNote = async () => {
    if (!estimate.notes) return;
    setIsSpeaking(true);
    await speakText(estimate.notes);
    setTimeout(() => setIsSpeaking(false), 2000); 
  };

  const handleVehicleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const result = await extractVehicleInfoFromImage(base64String, file.type);
        
        if (result) {
          if (result.make) updateVehicle('make', result.make);
          if (result.model) updateVehicle('model', result.model);
          if (result.year) updateVehicle('year', result.year);
          if (result.licensePlate) updateVehicle('licensePlate', result.licensePlate);
          if (result.vin) updateVehicle('vin', result.vin);
          if (result.color) updateVehicle('color', result.color);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const startVoiceToEstimate = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsVoiceRecording(true);
      setVoiceTranscript('กำลังฟัง...');
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      
      const vehicleInfo = `${estimate.vehicle?.make || ''} ${estimate.vehicle?.model || ''}`;
      try {
        const result = await voiceToEstimate(transcript, vehicleInfo);
        if (result && result.suggestedItems) {
          const newItems: LineItem[] = result.suggestedItems.map(item => ({
            id: `item-voice-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            description: item.description,
            quantity: 1,
            unitPrice: item.estimatedPrice,
            costPrice: Math.floor(item.estimatedPrice * 0.6),
            type: item.type as any,
            discount: 0,
            partNumber: item.partNumber,
            standardHours: item.standardHours
          }));
          setEstimate(prev => ({ ...prev, items: [...(prev.items || []), ...newItems] }));
        }
      } catch (error) {
        console.error("Voice Estimate Error:", error);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsVoiceRecording(false);
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  };

  const handlePreSave = () => {
    if (estimate.status === 'DRAFT') {
      setShowSaveConfirm(true);
    } else {
      onSave(estimate);
    }
  };

  const handleSaveWithStatus = (newStatus: Estimate['status']) => {
    let updated = { ...estimate, status: newStatus };
    if (newStatus === 'APPROVED' && (!updated.repairStage || updated.repairStage === RepairStage.RECEPTION)) {
        updated.repairStage = RepairStage.QUEUED;
    }
    setEstimate(updated);
    setShowSaveConfirm(false);
    onSave(updated);
  };

  const handleAddPartFromSearch = (item: LineItem) => {
    setEstimate(prev => ({
      ...prev,
      items: [...(prev.items || []), item]
    }));
    setShowAiSearchModal(false);
  };

  const subtotal = (estimate.items || []).reduce((sum, item) => {
    const discount = item.discount || 0;
    return sum + (item.quantity * item.unitPrice * (1 - discount / 100));
  }, 0);
  
  const totalDiscount = estimate.totalDiscount || 0;
  const vat = (subtotal - totalDiscount) * (estimate.taxRate || 0);
  const total = (subtotal - totalDiscount) + vat;

  const availableModels = estimate.vehicle?.make ? (CAR_DATA[estimate.vehicle.make] || []) : [];
  const mechanics = DEFAULT_EMPLOYEES.filter(emp => emp.role === 'MECHANIC');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการบันทึกเอกสาร</h3>
              <p className="text-slate-500 mb-6">
                เอกสารนี้อยู่ในสถานะ <span className="font-bold text-slate-700">DRAFT</span> (ร่าง)<br />
                คุณต้องการเปลี่ยนสถานะเป็น <span className="font-bold text-brand-600">APPROVED</span> เพื่อยืนยันการซ่อมและเริ่มตัดสต็อกเลยหรือไม่?
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleSaveWithStatus('APPROVED')}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-200"
                >
                  <CheckCircle size={20} />
                  เปลี่ยนเป็น APPROVED และบันทึก
                </button>
                <button 
                  onClick={() => handleSaveWithStatus('DRAFT')}
                  className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={20} />
                  บันทึกเป็น DRAFT (ร่าง) ต่อไป
                </button>
                <button 
                  onClick={() => setShowSaveConfirm(false)}
                  className="w-full py-2 text-slate-400 font-medium hover:text-red-500 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Search Modal */}
      {showAiSearchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setShowAiSearchModal(false)}
              className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
            >
              <X size={24} />
            </button>
            <div className="flex-1 overflow-hidden p-2">
              <PartsLookup 
                onAddPart={handleAddPartFromSearch} 
                inventoryItems={inventoryItems}
                initialQuery={quickSearchQuery}
              />
            </div>
          </div>
        </div>
      )}

      {/* Package Selector Modal */}
      {showPackageSelector && (
        <ServicePackageSelector 
          initialMake={estimate.vehicle?.make}
          initialModel={estimate.vehicle?.model}
          onSelectPackage={(items) => {
            setEstimate(prev => ({
              ...prev,
              items: [...(prev.items || []), ...items]
            }));
            setShowPackageSelector(false);
          }}
          onClose={() => setShowPackageSelector(false)}
        />
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4 flex-1">
                  <h3 className="font-bold whitespace-nowrap">เลือกอะไหล่จากคลัง</h3>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder="ค้นหาชื่ออะไหล่ หรือ P/N..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none"
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <button onClick={() => setShowInventoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
             </div>
             <div className="p-4 overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="p-3 text-left">PN</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-center">Stock</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInventory.length > 0 ? filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-xs">{item.partNumber || item.officialPartNumber || '-'}</td>
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.quantity <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-brand-600">฿{item.sellingPrice.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <button onClick={() => {
                            const newId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                            setEstimate(prev => ({
                              ...prev,
                              items: [...(prev.items || []), {
                                id: newId,
                                description: item.name,
                                quantity: 1,
                                unitPrice: item.sellingPrice,
                                costPrice: item.costPrice,
                                type: ItemType.PART,
                                category: item.category,
                                inventoryId: item.id,
                                partNumber: item.partNumber || item.officialPartNumber
                              }]
                            }));
                            setShowInventoryModal(false);
                          }} className="bg-brand-50 text-brand-700 px-3 py-1 rounded font-bold hover:bg-brand-600 hover:text-white transition-all">เลือก</button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Search size={48} className="opacity-20" />
                            <p>ไม่พบอะไหล่ที่ค้นหา</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold flex items-center gap-2 text-slate-700"><Car size={18} /> ข้อมูลรถเพิ่มเติม</h3>
                <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
             </div>
             <div className="p-6 overflow-auto">
               <div className="grid md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">เลขตัวถัง (VIN)</label>
                   <input type="text" className="w-full p-2 border rounded" value={estimate.vehicle?.vin || ''} onChange={e => updateVehicle('vin', e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">ปีรถ (Year)</label>
                   <input type="text" className="w-full p-2 border rounded" value={estimate.vehicle?.year || ''} onChange={e => updateVehicle('year', e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">สีรถ (Color)</label>
                   <input type="text" className="w-full p-2 border rounded" value={estimate.vehicle?.color || ''} onChange={e => updateVehicle('color', e.target.value)} />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">ระดับน้ำมัน (%)</label>
                   <input type="number" min="0" max="100" className="w-full p-2 border rounded" value={estimate.vehicle?.fuelLevel || ''} onChange={e => updateVehicle('fuelLevel', e.target.value)} />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1">รอยขีดข่วน / ตำหนิ</label>
                   <input type="text" placeholder="เช่น รอยขูดกันชนหน้าซ้าย, รอยบุบประตูหลังขวา" className="w-full p-2 border rounded" value={estimate.vehicle?.scratches?.join(', ') || ''} onChange={e => updateVehicle('scratches', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-2">
                     <Camera size={14} /> รูปภาพตัวรถ (Vehicle Photos)
                   </label>
                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                     {(estimate.vehicle?.photos || []).map((photo, idx) => (
                       <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                         <img src={photo} alt={`Vehicle ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         <button 
                           onClick={() => {
                             const newPhotos = (estimate.vehicle?.photos || []).filter((_, i) => i !== idx);
                             updateVehicle('photos', newPhotos);
                           }}
                           className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                         >
                           <X size={12} />
                         </button>
                       </div>
                     ))}
                     <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-500 hover:text-brand-500 transition-all cursor-pointer bg-slate-50">
                       <Plus size={24} />
                       <span className="text-[10px] font-bold mt-1">เพิ่มรูป</span>
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             const reader = new FileReader();
                             reader.onloadend = () => {
                               const base64String = reader.result as string;
                               const currentPhotos = estimate.vehicle?.photos || [];
                               updateVehicle('photos', [...currentPhotos, base64String]);
                             };
                             reader.readAsDataURL(file);
                           }
                         }}
                       />
                     </label>
                   </div>
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1">หมายเหตุตอนรับรถ</label>
                   <textarea className="w-full p-2 border rounded" rows={3} value={estimate.vehicle?.checkInNotes || ''} onChange={e => updateVehicle('checkInNotes', e.target.value)}></textarea>
                 </div>
               </div>
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end">
               <button onClick={() => setShowVehicleModal(false)} className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">บันทึกและปิด</button>
             </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {estimate.estimateNumber}
            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
              estimate.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {estimate.status}
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">วันที่สร้าง: {estimate.date}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {onPrintJobCard && (
             <button onClick={() => onPrintJobCard(estimate)} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold flex items-center gap-2 text-blue-600 hover:bg-blue-50">
               <Printer size={16} /> พิมพ์ใบสั่งซ่อม
             </button>
           )}
           <button onClick={() => onPreview(estimate)} className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors">
             <Eye size={16} /> บันทึกและดูตัวอย่าง
           </button>
           <button onClick={handlePreSave} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors shadow-sm">
             <Save size={16} /> บันทึกข้อมูล
           </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <User size={18} className="text-brand-600" /> ข้อมูลลูกค้า (Customer)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ชื่อลูกค้า</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="ค้นหาหรือพิมพ์ชื่อลูกค้า..."
                  value={estimate.customer?.name || ''} 
                  onChange={(e) => updateCustomer('name', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เบอร์โทรศัพท์</label>
                <input 
                  type="tel" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="08x-xxx-xxxx"
                  value={estimate.customer?.phone || ''} 
                  onChange={(e) => updateCustomer('phone', e.target.value)} 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ที่อยู่</label>
                <textarea 
                  rows={2} 
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="ที่อยู่สำหรับออกใบเสนอราคา..."
                  value={estimate.customer?.address || ''} 
                  onChange={(e) => updateCustomer('address', e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Car size={18} className="text-brand-600" /> ข้อมูลรถยนต์ (Vehicle)
              </h3>
              <button 
                onClick={() => setShowVehicleModal(true)}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-2 py-1 rounded transition-colors"
              >
                <Settings size={14} /> ข้อมูลเพิ่มเติม
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">เลขทะเบียนรถ</label>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-brand-600 cursor-pointer hover:text-brand-700 bg-brand-50 px-2 py-0.5 rounded transition-all">
                    {isOcrLoading ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Camera size={10} />
                    )}
                    {isOcrLoading ? 'กำลังสแกน...' : 'สแกนป้ายทะเบียน/VIN'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleVehicleOcr} disabled={isOcrLoading} />
                  </label>
                </div>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-brand-200 rounded-lg bg-brand-50/30 font-black text-lg text-brand-700 text-center uppercase focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="กข 1234"
                  value={estimate.vehicle?.licensePlate || ''} 
                  onChange={(e) => updateVehicle('licensePlate', e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ยี่ห้อ</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                  placeholder="เช่น Camry"
                  list="car-models-estimate" 
                  value={estimate.vehicle?.model || ''} 
                  onChange={(e) => updateVehicle('model', e.target.value)} 
                />
                <datalist id="car-models-estimate">
                   {availableModels.map(model => <option key={model} value={model} />)}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เลขไมล์ (Mileage)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full p-2.5 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-mono" 
                    placeholder="0"
                    value={estimate.vehicle?.mileage || ''} 
                    onChange={(e) => updateVehicle('mileage', e.target.value)} 
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">KM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <h3 className="font-bold text-slate-700">รายการงานซ่อม (Repair Items)</h3>
                {suggestedPackage && (
                   <button 
                     onClick={() => setShowPackageSelector(true)}
                     className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold animate-pulse hover:animate-none transition-all"
                   >
                     <Sparkles size={12} />
                     แนะนำ: {suggestedPackage.description}
                   </button>
                )}
             </div>
             
             <div className="flex gap-2">
                <button onClick={() => setShowManualForm(!showManualForm)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-200 transition-colors font-bold">
                   {showManualForm ? 'ปิดฟอร์ม' : '+ เพิ่มรายการเอง'}
                </button>
                <button onClick={() => setShowPackageSelector(true)} className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded border border-brand-200 hover:bg-brand-100 transition-colors flex items-center gap-1 font-bold">
                   <Settings size={14} /> แพ็กเกจเช็คระยะ
                </button>
                <button onClick={() => setShowInventoryModal(true)} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded border border-green-200 hover:bg-green-100 transition-colors">คลังอะไหล่</button>
                <button 
                  onClick={startVoiceToEstimate} 
                  disabled={isVoiceRecording}
                  className={`text-xs px-3 py-1.5 rounded border transition-all flex items-center gap-1 font-bold ${
                    isVoiceRecording 
                      ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Volume2 size={14} />
                  {isVoiceRecording ? 'กำลังฟัง...' : 'สั่งงานด้วยเสียง'}
                </button>
                <button onClick={addItem} className="text-xs bg-brand-600 text-white px-3 py-1.5 rounded border border-brand-600 hover:bg-brand-700 transition-colors shadow-sm">+ เพิ่มรายการว่าง</button>
             </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
             {showManualForm && (
               <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                 <div className="md:col-span-2">
                   <label className="text-xs font-bold text-slate-500">รายละเอียด</label>
                   <input className="w-full p-2 border rounded" value={manualDescription} onChange={e => setManualDescription(e.target.value)} placeholder="ระบุรายการ..." />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500">ประเภท</label>
                   <select className="w-full p-2 border rounded" value={manualType} onChange={e => setManualType(e.target.value as ItemType)}>
                     <option value={ItemType.PART}>อะไหล่</option>
                     <option value={ItemType.LABOR}>ค่าแรง</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500">จำนวน</label>
                   <input type="number" className="w-full p-2 border rounded" value={manualQuantity} onChange={e => setManualQuantity(parseInt(e.target.value))} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500">ราคา</label>
                   <input type="number" className="w-full p-2 border rounded" value={manualPrice} onChange={e => setManualPrice(parseFloat(e.target.value))} />
                 </div>
                 <button onClick={addManualItem} className="bg-brand-600 text-white p-2 rounded font-bold hover:bg-brand-700">เพิ่ม</button>
               </div>
             )}
             <table className="w-full text-sm">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                 <tr>
                   <th className="p-4 text-left font-bold uppercase tracking-wider text-[10px]">รายละเอียด (Description)</th>
                   <th className="p-4 text-center w-24 font-bold uppercase tracking-wider text-[10px]">หมวดหมู่</th>
                   <th className="p-4 text-center w-24 font-bold uppercase tracking-wider text-[10px]">ประเภท</th>
                   <th className="p-4 text-center w-32 font-bold uppercase tracking-wider text-[10px]">ช่างที่รับผิดชอบ</th>
                   <th className="p-4 text-center w-20 font-bold uppercase tracking-wider text-[10px]">จำนวน</th>
                   <th className="p-4 text-right w-24 font-bold uppercase tracking-wider text-[10px]">ทุน/หน่วย</th>
                   <th className="p-4 text-right w-24 font-bold uppercase tracking-wider text-[10px]">ขาย/หน่วย</th>
                   <th className="p-4 text-center w-16 font-bold uppercase tracking-wider text-[10px]">ลด%</th>
                   <th className="p-4 text-right w-32 font-bold uppercase tracking-wider text-[10px]">รวม (Total)</th>
                   <th className="p-4 w-10"></th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {(estimate.items || []).map(item => (
                   <tr key={item.id} className="hover:bg-slate-50/50">
                     <td className="p-3">
                        <div className="flex flex-col">
                           <input 
                             type="text" 
                             className="w-full p-1.5 bg-transparent outline-none font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all" 
                             placeholder="ระบุรายการ..."
                             value={item.description} 
                             onChange={e => updateItem(item.id, 'description', e.target.value)} 
                           />
                           {item.partNumber && (
                             <span className="text-[10px] text-slate-400 font-mono px-1.5 flex items-center gap-1">
                               <Package size={10} /> P/N: {item.partNumber}
                             </span>
                           )}
                           <div className="flex items-center gap-1 mt-1 px-1.5">
                             <Hash size={10} className="text-slate-400" />
                             <input 
                               type="text" 
                               className="flex-1 p-0.5 bg-transparent outline-none text-[10px] text-slate-500 focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all" 
                               placeholder="S/N หรือ ID อ้างอิง..."
                               value={item.serialNumber || ''} 
                               onChange={e => updateItem(item.id, 'serialNumber', e.target.value)} 
                             />
                           </div>
                        </div>
                     </td>
                     <td className="p-3">
                        <select className="w-full p-1.5 bg-transparent text-xs border-none focus:ring-1 focus:ring-brand-200 rounded transition-all" value={item.category || ''} onChange={e => updateItem(item.id, 'category', e.target.value)}>
                          <option value="">- เลือก -</option>
                          {REPAIR_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                     </td>
                     <td className="p-3">
                        <select className="w-full p-1.5 bg-transparent text-xs border-none focus:ring-1 focus:ring-brand-200 rounded transition-all" value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value)}>
                          <option value={ItemType.PART}>อะไหล่</option>
                          <option value={ItemType.LABOR}>ค่าแรง</option>
                        </select>
                     </td>
                     <td className="p-3">
                        {item.type === ItemType.LABOR ? (
                          <select 
                            className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            value={item.mechanicId || ''}
                            onChange={e => updateItem(item.id, 'mechanicId', e.target.value)}
                          >
                            <option value="">-- เลือกช่าง --</option>
                            {mechanics.map(mech => (
                              <option key={mech.id} value={mech.id}>{mech.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-center text-slate-300">-</div>
                        )}
                     </td>
                     <td className="p-3">
                       <input 
                         type="number" 
                         className="w-full p-1.5 text-center bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all font-bold" 
                         value={item.quantity} 
                         onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} 
                       />
                     </td>
                     <td className="p-3">
                       <input 
                         type="number" 
                         className="w-full p-1.5 text-right text-slate-400 bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all" 
                         value={item.costPrice || 0} 
                         onChange={e => {
                           const cost = Number(e.target.value);
                           setEstimate(prev => ({
                             ...prev,
                             items: (prev.items || []).map(i => i.id === item.id ? { ...i, costPrice: cost, unitPrice: Math.ceil(cost / 0.4) } : i)
                           }));
                         }} 
                       />
                     </td>
                     <td className="p-3">
                       <input 
                         type="number" 
                         className="w-full p-1.5 text-right font-bold text-brand-600 bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all" 
                         value={item.unitPrice} 
                         onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} 
                       />
                     </td>
                     <td className="p-3">
                       <input 
                         type="number" 
                         className="w-full p-1.5 text-center bg-transparent border-none focus:bg-white focus:ring-1 focus:ring-brand-200 rounded transition-all text-slate-500" 
                         value={item.discount || 0} 
                         onChange={e => updateItem(item.id, 'discount', Number(e.target.value))} 
                       />
                     </td>
                     <td className="p-3 text-right font-bold text-slate-800">
                        ฿{(item.quantity * item.unitPrice * (1 - (item.discount || 0)/100)).toLocaleString()}
                     </td>
                     <td className="p-3 text-center">
                        <button 
                          onClick={() => removeItem(item.id)} 
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid md:grid-cols-2 gap-8 pt-6 border-t">
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">หมายเหตุท้ายเอกสาร</label>
                <div className="flex gap-3">
                  <button onClick={handleSpeakNote} disabled={isSpeaking} className={`text-xs flex items-center gap-1 transition-colors ${isSpeaking ? 'text-slate-400' : 'text-orange-600 hover:text-orange-700'}`}>
                    {isSpeaking ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12}/>} 
                    อ่านออกเสียง (TTS)
                  </button>
                  <button onClick={handleAiNote} disabled={isGeneratingNote} className="text-xs text-brand-600 flex items-center gap-1 hover:text-brand-700">
                    <Wand2 size={12}/> AI Note
                  </button>
                </div>
             </div>
             <textarea className="w-full p-3 border rounded h-32 text-sm focus:ring-2 focus:ring-brand-500 outline-none" value={estimate.notes || ''} onChange={e => setEstimate({...estimate, notes: e.target.value})} />
          </div>
          
          <div className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200">
             <div className="flex justify-between text-slate-500">
                <span>รวมเงิน (Subtotal)</span>
                <span className="font-bold">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             
             <div className="flex justify-between items-center text-red-600 font-bold">
                <span className="flex items-center gap-2"><DollarSign size={14}/> ส่วนลดพิเศษท้ายบิล</span>
                <div className="relative w-32">
                   <input 
                     type="number" 
                     className="w-full p-2 border rounded bg-white text-right outline-none focus:ring-2 focus:ring-brand-500" 
                     value={estimate.totalDiscount || 0} 
                     onChange={e => setEstimate({...estimate, totalDiscount: Number(e.target.value)})} 
                   />
                </div>
             </div>

             <div className="flex justify-between text-slate-500">
                <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                <span>฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>

             <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-center">
                <span className="text-xl font-black text-slate-800">ยอดรวมสุทธิ</span>
                <span className="text-3xl font-black text-brand-700">฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateForm;

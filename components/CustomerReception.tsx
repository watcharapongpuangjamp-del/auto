
import React, { useState, useRef } from 'react';
import { ClipboardList, Car, User, Fuel, Calendar, Camera, Save, ArrowRight, BrainCircuit, FileText, Loader2, Upload } from 'lucide-react';
import { Estimate, Vehicle, Customer, ItemType, RepairStage } from '../types';
import { CAR_BRANDS, CAR_DATA } from '../constants';
import { extractVehicleInfoFromImage } from '../services/geminiService';

interface CustomerReceptionProps {
  onCheckInComplete: (data: Partial<Estimate>, nextView?: string) => void;
}

const CustomerReception: React.FC<CustomerReceptionProps> = ({ onCheckInComplete }) => {
  // Local state for the reception form
  const [customer, setCustomer] = useState<Customer>({ id: '', name: '', phone: '', address: '' });
  const [vehicle, setVehicle] = useState<Vehicle>({ 
    make: '', model: '', year: '', licensePlate: '', mileage: '', 
    fuelLevel: 50, scratches: [], color: ''
  });
  const [symptoms, setSymptoms] = useState('');
  const [checkInDate] = useState(new Date().toISOString().split('T')[0]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const mimeType = file.type;
          
          const vehicleInfo = await extractVehicleInfoFromImage(base64String, mimeType);
          
          setVehicle(prev => ({
            ...prev,
            make: vehicleInfo.make || prev.make,
            model: vehicleInfo.model || prev.model,
            year: vehicleInfo.year || prev.year,
            licensePlate: vehicleInfo.licensePlate || prev.licensePlate,
            color: vehicleInfo.color || prev.color,
            vin: vehicleInfo.vin || prev.vin
          }));
        } catch (error) {
          console.error('Error analyzing image:', error);
          alert('เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ (Error analyzing image)');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Fuel Slider
  const handleFuelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicle(prev => ({ ...prev, fuelLevel: parseInt(e.target.value) }));
  };

  // Basic form handlers
  const updateCustomer = (field: keyof Customer, value: string) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const updateVehicle = (field: keyof Vehicle, value: string) => {
    setVehicle(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleScratch = (part: string) => {
    setVehicle(prev => {
      const scratches = prev.scratches || [];
      if (scratches.includes(part)) {
        return { ...prev, scratches: scratches.filter(p => p !== part) };
      } else {
        return { ...prev, scratches: [...scratches, part] };
      }
    });
  };

  const handleSubmit = (nextView: string = 'dashboard') => {
    // Validate basic fields
    if (!customer.name || !vehicle.licensePlate) {
      alert('กรุณากรอกชื่อลูกค้าและทะเบียนรถ (Please enter customer name and license plate)');
      return;
    }

    // Prepare Notes
    let notes = `Reception Date: ${checkInDate}\n`;
    notes += `Fuel Level: ${vehicle.fuelLevel}%\n`;
    if (vehicle.scratches && vehicle.scratches.length > 0) {
      notes += `Visible Damage: ${vehicle.scratches.join(', ')}\n`;
    }
    notes += `\nCustomer Request/Symptoms:\n${symptoms}`;

    // Create Estimate Data Structure
    const estimateData: Partial<Estimate> = {
      date: checkInDate,
      customer: customer,
      vehicle: { ...vehicle, checkInNotes: symptoms },
      notes: notes,
      repairStage: RepairStage.RECEPTION,
      items: [
         {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          description: 'ค่าบริการตรวจสอบเบื้องต้น (Initial Inspection)',
          quantity: 1,
          unitPrice: 0, // Usually free or set price
          type: ItemType.LABOR
        }
      ]
    };

    onCheckInComplete(estimateData, nextView);
  };

  const vehicleParts = ['กันชนหน้า', 'ฝากระโปรง', 'แก้มซ้าย', 'แก้มขวา', 'ประตูซ้าย', 'ประตูซวา', 'หลังคา', 'ฝาท้าย', 'กันชนหลัง'];

  // Get models based on selected brand
  const availableModels = vehicle.make ? (CAR_DATA[vehicle.make] || []) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-brand-600" />
          ระบบรับรถเข้าซ่อม (Vehicle Check-in)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          บันทึกข้อมูลลูกค้ารายใหม่ ตรวจสภาพรถ และเปิดใบงาน (Create Job Card)
        </p>
      </div>

      <div className="p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Vehicle & Customer Data */}
          <div className="space-y-6">
            
            {/* Customer Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 border-b pb-3">
                <User size={20} className="text-brand-600" /> 
                <span>ข้อมูลลูกค้า <span className="text-slate-400 font-normal">(Customer Information)</span></span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                     <input 
                       type="text" 
                       className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                       placeholder="เช่น คุณสมชาย มุ่งมั่น"
                       value={customer.name} 
                       onChange={e => updateCustomer('name', e.target.value)} 
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                     <input 
                       type="tel" 
                       className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                       placeholder="08x-xxx-xxxx"
                       value={customer.phone} 
                       onChange={e => updateCustomer('phone', e.target.value)} 
                     />
                  </div>
                   <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เลขผู้เสียภาษี (ถ้ามี)</label>
                     <input 
                       type="text" 
                       className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                       placeholder="13 หลัก"
                       value={customer.taxId || ''} 
                       onChange={e => updateCustomer('taxId', e.target.value)} 
                     />
                  </div>
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ที่อยู่</label>
                   <textarea 
                     rows={2} 
                     className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                     placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล..."
                     value={customer.address} 
                     onChange={e => updateCustomer('address', e.target.value)} 
                   />
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 border-b pb-3">
                <Car size={20} className="text-brand-600" /> 
                <span>ข้อมูลรถยนต์ <span className="text-slate-400 font-normal">(Vehicle Details)</span></span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เลขทะเบียนรถ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-brand-200 rounded-lg bg-brand-50/30 font-black text-xl text-brand-700 placeholder:text-brand-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all uppercase text-center" 
                    placeholder="กข 1234"
                    value={vehicle.licensePlate} 
                    onChange={e => updateVehicle('licensePlate', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ยี่ห้อรถ</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                    placeholder="เช่น Toyota, Honda" 
                    list="car-brands"
                    value={vehicle.make} 
                    onChange={e => updateVehicle('make', e.target.value)} 
                  />
                  <datalist id="car-brands">
                    {CAR_BRANDS.map(brand => <option key={brand} value={brand} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">รุ่นรถ</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                    placeholder="เช่น Camry, Civic" 
                    list="car-models"
                    value={vehicle.model} 
                    onChange={e => updateVehicle('model', e.target.value)} 
                  />
                  <datalist id="car-models">
                    {availableModels.map(model => <option key={model} value={model} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">ปีรถ</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                    placeholder="เช่น 2020"
                    value={vehicle.year} 
                    onChange={e => updateVehicle('year', e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">สีรถ</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" 
                    placeholder="เช่น ขาว, ดำ"
                    value={vehicle.color || ''} 
                    onChange={e => updateVehicle('color', e.target.value)} 
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">เลขไมล์ปัจจุบัน (Mileage)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full p-2.5 pr-12 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-mono" 
                      placeholder="0"
                      value={vehicle.mileage} 
                      onChange={e => updateVehicle('mileage', e.target.value)} 
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">KM</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Inspection & Check-in */}
          <div className="space-y-6">
            
            {/* Condition Check */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" /> ตรวจสภาพเบื้องต้น (Initial Inspection)
              </h3>
              
              {/* Fuel Level */}
              <div className="mb-6">
                 <label className="text-sm text-slate-700 font-medium mb-2 flex justify-between">
                   <span className="flex items-center gap-2"><Fuel size={16}/> ระดับน้ำมัน (Fuel Level)</span>
                   <span className="font-bold text-brand-600">{vehicle.fuelLevel}%</span>
                 </label>
                 <input 
                   type="range" min="0" max="100" step="5" 
                   className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                   value={vehicle.fuelLevel} onChange={handleFuelChange}
                 />
                 <div className="flex justify-between text-xs text-slate-400 mt-1">
                   <span>E</span><span>1/4</span><span>1/2</span><span>3/4</span><span>F</span>
                 </div>
              </div>

              {/* Scratches / Marks Checklist */}
              <div className="mb-4">
                <label className="text-sm text-slate-700 font-medium mb-2 block">
                  จุดตำหนิรอบคัน (Existing Damages/Marks)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {vehicleParts.map(part => (
                    <button
                      key={part}
                      onClick={() => handleToggleScratch(part)}
                      className={`text-xs p-2 rounded border transition-colors ${
                        vehicle.scratches?.includes(part) 
                          ? 'bg-red-50 border-red-300 text-red-600 font-medium' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos Placeholder */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 p-4 border-2 border-dashed border-brand-300 rounded-lg bg-brand-50 text-center cursor-pointer hover:bg-brand-100 transition-colors relative overflow-hidden"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handlePhotoUpload}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
                    <p className="text-sm text-brand-700 font-bold">กำลังวิเคราะห์ข้อมูลรถด้วย AI...</p>
                    <p className="text-xs text-brand-500 mt-1">Extracting vehicle info...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-brand-500">
                      <Camera size={24} />
                    </div>
                    <p className="text-sm font-bold text-brand-700">ถ่ายรูปทะเบียนรถ / ป้ายวงกลม</p>
                    <p className="text-xs text-brand-500 mt-1">AI จะช่วยดึงข้อมูลรถให้อัตโนมัติ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Symptoms / Request */}
             <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex-1">
              <h3 className="font-bold text-slate-700 mb-2">
                อาการที่แจ้ง / ความต้องการลูกค้า
              </h3>
              <textarea 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-32"
                placeholder="เช่น เครื่องยนต์สั่น, แอร์ไม่เย็น, เปลี่ยนถ่ายน้ำมันเครื่อง..."
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleSubmit('tracking')}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <ArrowRight size={24} />
                เริ่มกระบวนการรับรถ (Start Check-in)
              </button>

              <button 
                onClick={() => handleSubmit('diagnosis')}
                className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <BrainCircuit size={24} />
                บันทึกและส่งวิเคราะห์ AI (Save & Diagnose)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSubmit('create')}
                  className="py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2"
                >
                  <FileText size={20} />
                  เปิดใบเสนอราคา (Quote)
                </button>
                <button 
                  onClick={() => handleSubmit('dashboard')} 
                  className="py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  บันทึกร่าง (Draft)
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReception;

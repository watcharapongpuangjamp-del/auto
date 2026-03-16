
import { Estimate, ItemType, ShopSettings, RepairStage, Employee, LaborStandard, UserRole } from './types';

export const VAT_RATE = 0.07; // Thailand 7% VAT

export const REPAIR_CATEGORIES = [
  'เครื่องยนต์',
  'ช่วงล่าง',
  'รองรับน้ำหนัก',
  'ส่งกำลัง',
  'ไฟฟ้า',
  'อื่นๆ'
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: 'AutoFix Pro Center (ตัวอย่างศูนย์บริการ)',
  address: '123 Sukhumvit Road, Bangkok 10110',
  phone: '02-123-4567',
  taxId: '1234567890123',
  defaultTaxRate: VAT_RATE,
  defaultNotes: 'ใบเสนอราคานี้ยืนยันราคาภายใน 15 วัน\nรับประกันงานซ่อม 3 เดือน / 5,000 กม.',
  bankInfo: 'ธนาคารกสิกรไทย 123-4-56789-0',
  laborRatePerHour: 400 // Default 400 THB/Hour
};

export const DEFAULT_ESTIMATE: Estimate = {
  id: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  estimateNumber: `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
  customer: {
    id: '',
    name: '',
    phone: '',
    address: '',
  },
  vehicle: {
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    mileage: '',
  },
  items: [
    {
      id: '1',
      description: 'ค่าบริการตรวจสอบเบื้องต้น (Initial Inspection)',
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      type: ItemType.LABOR,
      standardHours: 0.5,
      actualHours: 0.5
    }
  ],
  notes: DEFAULT_SHOP_SETTINGS.defaultNotes,
  status: 'DRAFT',
  taxRate: DEFAULT_SHOP_SETTINGS.defaultTaxRate,
  repairStage: RepairStage.QUEUED,
  timeline: []
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: '4',
    name: 'เทพวายุ (Admin)',
    position: 'ผู้ดูแลระบบ (Admin)',
    role: UserRole.ADMIN,
    phone: '099-888-7777',
    status: 'ACTIVE',
    salary: 45000,
    hourlyCost: 200,
    joinedDate: '2023-01-01'
  },
  {
    id: '1',
    name: 'สมชาย ใจดี (Head Tech)',
    position: 'หัวหน้าช่าง (Head Mechanic)',
    role: UserRole.MECHANIC,
    phone: '081-111-1111',
    status: 'ACTIVE',
    salary: 25000,
    hourlyCost: 150, // Cost to company per hour
    joinedDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'วิไล การบัญชี (Admin)',
    position: 'ธุรการ/บัญชี (Admin)',
    role: UserRole.ADMIN, 
    phone: '082-222-2222',
    status: 'ACTIVE',
    salary: 18000,
    hourlyCost: 100,
    joinedDate: '2023-03-01'
  },
  {
    id: '3',
    name: 'มานะ ช่างยนต์ (Tech)',
    position: 'ช่างเครื่องยนต์ (Mechanic)',
    role: UserRole.MECHANIC,
    phone: '089-999-8888',
    status: 'ACTIVE',
    salary: 15000,
    hourlyCost: 90,
    joinedDate: '2023-06-10'
  }
];

export const DEFAULT_LABOR_STANDARDS: LaborStandard[] = [
  // ENGINE & MAINTENANCE
  { code: 'ENG-001', description: 'เปลี่ยนถ่ายน้ำมันเครื่อง + ไส้กรอง', category: 'เครื่องยนต์', standardHours: 0.5, skillLevel: 'C' },
  { code: 'ENG-002', description: 'ปรับตั้งวาล์วเครื่องยนต์ (4 สูบ)', category: 'เครื่องยนต์', standardHours: 1.5, skillLevel: 'B' },
  { code: 'ENG-003', description: 'เปลี่ยนสายพานหน้าเครื่อง (Serpentine Belt)', category: 'เครื่องยนต์', standardHours: 0.8, skillLevel: 'B' },
  { code: 'ENG-004', description: 'เปลี่ยนประเก็นฝาครอบวาล์ว', category: 'เครื่องยนต์', standardHours: 1.0, skillLevel: 'B' },
  { code: 'ENG-005', description: 'ยกเครื่องยนต์ตรวจสอบ/โอเวอร์ฮอล (Engine Overhaul)', category: 'เครื่องยนต์', standardHours: 18.0, skillLevel: 'A' },
  { code: 'ENG-006', description: 'เปลี่ยนสายพานไทม์มิ่ง + ลูกรอก (Timing Set)', category: 'เครื่องยนต์', standardHours: 4.5, skillLevel: 'A' },
  { code: 'ENG-007', description: 'ล้างลิ้นปีกผีเสื้อ + รีเซ็ตค่า (Throttle Body)', category: 'เครื่องยนต์', standardHours: 0.6, skillLevel: 'B' },
  { code: 'ENG-008', description: 'เปลี่ยนหัวเทียน (Spark Plugs x4)', category: 'เครื่องยนต์', standardHours: 0.4, skillLevel: 'C' },
  
  // BRAKE SYSTEM
  { code: 'BRK-001', description: 'เปลี่ยนผ้าเบรคหน้า (คู่)', category: 'ช่วงล่าง', standardHours: 0.8, skillLevel: 'B' },
  { code: 'BRK-002', description: 'เปลี่ยนผ้าเบรคหลัง (คู่)', category: 'ช่วงล่าง', standardHours: 1.0, skillLevel: 'B' },
  { code: 'BRK-003', description: 'เจียรจานเบรคแบบประชิดล้อ (ต่อข้าง)', category: 'ช่วงล่าง', standardHours: 0.6, skillLevel: 'B' },
  { code: 'BRK-004', description: 'เปลี่ยนถ่ายน้ำมันเบรคทั้งระบบ (Bleed)', category: 'ช่วงล่าง', standardHours: 1.0, skillLevel: 'C' },
  { code: 'BRK-005', description: 'เปลี่ยนชุดซ่อมคาลิปเปอร์เบรค (ต่อล้อ)', category: 'ช่วงล่าง', standardHours: 1.5, skillLevel: 'B' },
  
  // SUSPENSION & STEERING
  { code: 'SUS-001', description: 'เปลี่ยนโช๊คอัพหน้า (คู่)', category: 'รองรับน้ำหนัก', standardHours: 2.0, skillLevel: 'B' },
  { code: 'SUS-002', description: 'เปลี่ยนปีกนกล่าง (ข้าง)', category: 'ช่วงล่าง', standardHours: 1.5, skillLevel: 'B' },
  { code: 'SUS-003', description: 'เปลี่ยนลูกหมากคันชัก/คันส่ง (Tie Rod)', category: 'ช่วงล่าง', standardHours: 0.8, skillLevel: 'B' },
  { code: 'SUS-004', description: 'เปลี่ยนลูกปืนล้อหน้า (ต่อข้าง)', category: 'ช่วงล่าง', standardHours: 1.5, skillLevel: 'A' },
  { code: 'SUS-005', description: 'เปลี่ยนแร็คพวงมาลัย (Steering Rack)', category: 'ช่วงล่าง', standardHours: 4.0, skillLevel: 'A' },

  // AIR CONDITIONING
  { code: 'AC-001', description: 'ล้างตู้แอร์ (ไม่ถอดคอนโซล - Camera)', category: 'อื่นๆ', standardHours: 1.5, skillLevel: 'B' },
  { code: 'AC-002', description: 'เปลี่ยนคอมเพรสเซอร์แอร์ + แวคเติมน้ำยา', category: 'อื่นๆ', standardHours: 3.5, skillLevel: 'A' },
  { code: 'AC-003', description: 'เติมน้ำยาแอร์ R134a/R1234yf', category: 'อื่นๆ', standardHours: 0.5, skillLevel: 'C' },
  { code: 'AC-004', description: 'ล้างคอยล์ร้อน (Condenser Cleaning)', category: 'อื่นๆ', standardHours: 0.5, skillLevel: 'C' },
  
  // TRANSMISSION
  { code: 'TRN-001', description: 'เปลี่ยนถ่ายน้ำมันเกียร์อัตโนมัติ/CVT', category: 'ส่งกำลัง', standardHours: 0.8, skillLevel: 'C' },
  { code: 'TRN-002', description: 'ล้างสมองเกียร์ (Valve Body Cleaning)', category: 'ส่งกำลัง', standardHours: 4.0, skillLevel: 'A' },
  { code: 'TRN-003', description: 'ยกเกียร์เปลี่ยนชุดคลัตช์ (M/T)', category: 'ส่งกำลัง', standardHours: 5.5, skillLevel: 'A' },
  { code: 'TRN-004', description: 'ฟลัชชิ่งน้ำมันเกียร์เต็มระบบ (ATF Flushing)', category: 'ส่งกำลัง', standardHours: 1.5, skillLevel: 'B' },

  // COOLING SYSTEM
  { code: 'COL-001', description: 'เปลี่ยนหม้อน้ำใหม่ (Radiator)', category: 'เครื่องยนต์', standardHours: 1.5, skillLevel: 'B' },
  { code: 'COL-002', description: 'ล้างหม้อน้ำ + เปลี่ยนน้ำยาหล่อเย็น', category: 'เครื่องยนต์', standardHours: 1.0, skillLevel: 'C' },
  { code: 'COL-003', description: 'เปลี่ยนปั๊มน้ำ (Water Pump)', category: 'เครื่องยนต์', standardHours: 2.5, skillLevel: 'B' },

  // ELECTRICAL & DIAGNOSTIC
  { code: 'ELE-001', description: 'ตรวจเช็คระบบไฟด้วยเครื่องสแกน (OBD Scan)', category: 'ไฟฟ้า', standardHours: 0.5, skillLevel: 'B' },
  { code: 'ELE-002', description: 'เปลี่ยนแบตเตอรี่พร้อมสำรองไฟ', category: 'ไฟฟ้า', standardHours: 0.3, skillLevel: 'C' },
  { code: 'ELE-003', description: 'เปลี่ยนไดชาร์จ (Alternator)', category: 'ไฟฟ้า', standardHours: 1.5, skillLevel: 'B' },
  { code: 'ELE-004', description: 'เปลี่ยนไดสตาร์ท (Starter Motor)', category: 'ไฟฟ้า', standardHours: 1.8, skillLevel: 'B' },
  { code: 'ELE-005', description: 'ตรวจสอบระบบไฟรั่ว (Parasitic Draw Test)', category: 'ไฟฟ้า', standardHours: 2.0, skillLevel: 'A' },
];

export const CAR_DATA: Record<string, string[]> = {
  "Acura": ["Integra", "MDX", "NSX", "RDX", "RLX", "TLX"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "4C", "Giulietta"],
  "Aston Martin": ["DB11", "DBS", "DBX", "Vantage", "Rapide"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "R8", "e-tron"],
  "Bentley": ["Bentayga", "Continental GT", "Flying Spur"],
  "BMW": ["Series 1", "Series 2", "Series 3", "Series 4", "Series 5", "Series 6", "Series 7", "Series 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "i7", "iX", "iX3", "M2", "M3", "M4", "M5"],
  "Bugatti": ["Chiron", "Veyron", "Divo"],
  "Buick": ["Enclave", "Encore", "Envision", "Regal"],
  "BYD": ["Atto 3", "Dolphin", "Seal", "Han", "Tang", "Song", "Qin"],
  "Cadillac": ["CT4", "CT5", "CT6", "Escalade", "XT4", "XT5", "XT6", "Lyriq"],
  "Changan": ["Lumin", "Deepal L07", "Deepal S07", "Alsvin", "CS35 Plus", "CS75 Plus"],
  "Chery": ["Omoda 5", "Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8 Pro"],
  "Chevrolet": ["Aveo", "Captiva", "Colorado", "Cruze", "Optra", "Sonic", "Spin", "Trailblazer", "Zafira", "Camaro", "Corvette"],
  "Chrysler": ["300C", "Pacifica"],
  "Citroën": ["C3", "C3 Aircross", "C4", "C5 Aircross", "Berlingo"],
  "Dacia": ["Duster", "Sandero", "Jogger", "Logan"],
  "Daewoo": ["Espero", "Lanos", "Matiz", "Nubira"],
  "Daihatsu": ["Atrai", "Hijet", "Mira", "Move", "Rocky", "Tanto", "Terios"],
  "Deepal": ["L07", "S07"],
  "Dodge": ["Challenger", "Charger", "Durango", "Hornet"],
  "Ferrari": ["296 GTB", "488", "812 Superfast", "F8 Tributo", "Portofino", "Roma", "SF90 Stradale", "Purosangue"],
  "Fiat": ["500", "500X", "Panda", "Tipo", "Ducato"],
  "Ford": ["EcoSport", "Everest", "Fiesta", "Focus", "Mustang", "Ranger", "Ranger Raptor", "Territory", "F-150"],
  "Foton": ["Tunland", "View", "Aumark"],
  "GAC Aion": ["Aion ES", "Aion Y Plus", "Aion V Plus"],
  "Geely": ["Geometry C", "Coolray", "Emgrand", "Okavango"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "GMC": ["Acadia", "Hummer EV", "Sierra", "Terrain", "Yukon"],
  "GWM": ["Haval H6", "Haval Jolion", "Ora 07", "Ora Good Cat", "Tank 300", "Tank 500"],
  "Haval": ["H6", "Jolion", "Dargo"],
  "Hino": ["300 Series", "500 Series", "700 Series", "Dutro", "Ranger"],
  "Honda": ["Accord", "BR-V", "Brio", "Brio Amaze", "City", "City Hatchback", "Civic", "CR-V", "Freed", "HR-V", "Jazz", "Mobilio", "Odyssey", "Stepwagon Spada", "WR-V"],
  "Hummer": ["H1", "H2", "H3", "EV Pickup", "EV SUV"],
  "Hyundai": ["Creta", "H-1", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Fe", "Staria", "Stargazer", "Tucson", "Veloster"],
  "Infiniti": ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  "Isuzu": ["D-Max", "Mu-7", "Mu-X", "Dragon Eye", "TFR", "Vertex", "Elf", "Forward"],
  "Jaguar": ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
  "Kia": ["Carnival", "EV6", "EV9", "Picanto", "Rio", "Sorento", "Soul", "Sportage", "Stinger"],
  "Koenigsegg": ["Agera", "Gemera", "Jesko", "Regera"],
  "Lamborghini": ["Aventador", "Huracan", "Revuelto", "Urus"],
  "Lancia": ["Ypsilon"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "Lexus": ["CT", "ES", "GS", "IS", "LC", "LM", "LS", "LX", "NX", "RC", "RX", "UX", "RZ"],
  "Lincoln": ["Aviator", "Corsair", "Nautilus", "Navigator"],
  "Lotus": ["Eletre", "Emira", "Evija", "Elise", "Exige"],
  "Lucid": ["Air", "Gravity"],
  "Maserati": ["Ghibli", "Grecale", "Levante", "MC20", "Quattroporte"],
  "Maxus": ["D60", "D90", "G10", "MIFA 9", "T60", "V80"],
  "Maybach": ["S-Class", "GLS"],
  "Mazda": ["BT-50", "CX-3", "CX-30", "CX-5", "CX-8", "CX-60", "Mazda 2", "Mazda 3", "MX-5", "RX-7", "RX-8"],
  "McLaren": ["570S", "720S", "750S", "Artura", "GT", "P1", "Senna"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "CLS", "G-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "EQA", "EQB", "EQC", "EQE", "EQS", "SL", "V-Class", "AMG GT"],
  "MG": ["Extender", "HS", "HS PHEV", "MG3", "MG4 Electric", "MG5", "MG ES", "MG EP", "MG ZS", "MG ZS EV", "V80"],
  "Mini": ["Clubman", "Countryman", "Hatch 3-Door", "Hatch 5-Door", "Convertible", "Electric"],
  "Mitsubishi": ["Attrage", "Lancer", "Lancer EX", "Mirage", "Outlander PHEV", "Pajero", "Pajero Sport", "Triton", "Xpander", "Xpander Cross", "Cyclone", "Strada"],
  "Neta": ["Neta V", "Neta V-II", "Neta U", "Neta GT"],
  "Nissan": ["Almera", "Frontier", "Juke", "Kicks e-Power", "Leaf", "March", "Navara", "Note", "Pulsar", "Sylphy", "Teana", "Terra", "Tiida", "X-Trail", "GT-R", "370Z", "400Z"],
  "Oldsmobile": ["88", "98", "Cutlass", "Toronado"],
  "Opel": ["Astra", "Corsa", "Insignia", "Mokka", "Zafira"],
  "ORA": ["Good Cat", "Good Cat GT", "07", "Grand Cat"],
  "Pagani": ["Huayra", "Utopia", "Zonda"],
  "Perodua": ["Alza", "Ativa", "Axia", "Myvi"],
  "Peugeot": ["2008", "3008", "5008", "408", "e-2008"],
  "Plymouth": ["Barracuda", "Prowler", "Road Runner"],
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4"],
  "Pontiac": ["Firebird", "GTO", "Solstice"],
  "Porsche": ["718 Boxster", "718 Cayman", "911 Carrera", "911 GT3", "911 Turbo", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Proton": ["Exora", "Gen-2", "Persona", "Saga", "Savvy", "X50", "X70"],
  "RAM": ["1500", "2500", "3500", "ProMaster"],
  "Renault": ["Captur", "Kwid", "Megane", "Zoe", "Master"],
  "Rivian": ["R1S", "R1T"],
  "Rolls-Royce": ["Cullinan", "Ghost", "Phantom", "Spectre"],
  "Rover": ["25", "45", "75"],
  "Saab": ["9-3", "9-5"],
  "Scania": ["G-Series", "L-Series", "P-Series", "R-Series", "S-Series"],
  "Scion": ["FR-S", "tC", "xB"],
  "SEAT": ["Arona", "Ateca", "Ibiza", "Leon", "Tarraco"],
  "Skoda": ["Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Superb"],
  "Smart": ["Fortwo", "Forfour", "#1", "#3"],
  "SsangYong": ["Korando", "Musso", "Rexton", "Stavic", "Tivoli"],
  "Subaru": ["BRZ", "Forester", "Outback", "Solterra", "WRX", "XV"],
  "Suzuki": ["Carry", "Celerio", "Ciaz", "Ertiga", "Jimny", "Swift", "Vitara", "XL7"],
  "Tank": ["300", "500"],
  "Tata": ["Nano", "Xenon", "Punch", "Nexon", "Harrier"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Toyota": ["Alphard", "Avanza", "Camry", "CH-R", "Commuter", "Corolla Altis", "Corolla Cross", "Fortuner", "GR Supra", "GR Yaris", "GR86", "Hilux Revo", "Hilux Vigo", "Innova", "Innova Zenix", "Majesty", "Sienta", "Soluna", "Tiger", "Vellfire", "Veloz", "Vios", "Yaris", "Yaris Ativ"],
  "UD Trucks": ["Croner", "Quester", "Quon"],
  "Volkswagen": ["Beetle", "Caravelle", "Golf", "Passat", "Scirocco", "Tiguan", "Touareg", "ID.3", "ID.4"],
  "Volvo": ["C40", "EX30", "S60", "S90", "V60", "XC40", "XC60", "XC90"],
  "WEY": ["Coffee 01", "Coffee 02"],
  "Wuling": ["Air EV", "BinguoEV", "Confero", "Hongguang Mini EV"],
  "XPeng": ["G3", "G6", "G9", "P5", "P7"],
  "Zeekr": ["001", "007", "009", "X"]
};

export const CAR_BRANDS = Object.keys(CAR_DATA).sort();

// Gemini Model Constants
export const MODEL_SEARCH = 'gemini-3-flash-preview';
export const MODEL_THINKING = 'gemini-3.1-pro-preview';
export const MODEL_FAST = 'gemini-3.1-flash-lite-preview';
export const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

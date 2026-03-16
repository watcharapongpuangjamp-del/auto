
import { ItemType, LineItem } from '../types';

export interface ServicePackage {
  km: number;
  description: string;
  items: Partial<LineItem>[];
}

export interface ModelMaintenance {
  model: string;
  packages: Record<number, ServicePackage>; // Key is mileage (e.g., 10000)
}

export interface BrandMaintenance {
  brand: string;
  models: Record<string, ModelMaintenance>;
}

// --- Standard Checklists ---

const getStandardInspectionItems = (): Partial<LineItem>[] => [
  { description: 'ตรวจเช็คระบบเบรค / ความหนาผ้าเบรค (Brake System)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'ตรวจเช็คช่วงล่าง ลูกหมาก บูชปีกนก (Suspension)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'ตรวจเช็คลมยางและสภาพยาง (Tires & Pressure)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'ตรวจเช็คระดับน้ำยาหล่อเย็น/น้ำมันเบรค/พาวเวอร์ (Fluids Level)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'ตรวจเช็คระบบไฟส่องสว่างรอบคัน (Lights System)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'ตรวจเช็คแบตเตอรี่และไดชาร์จ (Battery & Alternator)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
  { description: 'เป่าทำความสะอาดไส้กรองอากาศ (Clean Air Filter)', type: ItemType.LABOR, quantity: 1, unitPrice: 0 },
];

const generatePackage = (km: number, parts: Partial<LineItem>[], laborCost: number): ServicePackage => {
  return {
    km,
    description: `เช็คระยะ ${km.toLocaleString()} กม. (Periodic Maintenance)`,
    items: [
      { description: `ค่าแรงเช็คระยะ ${km.toLocaleString()} กม. (Labor Fee)`, type: ItemType.LABOR, quantity: 1, unitPrice: laborCost },
      ...parts,
      ...getStandardInspectionItems()
    ]
  };
};

// --- Common Parts Library ---

const P = {
  // Oils
  OIL_SYN_GAS: { description: 'น้ำมันเครื่องสังเคราะห์แท้ เบนซิน (Synthetic Gasoline Oil 4L)', type: ItemType.PART, quantity: 1, unitPrice: 1850 },
  OIL_SEMI_GAS: { description: 'น้ำมันเครื่องกึ่งสังเคราะห์ เบนซิน (Semi-Syn Gasoline Oil 4L)', type: ItemType.PART, quantity: 1, unitPrice: 950 },
  OIL_SYN_DSL: { description: 'น้ำมันเครื่องสังเคราะห์แท้ ดีเซล (Synthetic Diesel Oil 6+1L)', type: ItemType.PART, quantity: 1, unitPrice: 2400 },
  OIL_SEMI_DSL: { description: 'น้ำมันเครื่องกึ่งสังเคราะห์ ดีเซล (Semi-Syn Diesel Oil 6+1L)', type: ItemType.PART, quantity: 1, unitPrice: 1450 },
  OIL_MIN_DSL: { description: 'น้ำมันเครื่องเกรดรวม ดีเซล (Mineral Diesel Oil 15W-40 6L)', type: ItemType.PART, quantity: 1, unitPrice: 850 },
  OIL_ECO: { description: 'น้ำมันเครื่องสังเคราะห์แท้ Eco Car (0W-20 3.5L)', type: ItemType.PART, quantity: 1, unitPrice: 1200 },
  OIL_EURO: { description: 'น้ำมันเครื่องสังเคราะห์แท้ ยุโรป (0W-30/5W-30 LL-04) 5L', type: ItemType.PART, quantity: 1, unitPrice: 3200 },
  
  // Fluids & Grease
  WASHER: { description: 'แหวนรองน็อตถ่าย (Drain Plug Gasket)', type: ItemType.PART, quantity: 1, unitPrice: 35 },
  BRAKE_FLUID: { description: 'น้ำมันเบรค DOT4 (Brake Fluid)', type: ItemType.PART, quantity: 1, unitPrice: 180 },
  COOLANT: { description: 'น้ำยาหล่อเย็น (Coolant)', type: ItemType.PART, quantity: 1, unitPrice: 450 },
  GEAR_CVT: { description: 'น้ำมันเกียร์ CVT Fluid', type: ItemType.PART, quantity: 1, unitPrice: 1400 },
  GEAR_AT: { description: 'น้ำมันเกียร์ ATF', type: ItemType.PART, quantity: 1, unitPrice: 1200 },
  GEAR_MT: { description: 'น้ำมันเกียร์ธรรมดา/เฟืองท้าย (GL-5)', type: ItemType.PART, quantity: 1, unitPrice: 600 },
  GREASE: { description: 'อัดจาระบีช่วงล่าง/เพลากลาง (Chassis Greasing)', type: ItemType.LABOR, quantity: 1, unitPrice: 150 },
  
  // TOYOTA Parts
  FIL_OIL_TOYOTA: { description: 'ไส้กรองน้ำมันเครื่อง (Oil Filter) Toyota', type: ItemType.PART, quantity: 1, unitPrice: 220, partNumber: '90915-YZZE1' },
  FIL_AIR_VIOS: { description: 'ไส้กรองอากาศ (Air Filter) Vios/Yaris', type: ItemType.PART, quantity: 1, unitPrice: 450 },
  FIL_AC_VIOS: { description: 'ไส้กรองแอร์ (Cabin Filter) Vios/Yaris', type: ItemType.PART, quantity: 1, unitPrice: 450 },
  FIL_AIR_REVO: { description: 'ไส้กรองอากาศ (Air Filter) Revo/Fortuner', type: ItemType.PART, quantity: 1, unitPrice: 650 },
  FIL_FUEL_REVO: { description: 'ไส้กรองโซล่า (Fuel Filter) Revo', type: ItemType.PART, quantity: 1, unitPrice: 550 },
  SPARK_TOYOTA: { description: 'หัวเทียน Iridium (Spark Plugs x4)', type: ItemType.PART, quantity: 1, unitPrice: 2400 },

  // HONDA Parts
  FIL_OIL_HONDA: { description: 'ไส้กรองน้ำมันเครื่อง (Oil Filter) Honda', type: ItemType.PART, quantity: 1, unitPrice: 240, partNumber: '15400-RAF-T01' },
  FIL_AIR_CIVIC: { description: 'ไส้กรองอากาศ (Air Filter) Civic', type: ItemType.PART, quantity: 1, unitPrice: 550 },
  FIL_AC_HONDA: { description: 'ไส้กรองแอร์ (Cabin Filter) Honda', type: ItemType.PART, quantity: 1, unitPrice: 550 },
  SPARK_HONDA: { description: 'หัวเทียน Laser Iridium (Spark Plugs x4)', type: ItemType.PART, quantity: 1, unitPrice: 2800 },

  // BMW/EURO Parts
  FIL_OIL_BMW: { description: 'ไส้กรองน้ำมันเครื่อง (Oil Filter) BMW N20/N47', type: ItemType.PART, quantity: 1, unitPrice: 650 },
  FIL_AC_BMW: { description: 'ไส้กรองแอร์ Activated Carbon BMW', type: ItemType.PART, quantity: 1, unitPrice: 1800 },
  
  // EV Maintenance (Specific)
  COOLANT_EV: { description: 'น้ำยาหล่อเย็นชนิดพิเศษสำหรับรถไฟฟ้า (Low Conductivity Coolant)', type: ItemType.PART, quantity: 1, unitPrice: 1200 },
  FIL_AC_EV: { description: 'ไส้กรองแอร์ HEPA (EV Spec)', type: ItemType.PART, quantity: 1, unitPrice: 850 },

  // Generic
  FIL_OIL_ISUZU: { description: 'ไส้กรองน้ำมันเครื่อง (Oil Filter) Isuzu D-Max', type: ItemType.PART, quantity: 1, unitPrice: 350, partNumber: '8-98165071-0' },
  FIL_AIR_DMAX: { description: 'ไส้กรองอากาศ (Air Filter) D-Max', type: ItemType.PART, quantity: 1, unitPrice: 650 },
  FIL_FUEL_DMAX: { description: 'ไส้กรองโซล่า (Fuel Filter) D-Max', type: ItemType.PART, quantity: 1, unitPrice: 450 },
};

// --- Package Builders ---

const buildPackagesGasolineSmall = (oil: any, oilFilter: any, airFilter: any, acFilter: any, sparkPlugs: any) => {
  const pkgs: Record<number, ServicePackage> = {};
  const laborS = 400; // Small service labor
  const laborL = 800; // Large service labor

  [10000, 30000, 50000, 70000, 90000, 110000, 130000, 150000, 170000, 190000].forEach(km => {
    pkgs[km] = generatePackage(km, [oil, oilFilter, P.WASHER], laborS);
  });

  [20000, 60000, 140000, 180000].forEach(km => {
    pkgs[km] = generatePackage(km, [oil, oilFilter, P.WASHER, acFilter], laborS);
  });

  [40000, 120000, 200000].forEach(km => {
    pkgs[km] = generatePackage(km, [oil, oilFilter, P.WASHER, airFilter, acFilter, P.BRAKE_FLUID, P.GEAR_CVT], laborL);
  });

  [80000, 160000].forEach(km => {
    pkgs[km] = generatePackage(km, [oil, oilFilter, P.WASHER, airFilter, acFilter, P.BRAKE_FLUID, P.GEAR_CVT, P.COOLANT], laborL);
  });

  pkgs[100000] = generatePackage(100000, [oil, oilFilter, P.WASHER, acFilter, sparkPlugs], laborL);

  return pkgs;
};

const buildPackagesEV = () => {
  const pkgs: Record<number, ServicePackage> = {};
  const labor = 600;
  
  // EV usually has longer intervals or fewer items
  [20000, 60000, 100000, 140000, 180000].forEach(km => {
    pkgs[km] = generatePackage(km, [P.FIL_AC_EV], labor);
  });
  
  [40000, 80000, 120000, 160000].forEach(km => {
    pkgs[km] = generatePackage(km, [P.FIL_AC_EV, P.BRAKE_FLUID], labor + 400);
  });

  pkgs[100000] = {
    ...pkgs[100000],
    description: `เช็คระยะใหญ่รถไฟฟ้า 100,000 กม. (EV Major Service)`,
    items: [...pkgs[100000].items, P.COOLANT_EV]
  };

  return pkgs;
};

// --- Data Population ---

export const MAINTENANCE_DATA: Record<string, BrandMaintenance> = {
  'Toyota': {
    brand: 'Toyota',
    models: {
      'Vios/Yaris (2013+)': {
        model: 'Vios/Yaris (2013+)',
        packages: buildPackagesGasolineSmall(P.OIL_SEMI_GAS, P.FIL_OIL_TOYOTA, P.FIL_AIR_VIOS, P.FIL_AC_VIOS, P.SPARK_TOYOTA)
      },
      'Altis (2014+)': {
        model: 'Altis (2014+)',
        packages: buildPackagesGasolineSmall(P.OIL_SYN_GAS, P.FIL_OIL_TOYOTA, P.FIL_AIR_VIOS, P.FIL_AC_VIOS, P.SPARK_TOYOTA)
      },
      'Revo/Fortuner': {
        model: 'Revo/Fortuner',
        packages: {
          10000: generatePackage(10000, [P.OIL_SYN_DSL, P.FIL_OIL_TOYOTA, P.WASHER], 500),
          40000: generatePackage(40000, [P.OIL_SYN_DSL, P.FIL_OIL_TOYOTA, P.WASHER, P.FIL_AIR_REVO, P.FIL_FUEL_REVO, P.BRAKE_FLUID], 1200),
        }
      }
    }
  },
  'Honda': {
    brand: 'Honda',
    models: {
      'Civic FC/FK/FE': {
        model: 'Civic FC/FK/FE',
        packages: buildPackagesGasolineSmall(P.OIL_SYN_GAS, P.FIL_OIL_HONDA, P.FIL_AIR_CIVIC, P.FIL_AC_HONDA, P.SPARK_HONDA)
      },
      'City/Jazz (2014+)': {
        model: 'City/Jazz (2014+)',
        packages: buildPackagesGasolineSmall(P.OIL_SEMI_GAS, P.FIL_OIL_HONDA, P.FIL_AIR_CIVIC, P.FIL_AC_HONDA, P.SPARK_HONDA)
      }
    }
  },
  'BMW': {
    brand: 'BMW',
    models: {
      '3-Series / 5-Series': {
        model: '3-Series / 5-Series',
        packages: {
          15000: generatePackage(15000, [P.OIL_EURO, P.FIL_OIL_BMW, P.WASHER], 1200),
          30000: generatePackage(30000, [P.OIL_EURO, P.FIL_OIL_BMW, P.WASHER, P.FIL_AC_BMW], 1500),
          60000: generatePackage(60000, [P.OIL_EURO, P.FIL_OIL_BMW, P.WASHER, P.FIL_AC_BMW, P.BRAKE_FLUID, P.COOLANT], 2500),
        }
      }
    }
  },
  'BYD': {
    brand: 'BYD',
    models: {
      'Atto 3 / Dolphin': {
        model: 'Atto 3 / Dolphin',
        packages: buildPackagesEV()
      }
    }
  },
  'TESLA': {
    brand: 'TESLA',
    models: {
      'Model 3 / Model Y': {
        model: 'Model 3 / Model Y',
        packages: buildPackagesEV()
      }
    }
  }
};

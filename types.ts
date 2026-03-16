
export enum ItemType {
  PART = 'PART',
  LABOR = 'LABOR',
  OTHER = 'OTHER'
}

export enum RepairStage {
  RECEPTION = 'RECEPTION',
  DIAGNOSIS = 'DIAGNOSIS',
  ESTIMATION = 'ESTIMATION',
  QUEUED = 'QUEUED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  QC = 'QC',
  READY = 'READY'
}

export interface TimelineEvent {
  date: string;
  action: string;
  note?: string;
}

export interface LaborStandard {
  code: string;
  description: string;
  category: string;
  standardHours: number;
  skillLevel: 'A' | 'B' | 'C';
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  type: ItemType;
  discount?: number;
  partNumber?: string;
  serialNumber?: string;
  officialPrice?: number;
  inventoryId?: string;
  mechanicId?: string;
  category?: string;
  standardHours?: number;
  actualHours?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  taxId?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  mileage: string;
  vin?: string;
  fuelLevel?: number;
  color?: string;
  scratches?: string[];
  checkInNotes?: string;
  photos?: string[];
}

export interface DiagnosticIssue {
  code: string;
  system: 'ENGINE' | 'FUEL' | 'ELECTRICAL' | 'OTHER';
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface HealthCheckResult {
  overallScore: number;
  systemScores: {
    engine: number;
    fuel: number;
    electrical: number;
  };
  snapshotData: {
    rpm: number;
    coolantTemp: number;
    voltage: number;
    stft: number;
    ltft: number;
    maf: number;
  };
  issues: DiagnosticIssue[];
  timestamp: string;
}

export interface DiagnosisData {
  symptoms: string;
  obdCodes: string[];
  healthCheck?: HealthCheckResult;
  aiAnalysisResult?: string;
  aiSuggestedItems?: { 
    description: string; 
    type: ItemType; 
    estimatedPrice: number;
    partNumber?: string;
  }[];
  performedAt: string;
}

export interface Estimate {
  id: string;
  date: string;
  dueDate: string;
  estimateNumber: string;
  receiptNumber?: string;
  receiptDate?: string;
  customer: Customer;
  vehicle: Vehicle;
  items: LineItem[];
  notes: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  taxRate: number;
  totalDiscount?: number; // Added for global discount
  repairStage?: RepairStage;
  repairPhotos?: string[];
  timeline?: TimelineEvent[];
  diagnosis?: DiagnosisData;
  issuedBy?: string; // Added to track who created it
}

export interface InventoryItem {
  id: string;
  partNumber: string;
  officialPartNumber?: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  location: string;
  lastUpdated: string;
}

export interface ProcurementRequest {
  id: string;
  inventoryId?: string;
  description: string;
  partNumber?: string;
  quantityNeeded: number;
  relatedJobId: string;
  relatedJobNumber: string;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED';
  requestDate: string;
  purchaseOrderId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  vendorName: string;
  items: ProcurementRequest[];
  status: 'OPEN' | 'RECEIVED';
  totalCost: number;
  notes?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  STAFF = 'STAFF'
}

export enum Permission {
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  MANAGE_JOBS = 'MANAGE_JOBS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_EMPLOYEES = 'MANAGE_EMPLOYEES',
  VIEW_FINANCIALS = 'VIEW_FINANCIALS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  PERFORM_DIAGNOSIS = 'PERFORM_DIAGNOSIS',
  EXPORT_DATA = 'EXPORT_DATA'
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission) as Permission[],
  [UserRole.STAFF]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_JOBS,
    Permission.MANAGE_INVENTORY,
    Permission.PERFORM_DIAGNOSIS
  ],
  [UserRole.MECHANIC]: [
    Permission.VIEW_DASHBOARD,
    Permission.MANAGE_JOBS,
    Permission.PERFORM_DIAGNOSIS
  ]
};

export interface Employee {
  id: string;
  name: string;
  position: string;
  role: UserRole;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  email?: string;
  salary?: number;
  hourlyCost?: number;
  joinedDate?: string;
}

export interface SearchResult {
  title: string;
  price?: number;
  source?: string;
  link?: string;
  partNumber?: string;
  officialPrice?: number;
}

export interface AiDiagnosisResult {
  rootCause: string;
  analysis: string;
  suggestedItems: { 
    description: string; 
    type: ItemType; 
    estimatedPrice: number;
    partNumber?: string;
    standardHours?: number;
  }[];
}

export interface VehicleOcrResult {
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  vin?: string;
  color?: string;
}

export interface ObdScanResult {
  success: boolean;
  codes: string[];
  rawResponse?: string;
  error?: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  taxId: string;
  logoUrl?: string;
  defaultTaxRate: number;
  defaultNotes: string;
  bankInfo?: string;
  laborRatePerHour: number;
}

export interface MapPlace {
  title: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  uri?: string;
  location?: {
    latitude: number;
    longitude: number;
  }
}

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  view?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: 'ESTIMATE' | 'INVENTORY' | 'SYSTEM';
}


import React, { useState, useEffect } from 'react';
import { Menu, Bell, Car } from 'lucide-react';
import Sidebar from './components/Sidebar';
import EstimateForm from './components/EstimateForm';
import EstimatePreview from './components/EstimatePreview';
import Dashboard from './components/Dashboard';
import PartsLookup from './components/PartsLookup';
import AiDiagnosis from './components/AiDiagnosis';
import Settings from './components/Settings';
import Inventory from './components/Inventory';
import ReceiptsList from './components/ReceiptsList';
import LocalStoresMap from './components/LocalStoresMap';
import CustomerReception from './components/CustomerReception';
import JobTracking from './components/JobTracking';
import EmployeeManagement from './components/EmployeeManagement';
import CustomerPortal from './components/CustomerPortal';
import MechanicApp from './components/MechanicApp';
import MechanicDashboard from './components/MechanicDashboard';
import LaborStandards from './components/LaborStandards';
import PurchaseOrderPreview from './components/PurchaseOrderPreview';
import JobCardPreview from './components/JobCardPreview';
import CustomerManagement from './components/CustomerManagement';
import TutorialOverlay from './components/TutorialOverlay';
import NotificationCenter from './components/NotificationCenter';
import MechanicWorkload from './components/MechanicWorkload';
import { Estimate, LineItem, ShopSettings, RepairStage, Employee, ItemType, InventoryItem, ProcurementRequest, PurchaseOrder, Customer, DiagnosisData, AppNotification, UserRole, Permission, ROLE_PERMISSIONS } from './types';
import { DEFAULT_ESTIMATE, DEFAULT_SHOP_SETTINGS, DEFAULT_EMPLOYEES } from './constants';
import { TUTORIAL_STEPS } from './data/tutorialSteps';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc, getDocs } from 'firebase/firestore';
import { LogIn, AlertTriangle } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean, errorInfo: string | null };

class ErrorBoundary extends React.Component {
  props!: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, errorInfo: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "You don't have permission to perform this action. Please contact your administrator.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-600 mb-6">{displayMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Technical Details</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-[10px] overflow-auto max-h-40 text-gray-700">
                  {this.state.errorInfo}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', partNumber: 'SKU-001', officialPartNumber: '15400-RAF-T01', name: 'Oil Filter (Honda)', category: 'Filters', quantity: 24, minQuantity: 10, costPrice: 150, sellingPrice: 280, location: 'A1-02', lastUpdated: '2023-10-01' },
  { id: '2', partNumber: 'SKU-002', officialPartNumber: '0W-20-SN', name: 'Synthetic Oil 0W-20 (4L)', category: 'Oil & Fluids', quantity: 8, minQuantity: 5, costPrice: 850, sellingPrice: 1250, location: 'B2-01', lastUpdated: '2023-10-05' },
  { id: '3', partNumber: 'SKU-003', officialPartNumber: '45022-T5A-000', name: 'Brake Pads Front (Jazz/City)', category: 'Brakes', quantity: 2, minQuantity: 4, costPrice: 1200, sellingPrice: 2100, location: 'C1-04', lastUpdated: '2023-09-20' },
  { id: '4', partNumber: 'SKU-004', officialPartNumber: '90915-YZZE1', name: 'Oil Filter (Toyota)', category: 'Filters', quantity: 45, minQuantity: 20, costPrice: 120, sellingPrice: 220, location: 'A1-01', lastUpdated: '2023-10-10' },
  { id: '5', partNumber: 'SKU-005', officialPartNumber: '8-98165071-0', name: 'Oil Filter (D-Max)', category: 'Filters', quantity: 3, minQuantity: 10, costPrice: 210, sellingPrice: 350, location: 'A1-05', lastUpdated: '2023-10-11' },
  { id: '6', partNumber: 'SKU-006', officialPartNumber: 'GEN-R134A', name: 'Refrigerant R134a (13.6kg)', category: 'Oil & Fluids', quantity: 1, minQuantity: 1, costPrice: 1800, sellingPrice: 3500, location: 'D1-01', lastUpdated: '2023-10-12' },
  { id: '7', partNumber: 'SKU-007', officialPartNumber: 'BATT-35L', name: 'Battery 35L (Maintenance Free)', category: 'Electrical', quantity: 12, minQuantity: 5, costPrice: 1600, sellingPrice: 2400, location: 'E1-01', lastUpdated: '2023-10-14' },
  { id: '8', partNumber: 'SKU-008', officialPartNumber: 'SPARK-90919', name: 'Spark Plug Iridium (Toyota)', category: 'Ignition', quantity: 16, minQuantity: 8, costPrice: 380, sellingPrice: 650, location: 'F1-03', lastUpdated: '2023-10-15' },
  { id: '9', partNumber: 'SKU-009', officialPartNumber: 'AC-FIL-001', name: 'Cabin Filter (Universal Type A)', category: 'Filters', quantity: 20, minQuantity: 10, costPrice: 180, sellingPrice: 450, location: 'A2-01', lastUpdated: '2023-10-16' },
  { id: '10', partNumber: 'SKU-010', officialPartNumber: 'COOL-001', name: 'Coolant Pink (4L)', category: 'Oil & Fluids', quantity: 15, minQuantity: 6, costPrice: 280, sellingPrice: 550, location: 'B1-05', lastUpdated: '2023-10-17' },
  { id: '11', partNumber: '8-98165071-0', officialPartNumber: '8-98165071-0', name: 'ไส้กรองอากาศ Hino Ranger', category: 'Filters', quantity: 10, minQuantity: 5, costPrice: 200, sellingPrice: 300, location: 'G1-01', lastUpdated: '2023-10-20' },
];

const App: React.FC = () => {
  const port = window.location.port;
  const isCustomerMode = port === '3005';
  
  const getInitialUser = () => {
    const fallbackUser: Employee = {
      id: '0',
      name: 'Guest User',
      position: 'Staff',
      role: UserRole.STAFF,
      phone: '000-000-0000',
      status: 'ACTIVE'
    };

    try {
      if (!DEFAULT_EMPLOYEES || DEFAULT_EMPLOYEES.length === 0) return fallbackUser;

      if (port === '3001') {
        return DEFAULT_EMPLOYEES.find(e => e.role === UserRole.MECHANIC) || DEFAULT_EMPLOYEES[0] || fallbackUser;
      }
      return DEFAULT_EMPLOYEES.find(e => e.role === UserRole.ADMIN) || DEFAULT_EMPLOYEES[1] || DEFAULT_EMPLOYEES[0] || fallbackUser;
    } catch (e) {
      console.error("Error getting initial user:", e);
      return fallbackUser;
    }
  };

  const initialUser = getInitialUser();
  const [currentUser, setCurrentUser] = useState<Employee>(initialUser); 
  const [currentView, setCurrentView] = useState(initialUser.role === UserRole.MECHANIC ? 'mechanic_dashboard' : 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [employees, setEmployees] = useState<Employee[]>(DEFAULT_EMPLOYEES);
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [currentPO, setCurrentPO] = useState<PurchaseOrder | null>(null);

  const [currentEstimate, setCurrentEstimate] = useState<Estimate>({
    ...DEFAULT_ESTIMATE,
    id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  });

  const [pendingItems, setPendingItems] = useState<LineItem[]>([]);
  const [diagnosisJobId, setDiagnosisJobId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'QUOTATION' | 'RECEIPT' | 'JOB_CARD'>('QUOTATION');

  // Tutorial State
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  // Firebase Auth State
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Remote Support State
  const [remoteSupportEnabled, setRemoteSupportEnabled] = useState(false);

  // Firebase Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user profile
        let userDoc;
        try {
          userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
          return;
        }
        
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
          // Update current user based on profile
          const emp = employees.find(e => e.email === firebaseUser.email) || {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            position: userDoc.data().role,
            role: userDoc.data().role as UserRole,
            phone: '',
            status: 'ACTIVE',
            email: firebaseUser.email || ''
          };
          setCurrentUser(emp as Employee);
        } else {
          // Create default profile for first-time user
          const defaultRole = firebaseUser.email === 'watcharapong.puangjamp@gmail.com' ? UserRole.ADMIN : UserRole.STAFF;
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: defaultRole,
            name: firebaseUser.displayName
          };
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'users');
            return;
          }
          setUserProfile(newProfile);
          setCurrentUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            position: defaultRole,
            role: defaultRole,
            phone: '',
            status: 'ACTIVE',
            email: firebaseUser.email || ''
          } as Employee);
        }
      } else {
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [employees]);

  // Real-time Sync from Firestore
  useEffect(() => {
    if (!user) return;

    const unsubEstimates = onSnapshot(query(collection(db, 'estimates'), orderBy('date', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Estimate);
      if (data.length > 0) setEstimates(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'estimates'));

    const unsubInventory = onSnapshot(collection(db, 'inventoryItems'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as InventoryItem);
      if (data.length > 0) setInventoryItems(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventoryItems'));

    const unsubProcurement = onSnapshot(collection(db, 'procurementRequests'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ProcurementRequest);
      setProcurementRequests(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'procurementRequests'));

    const unsubPurchaseOrders = onSnapshot(collection(db, 'purchaseOrders'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as PurchaseOrder);
      setPurchaseOrders(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'purchaseOrders'));

    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Employee);
      if (data.length > 0) setEmployees(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'employees'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'shop'), (docSnap) => {
      if (docSnap.exists()) setShopSettings(docSnap.data() as ShopSettings);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/shop'));

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc')), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as AppNotification);
      setNotifications(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));

    return () => {
      unsubEstimates();
      unsubInventory();
      unsubEmployees();
      unsubSettings();
      unsubNotifications();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const addNotification = async (title: string, message: string, type: AppNotification['type'], relatedId?: string, relatedType?: AppNotification['relatedType']) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotification: AppNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedId,
      relatedType
    };
    if (user) {
      try {
        await setDoc(doc(db, 'notifications', id), newNotification);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `notifications/${id}`);
      }
    } else {
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const markAsRead = async (id: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }
  };

  const markAllAsRead = async () => {
    if (user) {
      const unread = notifications.filter(n => !n.isRead);
      for (const n of unread) {
        try {
          await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `notifications/${n.id}`);
        }
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const clearNotifications = async () => {
    if (user) {
      for (const n of notifications) {
        try {
          await deleteDoc(doc(db, 'notifications', n.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `notifications/${n.id}`);
        }
      }
    } else {
      setNotifications([]);
    }
  };

  // Check for expiring estimates
  useEffect(() => {
    const checkExpiringEstimates = () => {
      const today = new Date();
      estimates.forEach(est => {
        if (est.status === 'DRAFT' && est.dueDate) {
          const dueDate = new Date(est.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 3 && diffDays > 0) {
            // Check if notification already exists for this estimate
            const exists = notifications.find(n => n.relatedId === est.id && n.title.includes('ใกล้หมดอายุ'));
            if (!exists) {
              addNotification(
                'ใบเสนอราคาใกล้หมดอายุ',
                `ใบเสนอราคา ${est.estimateNumber} ของคุณ ${est.customer?.name} จะหมดอายุในอีก ${diffDays} วัน`,
                'WARNING',
                est.id,
                'ESTIMATE'
              );
            }
          } else if (diffDays <= 0) {
             const exists = notifications.find(n => n.relatedId === est.id && n.title.includes('หมดอายุแล้ว'));
             if (!exists) {
               addNotification(
                 'ใบเสนอราคาหมดอายุแล้ว',
                 `ใบเสนอราคา ${est.estimateNumber} ของคุณ ${est.customer?.name} หมดอายุแล้ว`,
                 'ERROR',
                 est.id,
                 'ESTIMATE'
               );
             }
          }
        }
      });
    };

    if (estimates.length > 0) {
      checkExpiringEstimates();
    }
  }, [estimates]);

  // Check for low stock items
  useEffect(() => {
    const checkLowStock = () => {
      inventoryItems.forEach(item => {
        if (item.quantity <= item.minQuantity) {
          const exists = notifications.find(n => n.relatedId === item.id && n.title.includes('สินค้าใกล้หมด'));
          if (!exists) {
            addNotification(
              'สินค้าใกล้หมด (Low Stock)',
              `อะไหล่ ${item.name} (${item.partNumber}) เหลือเพียง ${item.quantity} ชิ้น (ขั้นต่ำ ${item.minQuantity})`,
              'WARNING',
              item.id,
              'INVENTORY'
            );
          }
        }
      });
    };

    if (inventoryItems.length > 0) {
      checkLowStock();
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (estimates.length === 0) {
       const dummyJobs: Estimate[] = [
         {
           ...DEFAULT_ESTIMATE,
           id: 'demo-1',
           estimateNumber: 'JOB-2023-1001',
           customer: { id: 'c1', name: 'คุณมานะ รักดี', phone: '0812223333', address: '123/45 ซ.สุขุมวิท 101 กรุงเทพฯ' },
           vehicle: { make: 'Toyota', model: 'Hilux Revo', year: '2021', licensePlate: '1กข 1234', mileage: '85000', fuelLevel: 40 },
           status: 'APPROVED',
           repairStage: RepairStage.IN_PROGRESS,
           date: '2023-10-15',
           items: [
             { id: '1', description: 'เปลี่ยนถ่ายน้ำมันเครื่องสังเคราะห์ 100% (Diesel)', quantity: 1, unitPrice: 2400, type: ItemType.PART, costPrice: 1800, inventoryId: '5' },
             { id: '2', description: 'ไส้กรองน้ำมันเครื่อง Toyota Revo', quantity: 1, unitPrice: 220, type: ItemType.PART, costPrice: 120, inventoryId: '4' },
             { id: '3', description: 'ค่าแรงเปลี่ยนน้ำมันเครื่อง', quantity: 1, unitPrice: 300, type: ItemType.LABOR, standardHours: 0.5, mechanicId: '3' }
           ]
         },
         {
           ...DEFAULT_ESTIMATE,
           id: 'demo-2',
           estimateNumber: 'JOB-2023-1002',
           customer: { id: 'c2', name: 'คุณวิไล ใจดี', phone: '0894445555', address: '78 หมู่ 2 ต.บางโฉลง จ.สมุทรปราการ' },
           vehicle: { make: 'Honda', model: 'Civic FC', year: '2018', licensePlate: '7กก 7777', mileage: '42000', fuelLevel: 75 },
           status: 'APPROVED',
           repairStage: RepairStage.WAITING_PARTS,
           date: '2023-10-16',
           items: [
             { id: '1', description: 'ผ้าเบรคหน้า Honda Civic (แท้)', quantity: 1, unitPrice: 2100, type: ItemType.PART, costPrice: 1200, inventoryId: '3' },
             { id: '2', description: 'เจียรจานเบรคประชิดล้อ (คู่หน้า)', quantity: 1, unitPrice: 1200, type: ItemType.LABOR, standardHours: 1.5, mechanicId: '1' }
           ]
         },
         {
           ...DEFAULT_ESTIMATE,
           id: 'demo-3',
           estimateNumber: 'QT-2023-5001',
           customer: { id: 'c3', name: 'บริษัท โลจิสติกส์ไทย จำกัด', phone: '023334444', address: '456 เขตลาดกระบัง กรุงเทพฯ', taxId: '0105560000123' },
           vehicle: { make: 'Isuzu', model: 'D-Max 1.9', year: '2020', licensePlate: 'ฒห 8899', mileage: '120500', fuelLevel: 20 },
           status: 'DRAFT',
           repairStage: RepairStage.QUEUED,
           date: '2023-10-18',
           items: [
             { id: '1', description: 'ค่าแรงตรวจเช็คระบบช่วงล่างดังกึกกัก', quantity: 1, unitPrice: 500, type: ItemType.LABOR, standardHours: 1.0 },
             { id: '2', description: 'บูชปีกนกล่าง (ข้างละ 2 ตัว)', quantity: 4, unitPrice: 450, type: ItemType.PART, costPrice: 280 }
           ]
         },
         {
            ...DEFAULT_ESTIMATE,
            id: 'demo-4',
            estimateNumber: 'RC-2023-2001',
            customer: { id: 'c4', name: 'คุณสมชาย มุ่งมั่น', phone: '0851112222', address: 'ลาดพร้าว 71 กรุงเทพฯ' },
            vehicle: { make: 'BYD', model: 'Atto 3', year: '2023', licensePlate: '9กข 999', mileage: '15000', fuelLevel: 90 },
            status: 'COMPLETED',
            repairStage: RepairStage.READY,
            date: '2023-10-10',
            receiptDate: '2023-10-11',
            items: [
              { id: '1', description: 'เช็คระยะ 15,000 กม. (EV Maintenance Package)', quantity: 1, unitPrice: 1500, type: ItemType.LABOR, standardHours: 2.0, mechanicId: '1' },
              { id: '2', description: 'ไส้กรองแอร์ HEPA (BYD Spec)', quantity: 1, unitPrice: 850, type: ItemType.PART, costPrice: 450, inventoryId: '9' }
            ]
          },
          {
            ...DEFAULT_ESTIMATE,
            id: 'demo-5',
            estimateNumber: 'JOB-2023-1005',
            customer: { id: 'c5', name: 'คุณจารุวรรณ สวยงาม', phone: '0867778888', address: 'บางนา-ตราด กม.5' },
            vehicle: { make: 'BMW', model: 'Series 3 (G20)', year: '2022', licensePlate: 'ขข 333', mileage: '58000', fuelLevel: 50 },
            status: 'APPROVED',
            repairStage: RepairStage.QC,
            date: '2023-10-19',
            items: [
              { id: '1', description: 'เปลี่ยนคอมเพรสเซอร์แอร์ (Genuine BMW)', quantity: 1, unitPrice: 28500, type: ItemType.PART, costPrice: 22000 },
              { id: '2', description: 'แวคคั่มและเติมน้ำยาแอร์ R134a', quantity: 1, unitPrice: 1500, type: ItemType.LABOR, standardHours: 1.5, mechanicId: '1' },
              { id: '3', description: 'ล้างระบบทางเดินน้ำยา (Flushing)', quantity: 1, unitPrice: 2500, type: ItemType.LABOR, standardHours: 2.0, mechanicId: '3' }
            ]
          },
          {
            ...DEFAULT_ESTIMATE,
            id: 'demo-6',
            estimateNumber: 'QT-2023-6001',
            customer: { id: 'c6', name: 'หจก. ขนส่งรุ่งเรือง', phone: '0815556666', address: 'สมุทรปราการ' },
            vehicle: { make: 'Hino', model: 'Ranger', year: '2019', licensePlate: '80-1234', mileage: '250000', fuelLevel: 60 },
            status: 'DRAFT',
            repairStage: RepairStage.ESTIMATION,
            date: '2023-10-20',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Expires in 2 days
            items: [
              { id: 'item-hino-1', description: 'ไส้กรองอากาศ Hino Ranger', quantity: 2, unitPrice: 300, type: ItemType.PART, costPrice: 200, partNumber: '8-98165071-0', inventoryId: '11' }
            ]
          },
          {
            ...DEFAULT_ESTIMATE,
            id: 'demo-7',
            estimateNumber: 'QT-2023-7001',
            customer: { id: 'c7', name: 'คุณสมศักดิ์ ขยันยิ่ง', phone: '0823334444', address: 'บางบัวทอง นนทบุรี' },
            vehicle: { make: 'Mitsubishi', model: 'Triton', year: '2020', licensePlate: 'กข 5555', mileage: '110000', fuelLevel: 30 },
            status: 'DRAFT',
            repairStage: RepairStage.ESTIMATION,
            date: '2023-10-01',
            dueDate: '2023-10-15', // Expired
            items: [
              { id: 'item-expired-1', description: 'ตรวจเช็คระบบเบรก', quantity: 1, unitPrice: 500, type: ItemType.LABOR, standardHours: 1.0 }
            ]
          }
       ];
       setEstimates(dummyJobs);
    }
  }, []);

  // Sync View with Tutorial Step
  useEffect(() => {
    if (isTutorialActive) {
      const step = TUTORIAL_STEPS[currentTutorialStep];
      if (step.view && step.view !== currentView) {
        setCurrentView(step.view);
      }
    }
  }, [currentTutorialStep, isTutorialActive]);

  // Stock update logic
  const updateStockFromDifference = async (oldItems: LineItem[], newItems: LineItem[], relatedJob: Estimate) => {
    const newProcurements: ProcurementRequest[] = [];
    const updatedInventory = [...inventoryItems];

    const getInventoryTotals = (items: LineItem[]) => {
       const totals: Record<string, number> = {};
       (items || []).forEach(item => {
          if (item.type === ItemType.PART && item.inventoryId) {
             totals[item.inventoryId] = (totals[item.inventoryId] || 0) + item.quantity;
          }
       });
       return totals;
    };

    const oldTotals = getInventoryTotals(oldItems);
    const newTotals = getInventoryTotals(newItems);
    const allInvIds = new Set([...Object.keys(oldTotals), ...Object.keys(newTotals)]);

    allInvIds.forEach(invId => {
        const oldQty = oldTotals[invId] || 0;
        const newQty = newTotals[invId] || 0;
        const diff = newQty - oldQty;

        if (diff !== 0) {
           const invIndex = updatedInventory.findIndex(i => i.id === invId);
           if (invIndex >= 0) {
              const invItem = updatedInventory[invIndex];
              const previousStock = invItem.quantity;
              
              updatedInventory[invIndex] = {
                 ...invItem,
                 quantity: previousStock - diff,
                 lastUpdated: new Date().toISOString().split('T')[0]
              };

              const currentStock = updatedInventory[invIndex].quantity;

              if (diff > 0 && currentStock < 0) {
                  let needed = previousStock >= 0 ? Math.abs(currentStock) : diff;
                  if (needed > 0) {
                      newProcurements.push({
                          id: `PR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                          inventoryId: invItem.id,
                          description: invItem.name,
                          partNumber: invItem.partNumber,
                          quantityNeeded: needed,
                          relatedJobId: relatedJob.id,
                          relatedJobNumber: relatedJob.estimateNumber,
                          status: 'PENDING',
                          requestDate: new Date().toISOString()
                      });
                  }
              }
           }
        }
    });

    const getNonInvItems = (items: LineItem[]) => (items || []).filter(i => i.type === ItemType.PART && !i.inventoryId);
    const oldNonInvMap = new Map(getNonInvItems(oldItems).map(i => [i.id, i]));
    const newNonInv = getNonInvItems(newItems);
    
    newNonInv.forEach(newItem => {
        const oldItem = oldNonInvMap.get(newItem.id);
        const oldQty = oldItem ? oldItem.quantity : 0;
        const diff = newItem.quantity - oldQty;
        if (diff > 0) {
             newProcurements.push({
                  id: `PR-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                  description: newItem.description,
                  partNumber: newItem.partNumber,
                  quantityNeeded: diff,
                  relatedJobId: relatedJob.id,
                  relatedJobNumber: relatedJob.estimateNumber,
                  status: 'PENDING',
                  requestDate: new Date().toISOString()
              });
        }
    });

    if (user) {
      try {
        for (const item of updatedInventory) {
          await setDoc(doc(db, 'inventoryItems', item.id), item);
        }
        for (const req of newProcurements) {
          await setDoc(doc(db, 'procurementRequests', req.id), req);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'inventory/procurement');
      }
    } else {
      setInventoryItems(updatedInventory);
      setProcurementRequests(prev => [...prev, ...newProcurements]);
    }
    if (newProcurements.length > 0) alert(`Stock Alert: สร้างใบขอซื้ออะไหล่เพิ่ม ${newProcurements.length} รายการ`);
  };

  const handleCreatePurchaseOrder = async (selectedRequests: ProcurementRequest[], vendor: string) => {
     const newPO: PurchaseOrder = {
       id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
       poNumber: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
       date: new Date().toISOString().split('T')[0],
       vendorName: vendor,
       items: selectedRequests,
       status: 'OPEN',
       totalCost: 0 
     };
     if (user) {
       await setDoc(doc(db, 'purchaseOrders', newPO.id), newPO);
       for (const req of selectedRequests) {
         await updateDoc(doc(db, 'procurementRequests', req.id), { status: 'ORDERED', purchaseOrderId: newPO.id });
       }
     } else {
       setPurchaseOrders(prev => [newPO, ...prev]);
       setProcurementRequests(prev => prev.map(req => {
          if (selectedRequests.find(s => s.id === req.id)) return { ...req, status: 'ORDERED', purchaseOrderId: newPO.id };
          return req;
       }));
     }
     alert(`สร้างใบสั่งซื้อ ${newPO.poNumber} เรียบร้อย!`);
  };

  const handleReceivePurchaseOrder = async (po: PurchaseOrder) => {
    if (!confirm(`ยืนยันการรับสินค้าทั้งหมดจาก ${po.poNumber}?`)) return;
    
    const updatedInventory = [...inventoryItems];
    const updatedRequests = [...procurementRequests];

    for (const req of po.items) {
       if (req.status === 'RECEIVED') continue;
       
       if (req.inventoryId) {
          const idx = updatedInventory.findIndex(i => i.id === req.inventoryId);
          if (idx >= 0) updatedInventory[idx] = { ...updatedInventory[idx], quantity: updatedInventory[idx].quantity + req.quantityNeeded, lastUpdated: new Date().toISOString().split('T')[0] };
       } else {
          updatedInventory.push({ id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, name: req.description, partNumber: req.partNumber || 'N/A', category: 'General', quantity: req.quantityNeeded, minQuantity: 0, costPrice: 0, sellingPrice: 0, location: 'Pending', lastUpdated: new Date().toISOString().split('T')[0] });
       }
       
       const reqIdx = updatedRequests.findIndex(r => r.id === req.id);
       if (reqIdx >= 0) updatedRequests[reqIdx] = { ...updatedRequests[reqIdx], status: 'RECEIVED' };
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'purchaseOrders', po.id), { status: 'RECEIVED' });
        for (const item of updatedInventory) {
          await setDoc(doc(db, 'inventoryItems', item.id), item);
        }
        for (const req of po.items) {
          await updateDoc(doc(db, 'procurementRequests', req.id), { status: 'RECEIVED' });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `purchaseOrders/${po.id}`);
      }
    } else {
      setPurchaseOrders(prev => prev.map(p => p.id === po.id ? { ...p, status: 'RECEIVED' } : p));
      setInventoryItems(updatedInventory);
      setProcurementRequests(updatedRequests);
    }
    alert('รับสินค้าเข้าคลังเรียบร้อย (Stock Updated)');
  };

  const handleReceivePOItem = async (poId: string, requestId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const req = po.items.find(r => r.id === requestId);
    if (!req || req.status === 'RECEIVED') return;

    if (!confirm(`ยืนยันการรับสินค้า "${req.description}"?`)) return;

    const updatedInventory = [...inventoryItems];
    let updatedItem: InventoryItem | null = null;

    if (req.inventoryId) {
        const idx = updatedInventory.findIndex(i => i.id === req.inventoryId);
        if (idx >= 0) {
            updatedInventory[idx] = { 
                ...updatedInventory[idx], 
                quantity: updatedInventory[idx].quantity + req.quantityNeeded, 
                lastUpdated: new Date().toISOString().split('T')[0] 
            };
            updatedItem = updatedInventory[idx];
        }
    } else {
        updatedItem = { 
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
            name: req.description, 
            partNumber: req.partNumber || 'N/A', 
            category: 'General', 
            quantity: req.quantityNeeded, 
            minQuantity: 0, 
            costPrice: 0, 
            sellingPrice: 0, 
            location: 'Pending', 
            lastUpdated: new Date().toISOString().split('T')[0] 
        };
        updatedInventory.push(updatedItem);
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'procurementRequests', requestId), { status: 'RECEIVED' });
        if (updatedItem) await setDoc(doc(db, 'inventoryItems', updatedItem.id), updatedItem);
        
        // Update PO items status locally and in Firestore
        const updatedPoItems = po.items.map(i => i.id === requestId ? { ...i, status: 'RECEIVED' } : i);
        const allReceived = updatedPoItems.every(i => i.status === 'RECEIVED');
        await updateDoc(doc(db, 'purchaseOrders', poId), { 
          items: updatedPoItems,
          status: allReceived ? 'RECEIVED' : 'OPEN'
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `procurementRequests/${requestId}`);
      }
    } else {
      setProcurementRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'RECEIVED' } : r));
      setInventoryItems(updatedInventory);
      setPurchaseOrders(prev => prev.map(p => {
        if (p.id === poId) {
          const updatedItems = p.items.map(i => i.id === requestId ? { ...i, status: 'RECEIVED' } : i);
          return { ...p, items: updatedItems, status: updatedItems.every(i => i.status === 'RECEIVED') ? 'RECEIVED' : 'OPEN' };
        }
        return p;
      }));
    }
  };

  const handleViewPO = (po: PurchaseOrder) => { setCurrentPO(po); setCurrentView('po_preview'); };
  const handlePrintJobCard = (est: Estimate) => { setCurrentEstimate(est); setViewMode('JOB_CARD'); setCurrentView('job_card_preview'); };

  const handleSaveEstimate = async (est: Estimate, silent: boolean = false) => {
    const oldEst = estimates.find(e => e.id === est.id);
    const oldStatus = oldEst ? oldEst.status : 'DRAFT';
    const newStatus = est.status;

    // Trigger notification on status change
    if (oldEst && oldStatus !== newStatus) {
      let type: AppNotification['type'] = 'INFO';
      let title = 'การเปลี่ยนแปลงสถานะ';
      let message = `ใบเสนอราคา ${est.estimateNumber} เปลี่ยนสถานะเป็น ${newStatus}`;

      if (newStatus === 'APPROVED') {
        type = 'SUCCESS';
        title = 'ใบเสนอราคาได้รับการอนุมัติ';
        message = `ใบเสนอราคา ${est.estimateNumber} ของคุณ ${est.customer?.name} ได้รับการอนุมัติแล้ว`;
      } else if (newStatus === 'CANCELLED') {
        type = 'ERROR';
        title = 'ใบเสนอราคาถูกปฏิเสธ';
        message = `ใบเสนอราคา ${est.estimateNumber} ของคุณ ${est.customer?.name} ถูกยกเลิก/ปฏิเสธ`;
      }

      addNotification(title, message, type, est.id, 'ESTIMATE');
    }

    if (newStatus === 'APPROVED') {
       if (oldStatus !== 'APPROVED') await updateStockFromDifference([], est.items, est);
       else await updateStockFromDifference(oldEst?.items || [], est.items, est);
    } else if (newStatus === 'CANCELLED' && oldStatus === 'APPROVED') {
       await updateStockFromDifference(oldEst?.items || [], [], est);
    }

    if (user) {
      try {
        await setDoc(doc(db, 'estimates', est.id), est);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `estimates/${est.id}`);
      }
    } else {
      setEstimates(prev => {
        const exists = prev.find(p => p.id === est.id);
        if (exists) return prev.map(p => p.id === est.id ? est : p);
        return [est, ...prev];
      });
    }

    if (!silent) {
      alert('บันทึกเรียบร้อย');
      if (est.status === 'COMPLETED') setCurrentView('receipts');
      else setCurrentView('dashboard');
    }
  };

  const handleCreateNew = () => {
    setCurrentEstimate({ ...DEFAULT_ESTIMATE, id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, estimateNumber: `QT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, taxRate: shopSettings.defaultTaxRate, notes: shopSettings.defaultNotes, repairStage: RepairStage.QUEUED });
    setViewMode('QUOTATION');
    setCurrentView('create');
  };

  const handleEditEstimate = (est: Estimate) => { setCurrentEstimate(est); setViewMode('QUOTATION'); setCurrentView('create'); };
  const handleAddPartFromSearch = (item: LineItem) => { setPendingItems(prev => [...prev, item]); alert(`เพิ่ม "${item.description}" ลงในรายการแล้ว`); };
  const handleSaveDiagnosis = async (jobId: string, diagnosisData: DiagnosisData) => { 
    const job = estimates.find(e => e.id === jobId);
    if (job) {
      const updatedJob = { ...job, diagnosis: diagnosisData, repairStage: RepairStage.ESTIMATION };
      if (user) {
        try {
          await setDoc(doc(db, 'estimates', jobId), updatedJob);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `estimates/${jobId}`);
        }
      } else {
        setEstimates(prev => prev.map(est => est.id === jobId ? updatedJob : est));
      }
    }
  };
  const handleNavigateToEstimate = (jobId: string) => { const job = estimates.find(e => e.id === jobId); if (job) handleEditEstimate(job); };
  const handleSaveSettings = async (newSettings: ShopSettings) => {
    if (user) {
      try {
        await setDoc(doc(db, 'settings', 'shop'), newSettings);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'settings/shop');
      }
    }
    setShopSettings(newSettings);
  };

  const handleConvertToReceipt = async (est: Estimate) => {
    if (confirm('ยืนยันการออกใบเสร็จ? สถานะจะเปลี่ยนเป็น Completed')) {
      const updatedEst: Estimate = { ...est, status: 'COMPLETED', receiptNumber: `RC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, receiptDate: new Date().toISOString().split('T')[0] };
      if (user) {
        try {
          await setDoc(doc(db, 'estimates', est.id), updatedEst);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `estimates/${est.id}`);
        }
      } else {
        setEstimates(prev => prev.map(p => p.id === est.id ? updatedEst : p));
      }
      setCurrentEstimate(updatedEst);
      addNotification(
        'ออกใบเสร็จเรียบร้อย',
        `ใบเสนอราคา ${est.estimateNumber} ได้เปลี่ยนเป็นใบเสร็จเลขที่ ${updatedEst.receiptNumber} แล้ว`,
        'SUCCESS',
        est.id,
        'ESTIMATE'
      );
    }
  };

  const handleViewReceipt = (est: Estimate) => { setCurrentEstimate(est); setViewMode('RECEIPT'); setCurrentView('preview'); };

  const handleCheckInComplete = async (data: Partial<Estimate>, nextView: string = 'dashboard') => {
    const newEst: Estimate = { ...DEFAULT_ESTIMATE, ...data, id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, estimateNumber: `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`, status: 'DRAFT', taxRate: shopSettings.defaultTaxRate, customer: { ...DEFAULT_ESTIMATE.customer, ...(data.customer || {}) }, vehicle: { ...DEFAULT_ESTIMATE.vehicle, ...(data.vehicle || {}) }, items: data.items || DEFAULT_ESTIMATE.items };
    if (user) {
      try {
        await setDoc(doc(db, 'estimates', newEst.id), newEst);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `estimates/${newEst.id}`);
      }
    } else {
      setEstimates(prev => [newEst, ...prev]);
    }
    setCurrentEstimate(newEst);
    if (nextView === 'diagnosis') { setDiagnosisJobId(newEst.id); setCurrentView('diagnosis'); }
    else if (nextView === 'create') { setViewMode('QUOTATION'); setCurrentView('create'); }
    else if (nextView === 'tracking') { setCurrentView('tracking'); }
    else setCurrentView('dashboard');
  };

  const handleUpdateJobStage = async (est: Estimate, newStage: RepairStage) => {
    const updatedEst: Estimate = { ...est, repairStage: newStage, timeline: [ ...(est.timeline || []), { date: new Date().toISOString(), action: `Moved to ${newStage}` } ] };
    if (user) {
      try {
        await setDoc(doc(db, 'estimates', est.id), updatedEst);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `estimates/${est.id}`);
      }
    } else {
      setEstimates(prev => prev.map(p => p.id === est.id ? updatedEst : p));
    }
  };

  const handleUpdateInventory = async (newItems: InventoryItem[]) => {
    if (user) {
      try {
        // Find deleted items
        const deletedItems = inventoryItems.filter(oldItem => !newItems.find(newItem => newItem.id === oldItem.id));
        for (const item of deletedItems) {
          await deleteDoc(doc(db, 'inventoryItems', item.id));
        }
        // Update/Add items
        for (const item of newItems) {
          await setDoc(doc(db, 'inventoryItems', item.id), item);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'inventoryItems');
      }
    }
    setInventoryItems(newItems);
  };

  const handleSaveEmployee = async (emp: Employee) => {
    if (user) {
      try {
        await setDoc(doc(db, 'employees', emp.id), emp);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `employees/${emp.id}`);
      }
    }
    setEmployees(prev => { const index = prev.findIndex(e => e.id === emp.id); if (index >= 0) { const updated = [...prev]; updated[index] = emp; return updated; } return [...prev, emp]; }); 
  };
  const handleDeleteEmployee = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
      }
    }
    setEmployees(prev => prev.filter(e => e.id !== id));
  };
  const handleSwitchUser = (user: Employee) => { 
    setCurrentUser(user); 
    setCurrentView(user.role === UserRole.MECHANIC ? 'mechanic_app' : 'dashboard'); 
    setIsSidebarOpen(false); 
    alert(`สลับผู้ใช้งานเป็น: ${user.name} (${user.role})`); 
  };
  const handleUpdateCustomer = async (phone: string, newData: Customer) => { 
    const affectedEstimates = estimates.filter(est => est.customer?.phone === phone);
    if (user) {
      try {
        for (const est of affectedEstimates) {
          await updateDoc(doc(db, 'estimates', est.id), { customer: { ...(est.customer || {}), ...newData } });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'estimates/customer');
      }
    }
    setEstimates(prev => prev.map(est => est.customer?.phone === phone ? { ...est, customer: { ...(est.customer || {}), ...newData } as Customer } : est)); 
  };
  
  const handleViewNotificationRelated = (type: string, id: string) => {
    if (type === 'ESTIMATE') {
      const est = estimates.find(e => e.id === id);
      if (est) {
        handleEditEstimate(est);
        setShowNotifications(false);
      }
    }
  };

  const startTutorial = () => { setIsTutorialActive(true); setCurrentTutorialStep(0); setIsSidebarOpen(false); };
  const nextTutorialStep = () => { if (currentTutorialStep < TUTORIAL_STEPS.length - 1) setCurrentTutorialStep(prev => prev + 1); else setIsTutorialActive(false); };
  const prevTutorialStep = () => { if (currentTutorialStep > 0) setCurrentTutorialStep(prev => prev - 1); };
  const endTutorial = () => setIsTutorialActive(false);

  // Fix: undefined variable 'shopPhone' by using 'shopSettings.phone'
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-bold">กำลังโหลดระบบ...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg rotate-3">
            <Car size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">AutoQuote AI</h1>
          <p className="text-slate-500 mb-8">ระบบจัดการอู่ซ่อมรถอัจฉริยะ</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-95"
          >
            <LogIn size={20} />
            เข้าสู่ระบบด้วย Google
          </button>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">© 2024 AutoQuote AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isCustomerMode) return <CustomerPortal estimates={estimates} shopName={shopSettings.name} shopPhone={shopSettings.phone} />;

  const openJobs = estimates.filter(e => e.status === 'DRAFT' || e.status === 'APPROVED');

  const handleExportData = () => {
    const data = {
      estimates,
      inventoryItems,
      employees,
      shopSettings,
      purchaseOrders,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autofix-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('ส่งออกข้อมูลสำรองเรียบร้อยแล้ว');
  };

  const handleImportData = async (data: any) => {
    if (!confirm('การนำเข้าข้อมูลจะเขียนทับข้อมูลเดิมบางส่วน คุณแน่ใจหรือไม่?')) return;

    try {
      if (typeof data !== 'object' || !data) throw new Error('Invalid data format');

      if (user) {
        if (data.shopSettings) {
          await setDoc(doc(db, 'settings', 'shop'), data.shopSettings);
        }
        if (Array.isArray(data.inventoryItems)) {
          for (const item of data.inventoryItems) {
            await setDoc(doc(db, 'inventoryItems', item.id), item);
          }
        }
        if (Array.isArray(data.employees)) {
          for (const emp of data.employees) {
            await setDoc(doc(db, 'employees', emp.id), emp);
          }
        }
        if (Array.isArray(data.estimates)) {
          for (const est of data.estimates) {
            await setDoc(doc(db, 'estimates', est.id), est);
          }
        }
        if (Array.isArray(data.purchaseOrders)) {
          for (const po of data.purchaseOrders) {
            await setDoc(doc(db, 'purchaseOrders', po.id), po);
          }
        }
      } else {
        if (data.shopSettings) setShopSettings(data.shopSettings);
        if (Array.isArray(data.inventoryItems)) setInventoryItems(data.inventoryItems);
        if (Array.isArray(data.employees)) setEmployees(data.employees);
        if (Array.isArray(data.estimates)) setEstimates(data.estimates);
        if (Array.isArray(data.purchaseOrders)) setPurchaseOrders(data.purchaseOrders);
      }
      
      alert('นำเข้าข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Import error:', error);
      alert('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const hasPermission = (permission: Permission) => {
    const permissions = ROLE_PERMISSIONS[currentUser.role];
    return permissions.includes(permission);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard estimates={estimates} onCreateNew={handleCreateNew} onEdit={handleEditEstimate} onPrintJobCard={handlePrintJobCard} onNavigate={setCurrentView} />;
      case 'reception': return <CustomerReception onCheckInComplete={handleCheckInComplete} />;
      case 'tracking': return <JobTracking estimates={estimates} onUpdateStage={handleUpdateJobStage} onViewJob={handleEditEstimate} onPrintJobCard={handlePrintJobCard} />;
      case 'workload': return <MechanicWorkload estimates={estimates} employees={employees} onViewJob={handleEditEstimate} />;
      case 'customers': return <CustomerManagement estimates={estimates} onUpdateCustomer={handleUpdateCustomer} onViewJob={handleEditEstimate} />;
      case 'create': return (
        <EstimateForm 
          initialEstimate={currentEstimate} 
          onSave={handleSaveEstimate} 
          onPreview={(est) => { 
            handleSaveEstimate(est, true); // Save details first silently
            setCurrentEstimate(est);
            setViewMode('QUOTATION'); 
            setCurrentView('preview'); 
          }} 
          onPrintJobCard={handlePrintJobCard} 
          addedItems={pendingItems} 
          clearAddedItems={() => setPendingItems([])} 
          shopSettings={shopSettings} 
          inventoryItems={inventoryItems} 
        />
      );
      case 'preview': return <EstimatePreview estimate={currentEstimate} shopSettings={shopSettings} onBack={() => setCurrentView(viewMode === 'RECEIPT' ? 'receipts' : 'create')} documentType={viewMode as any} />;
      case 'job_card_preview': return <JobCardPreview estimate={currentEstimate} shopSettings={shopSettings} onBack={() => setCurrentView('tracking')} />;
      case 'receipts': return <ReceiptsList estimates={estimates} onViewReceipt={handleViewReceipt} onConvert={handleConvertToReceipt} />;
      case 'inventory': return (
        <Inventory 
            items={inventoryItems} 
            onUpdateItems={handleUpdateInventory} 
            procurementRequests={procurementRequests} 
            purchaseOrders={purchaseOrders} 
            onCreatePO={handleCreatePurchaseOrder} 
            onReceivePO={handleReceivePurchaseOrder} 
            onReceivePOItem={handleReceivePOItem}
            onViewPO={handleViewPO} 
            estimates={estimates} 
            onEditJob={handleEditEstimate} 
        />
      );
      case 'po_preview': return currentPO ? <PurchaseOrderPreview purchaseOrder={currentPO} shopSettings={shopSettings} onBack={() => setCurrentView('inventory')} /> : <Inventory items={inventoryItems} onUpdateItems={handleUpdateInventory} />;
      case 'diagnosis': return <AiDiagnosis onSaveDiagnosis={handleSaveDiagnosis} openJobs={openJobs} initialJobId={diagnosisJobId} onNavigateToEstimate={handleNavigateToEstimate} />;
      case 'mechanic_dashboard': return <MechanicDashboard estimates={estimates} currentUser={currentUser} />;
      case 'mechanic_app': return <MechanicApp estimates={estimates} currentUser={currentUser} onSaveEstimate={handleSaveEstimate} />;
      case 'support':
      case 'settings': return (
        <Settings 
          settings={shopSettings} 
          onSave={handleSaveSettings} 
          employees={employees}
          onSaveEmployee={handleSaveEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          currentUserRole={currentUser?.role || UserRole.STAFF}
          onAddPartToEstimate={handleAddPartFromSearch}
          onExportData={handleExportData}
          onImportData={handleImportData}
          inventoryItems={inventoryItems}
          defaultTab={currentView === 'support' ? 'SUPPORT' : 'GENERAL'}
          remoteSupportEnabled={remoteSupportEnabled}
          setRemoteSupportEnabled={setRemoteSupportEnabled}
        />
      );
      default: return <Dashboard estimates={estimates} onCreateNew={handleCreateNew} onEdit={handleEditEstimate} onPrintJobCard={handlePrintJobCard} onNavigate={setCurrentView} />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Car className="w-10 h-10 text-brand-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AutoQuote AI</h1>
          <p className="text-slate-500 mb-8">ระบบจัดการใบเสนอราคาและงานซ่อมรถยนต์อัจฉริยะ</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            เข้าสู่ระบบด้วย Google
          </button>
          
          <p className="mt-8 text-xs text-slate-400">
            เฉพาะเจ้าหน้าที่และช่างเทคนิคที่ได้รับอนุญาตเท่านั้น
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TutorialOverlay active={isTutorialActive} steps={TUTORIAL_STEPS} currentStepIndex={currentTutorialStep} onNext={nextTutorialStep} onPrev={prevTutorialStep} onClose={endTutorial} />
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} currentUser={currentUser} availableUsers={employees} onSwitchUser={handleSwitchUser} allowSwitchUser={!isTutorialActive} onStartTutorial={startTutorial} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Desktop Header with Notifications */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 flex-shrink-0 z-40">
          <div className="flex items-center gap-4">
             <h2 className="font-bold text-slate-800 text-lg">
                {currentView === 'dashboard' && 'แดชบอร์ด'}
                {currentView === 'reception' && 'ลงทะเบียนลูกค้า'}
                {currentView === 'tracking' && 'ติดตามงานซ่อม'}
                {currentView === 'customers' && 'จัดการลูกค้า'}
                {currentView === 'create' && 'ใบเสนอราคา'}
                {currentView === 'inventory' && 'คลังอะไหล่'}
                {currentView === 'receipts' && 'ประวัติใบเสร็จ'}
                {currentView === 'diagnosis' && 'วิเคราะห์อาการด้วย AI'}
                {currentView === 'mechanic_dashboard' && 'แดชบอร์ดช่างเทคนิค'}
                {currentView === 'mechanic_app' && 'แอปช่างซ่อม (My Jobs)'}
                {currentView === 'support' && 'ช่วยเหลือระยะไกล (Remote Support)'}
                {currentView === 'settings' && 'ตั้งค่า'}
             </h2>
          </div>
          <div className="flex items-center gap-6">
             {remoteSupportEnabled && (
               <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 animate-pulse">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span className="text-[10px] font-bold uppercase tracking-wider">Remote Support Active</span>
               </div>
             )}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationCenter 
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClearAll={clearNotifications}
                    onClose={() => setShowNotifications(false)}
                    onViewRelated={handleViewNotificationRelated}
                  />
                )}
             </div>
             <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                <div className="text-right">
                   <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
                   <p className="text-xs text-slate-500">{currentUser?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold shadow-md">
                   {currentUser?.name?.charAt(0)}
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogIn size={18} className="rotate-180" />
                </button>
             </div>
          </div>
        </header>

        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2"><Menu size={24} /></button>
            <span className="font-bold text-slate-800 ml-2">AutoQuote AI</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationCenter 
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClearAll={clearNotifications}
                    onClose={() => setShowNotifications(false)}
                    onViewRelated={handleViewNotificationRelated}
                  />
                )}
             </div>
             <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs">{currentUser?.name?.charAt(0) || '?'}</div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth">{renderContent()}</div>
      </main>
    </div>
    </ErrorBoundary>
  );
};

export default App;

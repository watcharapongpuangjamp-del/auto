import { TutorialStep } from "../types";

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: 'sidebar-container',
    title: 'ยินดีต้อนรับสู่ AutoQuote AI',
    content: 'ระบบจัดการอู่ซ่อมรถอัจฉริยะ นี่คือเมนูหลักสำหรับเข้าถึงฟีเจอร์ต่างๆ ของระบบ',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'nav-dashboard',
    title: 'ภาพรวม (Dashboard)',
    content: 'หน้าแรกสำหรับดูสรุปยอดขาย งานที่ค้างอยู่ และประสิทธิภาพการทำงานของช่าง',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'stat-revenue',
    title: 'รายงานรายได้',
    content: 'แสดงรายได้รวมในเดือนปัจจุบัน เปรียบเทียบกับต้นทุนเพื่อให้เห็นกำไรที่แท้จริง',
    position: 'bottom',
    view: 'dashboard'
  },
  {
    targetId: 'btn-create-new',
    title: 'สร้างใบเสนอราคาด่วน',
    content: 'คลิกที่นี่เพื่อเริ่มสร้างใบเสนอราคาใหม่ หรือเปิดใบงานซ่อมรับรถ',
    position: 'left',
    view: 'dashboard'
  },
  {
    targetId: 'nav-reception',
    title: 'รับรถลูกค้า (Reception)',
    content: 'เมนูสำหรับรับรถเข้าซ่อม บันทึกอาการ เช็คสภาพรถ และระดับน้ำมัน',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'nav-inventory',
    title: 'คลังอะไหล่ (Inventory)',
    content: 'จัดการสต็อคอะไหล่ ตั้งจุดสั่งซื้อซ้ำ (Reorder Point) และออกใบสั่งซื้อ (PO)',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'inventory-tab-requests',
    title: 'รายการขอซื้อ (Requests)',
    content: 'เมื่ออะไหล่หมด หรือต้องสั่งของเพิ่มสำหรับงานซ่อม รายการขอซื้อจะมารวมอยู่ที่นี่เพื่อรออนุมัติ PO',
    position: 'bottom',
    view: 'inventory'
  },
  {
    targetId: 'nav-diagnosis',
    title: 'AI วิเคราะห์อาการ',
    content: 'ใช้ AI ช่วยวิเคราะห์ปัญหาจากอาการที่ลูกค้าบอก หรือใช้ร่วมกับเครื่องสแกน OBD2 เพื่อความแม่นยำ',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'nav-parts',
    title: 'เช็คราคาอะไหล่',
    content: 'ค้นหาราคาอะไหล่และ Part Number แท้จาก Google Search ได้ทันที',
    position: 'right',
    view: 'dashboard'
  },
  {
    targetId: 'btn-help',
    title: 'ช่วยเหลือ',
    content: 'หากต้องการดูคำแนะนำนี้อีกครั้ง สามารถกดปุ่มนี้ได้เสมอครับ',
    position: 'right',
    view: 'dashboard'
  }
];

import React, { useState } from 'react';
import { Employee, UserRole } from '../types';
import { Users, Plus, Search, Trash2, Edit2, Shield, Wrench, User, Phone, Briefcase, Lock } from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onDelete: (id: string) => void;
  currentUserRole: string;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onSave, onDelete, currentUserRole }) => {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = currentUserRole === 'ADMIN';

  const initialForm: Employee = {
    id: '',
    name: '',
    position: '',
    role: UserRole.MECHANIC,
    phone: '',
    status: 'ACTIVE',
    salary: 0,
    joinedDate: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState<Employee>(initialForm);

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(query.toLowerCase()) || 
    (emp.position || '').toLowerCase().includes(query.toLowerCase()) ||
    (emp.phone || '').includes(query)
  );

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setFormData({ ...initialForm, id: `emp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` });
    setEditingId(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('ต้องการลบพนักงานคนนี้ใช่หรือไม่? (Delete this employee?)')) {
      onDelete(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ (Name and Phone required)');
      return;
    }
    onSave(formData);
    setShowModal(false);
  };

  const getRoleIcon = (role?: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return <Shield size={16} className="text-purple-600" />;
      case UserRole.MECHANIC: return <Wrench size={16} className="text-blue-600" />;
      default: return <User size={16} className="text-slate-600" />;
    }
  };

  const getStatusColor = (status?: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-brand-600" />
            จัดการพนักงาน (Employees)
          </h2>
          <p className="text-sm text-slate-500">
            รายชื่อพนักงาน ตำแหน่ง และสถานะการทำงาน
            {!isAdmin && <span className="ml-2 inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs font-bold"><Lock size={10} /> View Only</span>}
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleCreate}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 font-medium"
          >
            <Plus size={18} /> เพิ่มพนักงาน (Add)
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">พนักงานทั้งหมด (Total)</p>
            <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">ช่างเทคนิค (Mechanics)</p>
            <p className="text-2xl font-bold text-brand-600">
              {employees.filter(e => e.role === UserRole.MECHANIC).length}
            </p>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-lg"><Wrench size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">ทำงานอยู่ (Active)</p>
            <p className="text-2xl font-bold text-green-600">
              {employees.filter(e => e.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><User size={20} /></div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ค้นหาชื่อ, ตำแหน่ง หรือ เบอร์โทร..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white shadow-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3">ชื่อ-นามสกุล (Name)</th>
                <th className="px-6 py-3">ตำแหน่ง (Position)</th>
                <th className="px-6 py-3">เบอร์โทร (Phone)</th>
                <th className="px-6 py-3 text-center">สถานะ (Status)</th>
                {isAdmin && <th className="px-6 py-3 text-right">จัดการ (Actions)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูลพนักงาน (No employees found)
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                          ${emp.role === UserRole.ADMIN ? 'bg-purple-500' : emp.role === UserRole.MECHANIC ? 'bg-blue-500' : 'bg-slate-500'}
                        `}>
                          {emp.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{emp.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            {getRoleIcon(emp.role)} {emp.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="flex items-center gap-2 text-slate-600">
                         <Briefcase size={14} /> {emp.position}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-slate-600 font-mono">
                        <Phone size={14} /> {emp.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-6 text-slate-800 border-b pb-2">
              {editingId ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อ-นามสกุล (Name) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="ชื่อพนักงาน..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ตำแหน่ง (Position)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  placeholder="e.g. หัวหน้าช่าง, ช่างเครื่องยนต์"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">เบอร์โทร (Phone) <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">เงินเดือน (Salary)</label>
                   <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold"
                    value={formData.salary || ''}
                    onChange={e => setFormData({...formData, salary: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">บทบาท (Role)</label>
                   <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                   >
                     <option value={UserRole.MECHANIC}>ช่าง (Mechanic)</option>
                     <option value={UserRole.STAFF}>พนักงาน (Staff)</option>
                     <option value={UserRole.ADMIN}>ผู้ดูแล (Admin)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">สถานะ (Status)</label>
                   <select 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-white"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                   >
                     <option value="ACTIVE">Active</option>
                     <option value="INACTIVE">Inactive</option>
                   </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all"
                >
                  ยกเลิก (Cancel)
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 text-sm font-bold shadow-sm hover:shadow-md transition-all"
                >
                  บันทึก (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

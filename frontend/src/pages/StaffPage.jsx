import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember
} from '../services/api';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Briefcase,
  Phone,
  Mail,
  Clock,
  Trash2,
  Edit,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function StaffPage() {
  const { token, user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: '',
    fullName: '',
    roleSpecialty: 'Flexo Printing Specialist',
    department: 'Plant Operations',
    contactNumber: '+94 77 123 4567',
    email: '',
    shift: 'Day Shift (08:00 - 16:30)',
    status: 'Active'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await fetchStaffMembers();
      setStaffList(data || []);
    } catch (e) {
      console.error('Failed to load staff:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setForm({
      employeeId: `EMP-${1000 + staffList.length + 1}`,
      fullName: '',
      roleSpecialty: 'Flexo Printing Specialist',
      department: 'Plant Operations',
      contactNumber: '+94 77 123 4567',
      email: '',
      shift: 'Day Shift (08:00 - 16:30)',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (staff) => {
    setEditingStaff(staff);
    setForm({
      employeeId: staff.employeeId || '',
      fullName: staff.fullName || '',
      roleSpecialty: staff.roleSpecialty || 'Flexo Printing Specialist',
      department: staff.department || 'Plant Operations',
      contactNumber: staff.contactNumber || '',
      email: staff.email || '',
      shift: staff.shift || 'Day Shift (08:00 - 16:30)',
      status: staff.status || 'Active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingStaff) {
        await updateStaffMember(editingStaff.id, form, token);
        showNotification(`Staff Member "${form.fullName}" Updated Successfully!`);
      } else {
        await createStaffMember(form, token);
        showNotification(`New Staff Member "${form.fullName}" Registered Successfully!`);
      }
      setShowModal(false);
      loadStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${staff.fullName}" (${staff.employeeId})?`)) return;
    try {
      await deleteStaffMember(staff.id, token);
      showNotification(`Staff Member "${staff.fullName}" Removed.`);
      loadStaff();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStaff = staffList.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.employeeId?.toLowerCase().includes(q) ||
      s.roleSpecialty?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.contactNumber?.includes(q) ||
      s.shift?.toLowerCase().includes(q)
    );
  });

  const activeStaffCount = staffList.filter(s => s.status === 'Active' || s.status === 'On Duty').length;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Header Banner */}
        <div className="card-rounded" style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#FFFFFF',
          borderRadius: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              <UserCheck size={15} />
              <span>Plant Workforce Management</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={26} />
              <span>Plant Staff Member Directory & Registration</span>
            </h1>
          </div>

          <button onClick={handleOpenAddModal} className="btn-primary" style={{ padding: '0.75rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem', backgroundColor: '#FFFFFF', color: '#047857', fontWeight: '800', fontSize: '0.875rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <UserPlus size={18} /> Register New Staff Member
          </button>
        </div>

        {toastMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Total Plant Staff</span>
              <Users size={20} style={{ color: '#059669' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{staffList.length}</div>
            <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '0.2rem' }}>Registered team members</div>
          </div>

          <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Active Staff Members</span>
              <UserCheck size={20} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>{activeStaffCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.2rem' }}>Available for order assignment</div>
          </div>

          <div className="card-rounded" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Specialized Roles</span>
              <Award size={20} style={{ color: '#D97706' }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginTop: '0.5rem' }}>
              {new Set(staffList.map(s => s.roleSpecialty)).size}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.2rem' }}>Printing, Die-Cutting, QA, Assembly</div>
          </div>
        </div>

        {/* Staff Table Section */}
        <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={20} style={{ color: '#059669' }} />
                <span>Registered Staff Members Directory ({filteredStaff.length})</span>
              </h3>

            </div>

            <div style={{ position: 'relative', minWidth: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search staff name, ID, specialty, shift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>Loading staff members...</div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '1rem', border: '1px dashed #CBD5E1' }}>
              <Users size={40} style={{ color: '#94A3B8', marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.35rem 0', color: '#0F172A' }}>No staff members found</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                {searchQuery ? `No staff records match "${searchQuery}"` : 'Click "Register New Staff Member" to add plant staff.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Employee ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Staff Name & Contact</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Specialty Role</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Department & Shift</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#0F4C81' }}>
                        {staff.employeeId}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A' }}>{staff.fullName}</div>
                        <div style={{ fontSize: '0.775rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                          <span><Phone size={12} style={{ display: 'inline' }} /> {staff.contactNumber}</span>
                          {staff.email && <span>&bull; <Mail size={12} style={{ display: 'inline' }} /> {staff.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.4rem', backgroundColor: '#ECFDF5', color: '#047857', fontWeight: '700', fontSize: '0.8rem', border: '1px solid #A7F3D0' }}>
                          {staff.roleSpecialty}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>{staff.department}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                          <Clock size={12} style={{ color: '#D97706' }} />
                          <span>{staff.shift}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.65rem',
                          borderRadius: '99px',
                          backgroundColor: staff.status === 'Active' || staff.status === 'On Duty' ? '#D1FAE5' : '#FEF3C7',
                          color: staff.status === 'Active' || staff.status === 'On Duty' ? '#065F46' : '#D97706',
                          fontSize: '0.75rem',
                          fontWeight: '800'
                        }}>
                          {staff.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            style={{ padding: '0.4rem 0.65rem', borderRadius: '0.4rem', backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', fontWeight: '700', fontSize: '0.775rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            style={{ padding: '0.4rem 0.65rem', borderRadius: '0.4rem', backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: '700', fontSize: '0.775rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: REGISTER / EDIT STAFF MEMBER */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '540px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} style={{ color: '#059669' }} />
                  <span>{editingStaff ? 'Edit Staff Member Record' : 'Register New Staff Member'}</span>
                </h3>
                <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                    Employee ID Code
                  </label>
                  <input
                    required
                    type="text"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    placeholder="e.g. EMP-1006"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '700', color: '#0F4C81' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                    Staff Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Priyantha Jayawardena"
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Contact Number
                    </label>
                    <input
                      required
                      type="text"
                      value={form.contactNumber}
                      onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                      placeholder="+94 77 123 4567"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="staff@packflow.com"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                    Specialty / Role Category
                  </label>
                  <select
                    value={form.roleSpecialty}
                    onChange={(e) => setForm({ ...form, roleSpecialty: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.875rem', fontWeight: '600', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="Flexo Printing Specialist">Flexo Printing Specialist</option>
                    <option value="Die-Cutting Lead">Die-Cutting Lead</option>
                    <option value="Quality Assurance Inspector">Quality Assurance Inspector</option>
                    <option value="Assembly & Folding Lead">Assembly & Folding Lead</option>
                    <option value="Packaging Machine Operator">Packaging Machine Operator</option>
                    <option value="Pre-Press Operator">Pre-Press Operator</option>
                    <option value="Plant Maintenance Technician">Plant Maintenance Technician</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Plant Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Plant Operations">Plant Operations</option>
                      <option value="Pre-Press & Printing">Pre-Press & Printing</option>
                      <option value="Pre-Press & Die-Cutting">Pre-Press & Die-Cutting</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Packaging Assembly">Packaging Assembly</option>
                      <option value="Final Packaging">Final Packaging</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                      Assigned Shift
                    </label>
                    <select
                      value={form.shift}
                      onChange={(e) => setForm({ ...form, shift: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#FFFFFF' }}
                    >
                      <option value="Day Shift (08:00 - 16:30)">Day Shift (08:00 - 16:30)</option>
                      <option value="Night Shift (16:30 - 01:00)">Night Shift (16:30 - 01:00)</option>
                      <option value="Rotational Shift">Rotational Shift</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9', fontWeight: '600' }}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1.5, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <UserPlus size={16} />
                    {submitting ? 'Saving...' : editingStaff ? 'Update Staff Member' : 'Register Staff Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

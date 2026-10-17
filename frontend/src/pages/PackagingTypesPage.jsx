import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  fetchPackagingTypes,
  createPackagingType,
  updatePackagingType,
  deletePackagingType
} from '../services/api';
import {
  Layers,
  Ruler,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function PackagingTypesPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('system administrator');

  const [packagingTypes, setPackagingTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Packaging Type Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({
    typeName: '',
    description: '',
    minWidthMm: 100,
    maxWidthMm: 1200,
    minHeightMm: 100,
    maxHeightMm: 800,
    minDepthMm: 50,
    maxDepthMm: 600,
    maxWeightCapacityKg: 25.0,
    supportedMaterials: 'Kraft Flute, Paperboard, Greyboard',
    baseUnitPrice: 150.0,
    status: 'Active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPackagingTypes();
      setPackagingTypes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTypeAdd = () => {
    setEditingType(null);
    setTypeForm({
      typeName: '',
      description: '',
      minWidthMm: 100,
      maxWidthMm: 1200,
      minHeightMm: 100,
      maxHeightMm: 800,
      minDepthMm: 50,
      maxDepthMm: 600,
      maxWeightCapacityKg: 25.0,
      supportedMaterials: 'Kraft Flute, Paperboard, Greyboard',
      baseUnitPrice: 150.0,
      status: 'Active'
    });
    setShowTypeModal(true);
  };

  const handleOpenTypeEdit = (typeObj) => {
    setEditingType(typeObj);
    setTypeForm({
      typeName: typeObj.typeName || '',
      description: typeObj.description || '',
      minWidthMm: typeObj.minWidthMm || 100,
      maxWidthMm: typeObj.maxWidthMm || 1000,
      minHeightMm: typeObj.minHeightMm || 100,
      maxHeightMm: typeObj.maxHeightMm || 800,
      minDepthMm: typeObj.minDepthMm || 50,
      maxDepthMm: typeObj.maxDepthMm || 500,
      maxWeightCapacityKg: typeObj.maxWeightCapacityKg || 10.0,
      supportedMaterials: typeObj.supportedMaterials || '',
      baseUnitPrice: typeObj.baseUnitPrice || 150.0,
      status: typeObj.status || 'Active'
    });
    setShowTypeModal(true);
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await updatePackagingType(editingType.id, typeForm, token);
        showNotification(`Packaging Type "${typeForm.typeName}" updated successfully!`);
      } else {
        await createPackagingType(typeForm, token);
        showNotification(`Created Packaging Type "${typeForm.typeName}"!`);
      }
      setShowTypeModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteType = async (id, name) => {
    if (!window.confirm(`Archive packaging type "${name}"?`)) return;
    try {
      await deletePackagingType(id, token);
      showNotification(`Archived packaging type "${name}".`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Header Banner */}
        <div className="card-rounded" style={{
          padding: '1.75rem',
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Ruler size={26} />
              <span>Packaging Types & Dimension Constraints Module</span>
            </h1>
          </div>

          {isAdmin && (
            <button onClick={handleOpenTypeAdd} className="btn-secondary" style={{ padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '0.65rem', backgroundColor: '#FFFFFF', color: '#047857', fontWeight: '700', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Packaging Type
            </button>
          )}
        </div>

        {toastMsg && (
          <div style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem', backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', color: '#065F46', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content Table */}
        <div className="card-rounded" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading packaging types & dimension rules...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Type Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Allowed Length (mm)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Allowed Width (mm)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Allowed Depth/Height (mm)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Base Unit Price (LKR)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Max Weight (kg)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Supported Substrates</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    {isAdmin && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {packagingTypes.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '0.95rem' }}>{t.typeName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.description}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>
                        {t.minWidthMm} - {t.maxWidthMm} mm
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>
                        {t.minHeightMm} - {t.maxHeightMm} mm
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#0F4C81' }}>
                        {t.minDepthMm} - {t.maxDepthMm} mm
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#D97706' }}>
                        LKR {(t.baseUnitPrice || 150.0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#059669' }}>
                        {t.maxWeightCapacityKg} kg
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                        {t.supportedMaterials}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '99px', backgroundColor: t.status === 'Active' ? '#D1FAE5' : '#F3F4F6', color: t.status === 'Active' ? '#059669' : '#6B7280', fontSize: '0.775rem', fontWeight: '700' }}>
                          {t.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button onClick={() => handleOpenTypeEdit(t)} style={{ padding: '0.35rem 0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F4C81', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                              <Edit size={14} /> Edit Constraints
                            </button>
                            <button onClick={() => handleDeleteType(t.id, t.typeName)} style={{ padding: '0.35rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #FECDD3', backgroundColor: '#FFF1F2', color: '#E11D48', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showTypeModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="card-rounded" style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '1.25rem', width: '100%', maxWidth: '580px', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
                {editingType ? 'Edit Packaging Type & Dimension Constraints' : 'Add New Packaging Type & Dimension Constraints'}
              </h3>
              <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Packaging Type Name</label>
                  <input required type="text" placeholder="e.g. Custom Mailer Box" value={typeForm.typeName} onChange={(e) => setTypeForm({ ...typeForm, typeName: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Description</label>
                  <input type="text" placeholder="Brief description of packaging application" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '0.75rem', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0F4C81', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Ruler size={16} /> Dimension Constraint Boundaries (mm)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Min Length (mm)</label>
                      <input type="number" value={typeForm.minWidthMm} onChange={(e) => setTypeForm({ ...typeForm, minWidthMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Max Length (mm)</label>
                      <input type="number" value={typeForm.maxWidthMm} onChange={(e) => setTypeForm({ ...typeForm, maxWidthMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Min Width (mm)</label>
                      <input type="number" value={typeForm.minHeightMm} onChange={(e) => setTypeForm({ ...typeForm, minHeightMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Max Width (mm)</label>
                      <input type="number" value={typeForm.maxHeightMm} onChange={(e) => setTypeForm({ ...typeForm, maxHeightMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Min Height (mm)</label>
                      <input type="number" value={typeForm.minDepthMm} onChange={(e) => setTypeForm({ ...typeForm, minDepthMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.775rem', fontWeight: '600', color: '#475569' }}>Max Height (mm)</label>
                      <input type="number" value={typeForm.maxDepthMm} onChange={(e) => setTypeForm({ ...typeForm, maxDepthMm: Number(e.target.value) })} style={{ width: '100%', padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#D97706' }}>Base Unit Price (LKR)</label>
                  <input required type="number" step="0.01" value={typeForm.baseUnitPrice} onChange={(e) => setTypeForm({ ...typeForm, baseUnitPrice: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', fontWeight: '700' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Max Weight Capacity (kg)</label>
                  <input type="number" step="0.1" value={typeForm.maxWeightCapacityKg} onChange={(e) => setTypeForm({ ...typeForm, maxWeightCapacityKg: Number(e.target.value) })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Supported Materials (comma-separated)</label>
                  <input type="text" value={typeForm.supportedMaterials} onChange={(e) => setTypeForm({ ...typeForm, supportedMaterials: e.target.value })} style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowTypeModal(false)} style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #CBD5E1', background: '#F1F5F9' }}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: '0.5rem', backgroundColor: '#059669' }}>
                    {editingType ? 'Update Constraints' : 'Save Packaging Type'}
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

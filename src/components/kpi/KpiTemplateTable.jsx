"use client";

import React, { useState, useEffect, useMemo } from 'react';
import apiService from '@/app/lib/apiService';
import { toast } from 'react-hot-toast';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(8)].map((_, i) => (
      <td key={i} className="p-4 border-t border-gray-200">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    ))}
  </tr>
);

const KPITemplatesTable = ({ kpiTemplates = [], loading, setKpiTemplates }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: 0,
    target_type: 'numeric',
    target_value: { value: 0 },
    active: true,
  });

  // Assignment Modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentTemplate, setAssignmentTemplate] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    roles: [],
    departments: [],
  });

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const itemsPerPage = 10;

  // Load Departments
  useEffect(() => {
    (async () => {
      try {
        const deps = await apiService.getDepartments();
        setDepartments(deps);
      } catch (e) {
        toast.error('Failed to load departments');
      }
    })();
  }, []);


  const normalizedTemplates = useMemo(() => {
  return kpiTemplates.map(t => ({
    kpi_id: t.kpi_id,
    title: t.kpi_title || t.title || 'Untitled',  // ← Use kpi_title first
    description: t.description || 'No description',
    weight: t.weight ?? 0,
    target_type: t.target_type || 'numeric',
    target_value: t.target_value || { value: 0 },
    active: t.active !== false,
    assigned_departments: Array.isArray(t.assigned_departments) ? t.assigned_departments.filter(Boolean) : [],
    assigned_roles: Array.isArray(t.assigned_roles) ? t.assigned_roles.filter(Boolean) : [],
  }));
}, [kpiTemplates]);

  // Filter & Paginate
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return normalizedTemplates;
    const q = searchQuery.toLowerCase();
    return normalizedTemplates.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.assigned_departments.some(d => d.toLowerCase().includes(q)) ||
      t.assigned_roles.some(r => r.toLowerCase().includes(q))
    );
  }, [normalizedTemplates, searchQuery]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const currentItems = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => setCurrentPage(page);
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Open Modals
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      description: '',
      weight: 0,
      target_type: 'numeric',
      target_value: { value: 0 },
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (template) => {
    setModalMode('edit');
    setSelectedTemplate(template);
    setFormData({
      title: template.title,
      description: template.description,
      weight: template.weight,
      target_type: template.target_type,
      target_value: template.target_value,
      active: template.active,
    });
    setShowModal(true);
  };

  const openAssignmentModal = (template) => {
    setAssignmentTemplate(template);
    setAssignmentForm({
      roles: template.assigned_roles || [],
      departments: template.assigned_departments.map(name =>
        departments.find(d => d.name === name)?.id
      ).filter(Boolean),
    });
    setShowAssignmentModal(true);
  };

  // Form Change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'target_type') {
      setFormData(prev => ({
        ...prev,
        target_type: value,
        target_value:
          value === 'range'
            ? { min: 0, max: 0 }
            : value === 'boolean'
              ? { value: false }
              : { value: value === 'text' ? '' : 0 },
      }));
    } else if (name === 'target_min' || name === 'target_max') {
      setFormData(prev => ({
        ...prev,
        target_value: {
          ...prev.target_value,
          [name === 'target_min' ? 'min' : 'max']: parseFloat(value) || 0,
        },
      }));
    } else if (name === 'target_value') {
      setFormData(prev => ({
        ...prev,
        target_value: {
          value: prev.target_type === 'text' ? value : parseFloat(value) || 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  // Submit Template
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        weight: parseFloat(formData.weight),
        target_type: formData.target_type,
        target_value: formData.target_value,
        active: formData.active,
      };

      if (modalMode === 'create') {
        const newTemplate = await apiService.createKPITemplate(payload);
        setKpiTemplates(prev => [...prev, newTemplate]);
        toast.success('KPI Template created');
      } else {
        await apiService.updateKPITemplate(selectedTemplate.kpi_id, payload);
        setKpiTemplates(prev =>
          prev.map(t => (t.kpi_id === selectedTemplate.kpi_id ? { ...t, ...payload } : t))
        );
        toast.success('KPI Template updated');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Template
  const handleDelete = async (kpi_id) => {
    setIsLoading(true);
    try {
      await apiService.deleteKPITemplate(kpi_id);
      setKpiTemplates(prev => prev.filter(t => t.kpi_id !== kpi_id));
      setDeleteConfirm(null);
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

    // Save Assignments – Optimized: No extra getKPIRoleAssignments unless needed
  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { roles, departments } = assignmentForm;
      const kpi_id = assignmentTemplate.kpi_id;

      // 1. Get current assignments for this KPI only
      const allAssignments = await apiService.getKPIRoleAssignments(); // GET /hr/kpi/role-assignments
      const currentAssignments = allAssignments.filter(a => a.kpi_id === kpi_id);

      // Build lookup maps
      const existingRoleMap = new Map();   // role → assignment
      const existingDeptMap = new Map();   // dept_id → assignment
      currentAssignments.forEach(a => {
        if (a.role) existingRoleMap.set(a.role, a);
        if (a.department_id) existingDeptMap.set(a.department_id, a);
      });

      const newRoles = new Set(roles);
      const newDeptIds = new Set(departments);

      // 2. ROLES: Add missing, delete removed
      for (const role of newRoles) {
        if (!existingRoleMap.has(role)) {
          await apiService.createKPIRoleAssignment({ kpi_id, role });
        }
      }
      for (const [role, assignment] of existingRoleMap) {
        if (!newRoles.has(role)) {
          await apiService.deleteKPIRoleAssignment(assignment.assignment_id);
        }
      }

      // 3. DEPARTMENTS: Add missing, delete removed
      for (const deptId of newDeptIds) {
        if (!existingDeptMap.has(deptId)) {
          await apiService.createKPIRoleAssignment({ kpi_id, department_id: deptId });
        }
      }
      for (const [deptId, assignment] of existingDeptMap) {
        if (!newDeptIds.has(deptId)) {
          await apiService.deleteKPIRoleAssignment(assignment.assignment_id);
        }
      }

      // 4. Refresh templates (includes updated assignments via RPC)
      const refreshed = await apiService.getKPITemplates();
      setKpiTemplates(refreshed.templates || refreshed);

      toast.success('Assignments saved');
      setShowAssignmentModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save assignments');
    } finally {
      setIsLoading(false);
    }
  };

  // Format
  const formatTargetValue = (t) => {
    if (!t.target_value) return 'N/A';
    if (t.target_type === 'range') return `${t.target_value.min} – ${t.target_value.max}`;
    if (t.target_type === 'boolean') return t.target_value.value ? 'Yes' : 'No';
    return t.target_value.value ?? 'N/A';
  };

  const formatAssigned = (items) => items.length > 0 ? items.join(', ') : 'None';

  return (
    <section>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 gap-5 flex-wrap">
        <h2 className="text-xl font-semibold">KPI Templates</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by title, dept, role..."
            value={searchQuery}
            onChange={handleSearch}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
            disabled={isLoading}
          />
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#a07a17] disabled:opacity-50"
            disabled={isLoading}
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left text-sm font-medium text-gray-700">KPI Title</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Weight</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Target</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Assigned Depts</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Assigned Roles</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Active</th>
              <th className="p-4 text-left text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : currentItems.length > 0 ? (
              currentItems.map((t) => (
                <tr key={t.kpi_id} className="hover:bg-gray-50 even:bg-gray-50/30">
                  <td className="p-4 border-t border-gray-200 font-medium">{t.title}</td>
                  <td className="p-4 border-t border-gray-200 text-sm text-gray-600 max-w-xs truncate">
                    {t.description}
                  </td>
                  <td className="p-4 border-t border-gray-200">{t.weight}</td>
                  <td className="p-4 border-t border-gray-200 font-medium">
                    {formatTargetValue(t)}
                  </td>
                  <td className="p-4 border-t border-gray-200 text-sm">
                    {formatAssigned(t.assigned_departments)}
                  </td>
                  <td className="p-4 border-t border-gray-200 text-sm">
                    {formatAssigned(t.assigned_roles)}
                  </td>
                  <td className="p-4 border-t border-gray-200">
                    <span className={`px-2 py-1 text-xs rounded-full ${t.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {t.active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-4 border-t border-gray-200 space-x-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openAssignmentModal(t)}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                      disabled={isLoading}
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(t.kpi_id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500">
                  No KPI templates found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredTemplates.length > itemsPerPage && (
        <div className="flex justify-center mt-6 gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-[#b88b1b] text-white' : 'bg-gray-200'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === 'create' ? 'Create' : 'Edit'} KPI Template
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Title</label>
                <input name="title" value={formData.title} onChange={handleFormChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleFormChange} className="w-full border rounded px-3 py-2" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Weight (0–1)</label>
                  <input type="number" name="weight" step="0.01" min="0" max="1" value={formData.weight} onChange={handleFormChange} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block font-medium mb-1">Active</label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="active" checked={formData.active} onChange={handleFormChange} />
                    <span>Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Target Type</label>
                <select name="target_type" value={formData.target_type} onChange={handleFormChange} className="w-full border rounded px-3 py-2">
                  <option value="numeric">Numeric</option>
                  <option value="percentage">Percentage</option>
                  <option value="boolean">Yes/No</option>
                  <option value="text">Text</option>
                  <option value="range">Range</option>
                </select>
              </div>
              {formData.target_type === 'range' ? (
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" name="target_min" placeholder="Min" value={formData.target_value.min || ''} onChange={handleFormChange} required className="border rounded px-3 py-2" />
                  <input type="number" name="target_max" placeholder="Max" value={formData.target_value.max || ''} onChange={handleFormChange} required className="border rounded px-3 py-2" />
                </div>
              ) : formData.target_type === 'boolean' ? (
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.target_value.value} onChange={(e) => setFormData(prev => ({ ...prev, target_value: { value: e.target.checked } }))} />
                  <span>Value (Checked = Yes)</span>
                </label>
              ) : (
                <input
                  type={formData.target_type === 'text' ? 'text' : 'number'}
                  name="target_value"
                  value={formData.target_value.value || ''}
                  onChange={handleFormChange}
                  required
                  className="w-full border rounded px-3 py-2"
                  placeholder={formData.target_type === 'text' ? 'Text goal' : 'Number'}
                />
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#a07a17] disabled:opacity-50">
                  {isLoading ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && assignmentTemplate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Assign Roles & Departments – {assignmentTemplate.title}
            </h3>
            <form onSubmit={handleSaveAssignments} className="space-y-5">
              <div>
                <label className="block font-medium mb-2">Roles</label>
                <div className="space-y-1">
                  {['user', 'manager', 'hr_manager', 'super_admin'].map(role => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignmentForm.roles.includes(role)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAssignmentForm(prev => ({
                            ...prev,
                            roles: checked
                              ? [...prev.roles, role]
                              : prev.roles.filter(r => r !== role),
                          }));
                        }}
                      />
                      <span className="capitalize">{role.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium mb-2">Departments</label>
                <div className="space-y-1">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={assignmentForm.departments.includes(dept.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAssignmentForm(prev => ({
                            ...prev,
                            departments: checked
                              ? [...prev.departments, dept.id]
                              : prev.departments.filter(id => id !== dept.id),
                          }));
                        }}
                      />
                      <span className="capitalize">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAssignmentModal(false)} className="px-5 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#a07a17] disabled:opacity-50">
                  {isLoading ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="mb-4">Delete this KPI template permanently?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded">
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KPITemplatesTable;
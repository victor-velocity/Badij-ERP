"use client";

import React, { useState, useEffect, useMemo } from 'react';
import apiService from '@/app/lib/apiService';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Skeleton Components
const EmployeeCardSkeleton = () => (
  <div className="border border-gray-300 rounded-lg overflow-hidden animate-pulse">
    <div className="px-5 py-4 bg-gray-50 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div>
          <div className="h-5 bg-gray-300 rounded w-48"></div>
          <div className="h-3 bg-gray-200 rounded w-36 mt-1"></div>
        </div>
      </div>
      <div className="w-5 h-5 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const KPITableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
  </tr>
);

const UpdateModalSkeleton = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-pulse">
      <div className="h-7 bg-gray-300 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
      <div className="space-y-4">
        <div><div className="h-4 bg-gray-200 rounded w-20 mb-2"></div><div className="h-10 bg-gray-200 rounded"></div></div>
        <div><div className="h-4 bg-gray-200 rounded w-28 mb-2"></div><div className="h-10 bg-gray-200 rounded"></div></div>
        <div><div className="h-4 bg-gray-200 rounded w-32 mb-2"></div><div className="h-10 bg-gray-200 rounded"></div></div>
        <div className="flex justify-end gap-3">
          <div className="h-9 bg-gray-200 rounded w-20"></div>
          <div className="h-9 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  </div>
);

const EmployeeKPIAssignmentsTab = () => {
  const [employees, setEmployees] = useState([]);
  const [kpiTemplates, setKpiTemplates] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());

  // UI States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form
  const [updateForm, setUpdateForm] = useState({
    status: '',
    notes: '',
  });

  const ITEMS_PER_PAGE = 10;

  // Load employees + KPI templates
  useEffect(() => {
    (async () => {
      try {
        setIsInitialLoading(true);
        const [empsRes, tmplRes] = await Promise.all([
          apiService.getEmployees(),
          apiService.getKPITemplates(),
        ]);
        setEmployees(empsRes || []);
        setKpiTemplates(tmplRes.templates || tmplRes);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, []);

  // Search & Filter
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(emp =>
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.phone_number && emp.phone_number.includes(q)) ||
      (emp.department && emp.department.name && emp.department.name.toLowerCase().includes(q)) ||
      (emp.role && emp.role.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  // Toggle accordion + lazy-load assignments
  const toggleExpand = async (employeeId) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(employeeId)) {
      newSet.delete(employeeId);
    } else {
      newSet.add(employeeId);
      if (!assignments[employeeId]) {
        try {
          const res = await apiService.getEmployeeKPIAssignmentsById(employeeId);
          setAssignments(prev => ({ ...prev, [employeeId]: res.assignments || [] }));
        } catch {
          toast.error('Failed to load assignments');
        }
      }
    }
    setExpandedEmployees(newSet);
  };

  // Update Modal (HR only sees submitted values & can approve/reject)
  const openUpdateModal = (ass, emp) => {
    setSelectedAssignment(ass);
    setSelectedEmployee(emp);
    setUpdateForm({
      status: ass.status || '',
      notes: ass.notes || '',
    });
    setShowUpdateModal(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateForm.status) return toast.error('Status required');

    try {
      setIsUpdating(true);
      const payload = {
        status: updateForm.status,
        notes: updateForm.notes || null,
      };
      await apiService.submitKPIAssignment(selectedAssignment.id, payload);
      toast.success('KPI status updated');

      const res = await apiService.getEmployeeKPIAssignmentsById(selectedEmployee.id);
      setAssignments(prev => ({ ...prev, [selectedEmployee.id]: res.assignments }));
      setShowUpdateModal(false);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section>
      {/* Search Bar */}
      <div className="mb-7 flex justify-between items-center gap-4 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-800">Employee KPI Assignments</h2>
        <div className="">
          <input
            type="text"
            placeholder="Search by name, email, phone, department, role..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No employees found.</p>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedEmployees.map(emp => {
              const isOpen = expandedEmployees.has(emp.id);
              const list = assignments[emp.id] || [];

              return (
                <div key={emp.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => toggleExpand(emp.id)}
                    className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {emp.avatar_url ? (
                          <Image
                            src={emp.avatar_url}
                            alt={`${emp.first_name} ${emp.last_name}`}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-sm text-gray-600 space-x-2">
                          <span>{emp.email}</span>
                          <span>•</span>
                          <span>{emp.phone_number || '—'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {emp.departments?.name || 'No Department'} • {emp.position || 'No Position'}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="p-5 bg-white border-t border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Assigned KPIs</h3>

                      {assignments[emp.id] === undefined ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Evidence</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...Array(3)].map((_, i) => (
                                <KPITableRowSkeleton key={i} />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : list.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No KPIs assigned.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Evidence</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {list.map(ass => {
                                const k = ass.kpi_id;
                                const target = k.target_type === 'range'
                                  ? `${k.target_value.min}–${k.target_value.max}`
                                  : k.target_type === 'boolean'
                                  ? (k.target_value.value ? 'Yes' : 'No')
                                  : k.target_value.value;

                                const submitted = ass.submitted_value?.value ?? '—';
                                const evidence = ass.evidence_url ? (
                                  <a href={ass.evidence_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                                    View
                                  </a>
                                ) : '—';

                                return (
                                  <tr key={ass.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">{k.title}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{target}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{submitted}</td>
                                    <td className="px-4 py-3 text-sm">{evidence}</td>
                                    <td className="px-4 py-3 text-sm">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        ass.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                        ass.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                        ass.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {ass.status || 'assigned'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {(ass.status === 'submitted' || ass.status === 'assigned') && (
                                        <button
                                          onClick={() => openUpdateModal(ass, emp)}
                                          className="text-blue-600 hover:underline text-xs"
                                        >
                                          Review
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Update Modal (HR Review Only) */}
      {showUpdateModal && (
        isUpdating ? <UpdateModalSkeleton /> : (
          selectedAssignment && selectedEmployee && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold mb-2">Review KPI Submission</h3>
                <p className="text-gray-600 mb-4">
                  {selectedAssignment.kpi_id.title} — {selectedEmployee.first_name} {selectedEmployee.last_name}
                </p>

                {/* Submitted Info (Read-only) */}
                <div className="bg-gray-50 p-4 rounded-md mb-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Submitted Value:</span>{' '}
                    <span className="text-gray-700">
                      {selectedAssignment.submitted_value?.value ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Evidence:</span>{' '}
                    {selectedAssignment.evidence_url ? (
                      <a href={selectedAssignment.evidence_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Link
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Submitted At:</span>{' '}
                    <span className="text-gray-700">
                      {selectedAssignment.submitted_at ? new Date(selectedAssignment.submitted_at).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={updateForm.status}
                      onChange={handleUpdateChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#b88b1b]"
                    >
                      <option value="">Select Action</option>
                      <option value="Accepted">Accept</option>
                      <option value="Rejected">Reject</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={updateForm.notes}
                      onChange={handleUpdateChange}
                      rows={3}
                      placeholder="Add feedback..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#b88b1b]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(false)}
                      className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#a07a17] disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        )
      )}
    </section>
  );
};

export default EmployeeKPIAssignmentsTab;
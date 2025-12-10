"use client";

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

// Skeleton for KPI Card
const KPICardSkeleton = () => (
  <div className="border border-gray-300 rounded-lg p-5 bg-white animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="h-6 bg-gray-300 rounded w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-200 rounded w-40"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const EmployeeKPIPortal = () => {
  const [assignments, setAssignments] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleString('en-US', options));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Load employee's KPI assignments
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await apiService.getMyKPIAssignments();
        setAssignments(res.assignments || []);
        
        if (res.assignments?.[0]?.employee_id) {
          const empRes = await apiService.getEmployees(res.assignments[0].employee_id);
          setEmployee(empRes);
        }
      } catch (err) {
        toast.error('Failed to load your KPIs');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Ensure bucket exists + upload
  const handleFileUpload = async (file, assignmentId) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload JPG, PNG, WebP, or PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assignmentId}-${Date.now()}.${fileExt}`;
      const filePath = `kpi-evidence/${fileName}`;

      // Ensure bucket exists
      await apiService.ensureBucketExists('kpi-evidence');

      const { data, error } = await apiService.uploadEvidence(filePath, file);
      if (error) throw error;

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kpi-evidence/${fileName}`;
      setFormData(prev => ({
        ...prev,
        [assignmentId]: {
          ...prev[assignmentId],
          evidence_url: publicUrl
        }
      }));

      toast.success('Evidence uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
  };

  const handleInputChange = (assignmentId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (assignmentId) => {
    const data = formData[assignmentId];
    if (!data || data.submitted_value === undefined || !data.evidence_url) {
      return toast.error('Please fill achievement and upload evidence');
    }

    try {
      setSubmittingId(assignmentId);
      const payload = {
        submitted_value: { value: parseFloat(data.submitted_value) || data.submitted_value },
        evidence_url: data.evidence_url,
        status: 'submitted'
      };
      await apiService.submitKPIAssignment(assignmentId, payload);
      toast.success('KPI submitted successfully!');
      
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, ...payload, submitted_at: new Date().toISOString() } : a
      ));
      setFormData(prev => { const { [assignmentId]: _, ...rest } = prev; return rest; });
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const getTargetDisplay = (kpi) => {
    if (kpi.target_type === 'range') {
      return `${kpi.target_value.min} – ${kpi.target_value.max}`;
    }
    if (kpi.target_type === 'boolean') {
      return kpi.target_value.value ? 'Yes' : 'No';
    }
    return kpi.target_value.value;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return 'bg-gray-200 text-gray-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 mt-5">
            <div className="flex items-center space-x-4">
              {employee?.avatar_url ? (
                <Image
                  src={employee.avatar_url}
                  alt={employee.first_name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-[#153087] rounded-full flex items-center justify-center text-white font-bold">
                  {employee?.first_name?.[0]}{employee?.last_name?.[0]}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {employee ? `${employee.first_name} ${employee.last_name}` : 'My KPIs'}
                </h1>
                <p className="text-sm text-gray-500">
                  {employee?.position} • {employee?.departments?.name || 'No Department'}
                </p>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <span className="rounded-[20px] px-3 py-2 border border-gray-300 text-gray-500 text-sm">
                {currentDateTime}
              </span>
            </div>
          </div>
        </div>

      {/* Main Content */}
      <main>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My KPI Assignments</h2>
          <p className="text-gray-600 mt-1">Submit your progress and upload evidence</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Assigned</h3>
            <p className="text-gray-500">Contact your HR manager to get started.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map(ass => {
              const kpi = ass.kpi_id;
              const isSubmitted = ['Submitted', 'Approved', 'Rejected'].includes(ass.status);
              const isEditable = ass.status === 'assigned' || ass.status === null;

              return (
                <div key={ass.id} className="border border-gray-300 rounded-lg bg-white overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                        {kpi.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(ass.status)}`}>
                        {ass.status || 'Assigned'}
                      </span>
                    </div>

                    {kpi.description && (
                      <p className="text-sm text-gray-600 mb-4">{kpi.description}</p>
                    )}

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Target:</span>
                        <span className="font-medium text-gray-900">{getTargetDisplay(kpi)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Period:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(ass.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
                          {new Date(ass.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {isSubmitted ? (
                      <div className="bg-gray-50 p-4 rounded-md space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Your Submission:</span>
                          <p className="mt-1 text-gray-900">
                            {ass.submitted_value?.value ?? '—'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Evidence:</span>
                          <p className="mt-1">
                            {ass.evidence_url ? (
                              <a href={ass.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[#153087] hover:underline">
                                View File
                              </a>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </p>
                        </div>
                        {ass.notes && (
                          <div>
                            <span className="font-medium text-gray-700">HR Feedback:</span>
                            <p className="mt-1 text-gray-900 italic">"{ass.notes}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Achievement
                          </label>
                          {kpi.target_type === 'boolean' ? (
                            <select
                              value={formData[ass.id]?.submitted_value ?? ''}
                              onChange={(e) => handleInputChange(ass.id, 'submitted_value', e.target.value === 'true')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#153087] focus:border-[#153087]"
                            >
                              <option value="">Select</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : (
                            <input
                              type={kpi.target_type === 'range' || kpi.target_type === 'number' ? 'number' : 'text'}
                              placeholder="Enter your result"
                              value={formData[ass.id]?.submitted_value ?? ''}
                              onChange={(e) => handleInputChange(ass.id, 'submitted_value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#153087] focus:border-[#153087]"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Evidence
                          </label>
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => handleFileUpload(e.target.files[0], ass.id)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#153087] file:text-white hover:file:bg-[#a07a17]"
                            />
                            <p className="text-xs text-gray-500">JPG, PNG, WebP, PDF (max 10MB)</p>
                            {formData[ass.id]?.evidence_url && (
                              <div className="flex items-center space-x-2 text-xs text-green-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>File uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSubmit(ass.id)}
                          disabled={submittingId === ass.id || !formData[ass.id]?.submitted_value || !formData[ass.id]?.evidence_url}
                          className="w-full py-2 px-4 bg-[#153087] text-white font-medium rounded-md hover:bg-[#a07a17] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingId === ass.id ? 'Submitting...' : 'Submit for Review'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default EmployeeKPIPortal;
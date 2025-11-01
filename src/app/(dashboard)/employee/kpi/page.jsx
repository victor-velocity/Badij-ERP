'use client';

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow p-6 border animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
      <div className="h-4 bg-gray-200 rounded w-40"></div>
    </div>
    <div className="space-y-3">
      <div className="h-9 bg-gray-200 rounded"></div>
      <div className="h-9 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function KPIPage() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadMyKPIs();
  }, []);

  const loadMyKPIs = async () => {
    try {
      const data = await apiService.getMyKPIAssignments(router);
      setKpis(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId, value, evidence = '') => {
    setSubmitting(assignmentId);
    try {
      const payload = {
        status: 'Submitted',
        submitted_value: { value: parseFloat(value) || value },
        evidence_url: evidence || null
      };
      await apiService.submitKPIAssignment(assignmentId, payload, router);
      toast.success('KPI submitted successfully');
      loadMyKPIs();
    } catch (err) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setSubmitting(null);
    }
  };

  const getProgressColor = (status) => {
    const colors = {
      'Assigned': 'bg-gray-200 text-gray-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'Submitted': 'bg-yellow-100 text-yellow-700',
      'Approved': 'bg-green-100 text-green-700',
      'Rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My KPIs</h1>

      {kpis.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          No KPIs assigned yet.
        </div>
      ) : (
        <div className="space-y-6">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-lg shadow p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{kpi.kpi_title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{kpi.kpi_description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getProgressColor(kpi.status)}`}>
                  {kpi.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium text-gray-700">Target:</span>{' '}
                  {JSON.stringify(kpi.target_value)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Period:</span>{' '}
                  {new Date(kpi.period_start).toLocaleDateString()} - {new Date(kpi.period_end).toLocaleDateString()}
                </div>
              </div>

              {['Assigned', 'In Progress'].includes(kpi.status) && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    handleSubmit(kpi.id, formData.get('value'), formData.get('evidence'));
                  }}
                  className="space-y-3 mt-4 pt-4 border-t"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Result
                    </label>
                    <input
                      type="text"
                      name="value"
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evidence URL (optional)
                    </label>
                    <input
                      type="url"
                      name="evidence"
                      className="w-full px-3 py-2 border rounded-md focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting === kpi.id}
                    className="w-full bg-[#b88b1b] text-white py-2 rounded-md hover:bg-[#9a7716] disabled:opacity-60"
                  >
                    {submitting === kpi.id ? 'Submitting...' : 'Submit KPI'}
                  </button>
                </form>
              )}

              {kpi.status === 'Submitted' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
                  <strong>Submitted:</strong> {JSON.stringify(kpi.submitted_value)}<br />
                  {kpi.evidence_url && (
                    <a href={kpi.evidence_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      View Evidence
                    </a>
                  )}
                </div>
              )}

              {kpi.status === 'Approved' && (
                <div className="mt-4 p-3 bg-green-50 rounded text-sm">
                  <strong>Approved!</strong> Great job!
                </div>
              )}

              {kpi.status === 'Rejected' && (
                <div className="mt-4 p-3 bg-red-50 rounded text-sm">
                  <strong>Rejected:</strong> {kpi.review_comments || 'No feedback'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client"

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';
import KPITemplatesTable from '@/components/kpi/KpiTemplateTable';
import EmployeeKPIAssignmentsTab from '@/components/kpi/EmployeeAssignmentTable';

const KPIDashboard = () => {
  const router = useRouter();
  const [kpiTemplates, setKpiTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab !== 'templates') return;
      try {
        setLoading(true);
        const templates = await apiService.getKPITemplates(router);
        setKpiTemplates(templates.templates || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, router]);

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

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR KPI Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Manage KPI templates and assignments</p>
        </div>
        <span className="rounded-full px-4 py-2 border border-gray-300 text-gray-600 text-sm">
          {currentDateTime}
        </span>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'templates'
                ? 'border-[#b88b1b] text-[#b88b1b]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPI Templates
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assignments'
                ? 'border-[#b88b1b] text-[#b88b1b]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Employee Assignments
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'templates' && (
          <div>
            {error ? (
              <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg">Error: {error}</div>
            ) : (
              <KPITemplatesTable 
                kpiTemplates={kpiTemplates} 
                loading={loading} 
                setKpiTemplates={setKpiTemplates} 
              />
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <EmployeeKPIAssignmentsTab />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIDashboard;
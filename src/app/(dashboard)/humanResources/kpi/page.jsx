"use client"

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const KPIDashboard = () => {
  const router = useRouter();
  const [kpiTemplates, setKpiTemplates] = useState([]);
  const [roleAssignments, setRoleAssignments] = useState([]);
  const [employeeAssignments, setEmployeeAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KPI Templates
        const templates = await apiService.getKPITemplates(router);
        setKpiTemplates(templates || []);

        // Fetch Role Assignments (direct Supabase via apiService)
        const roles = await apiService.getKPIRoleAssignments();
        setRoleAssignments(roles || []);

        // Fetch Employee Assignments (direct Supabase; use getEmployeeKPIAssignments for all, or getMyEmployeeKPIAssignments for user-specific)
        // Assuming HR view, so all assignments
        const employees = await apiService.getEmployeeKPIAssignments();
        setEmployeeAssignments(employees || []);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div>Loading KPI data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="kpi-dashboard">
      <h1>HR KPI Dashboard</h1>

      <section>
        <h2>KPI Templates</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Weight</th>
              <th>Target Type</th>
              <th>Target Value</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {kpiTemplates.map((template) => (
              <tr key={template.kpi_id}>
                <td>{template.kpi_id}</td>
                <td>{template.title}</td>
                <td>{template.description || 'N/A'}</td>
                <td>{template.weight}</td>
                <td>{template.target_type}</td>
                <td>{JSON.stringify(template.target_value)}</td>
                <td>{template.active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>KPI Role Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>Assignment ID</th>
              <th>KPI ID</th>
              <th>Role</th>
              <th>Department ID</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {roleAssignments.map((assignment) => (
              <tr key={assignment.assignment_id}>
                <td>{assignment.assignment_id}</td>
                <td>{assignment.kpi_id}</td>
                <td>{assignment.role || 'N/A'}</td>
                <td>{assignment.department_id || 'N/A'}</td>
                <td>{assignment.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Employee KPI Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>KPI ID</th>
              <th>Employee ID</th>
              <th>Period Start</th>
              <th>Period End</th>
              <th>Target Value</th>
              <th>Status</th>
              <th>Submitted Value</th>
              <th>Evidence URL</th>
              <th>Reviewed By</th>
            </tr>
          </thead>
          <tbody>
            {employeeAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.id}</td>
                <td>{assignment.kpi_id}</td>
                <td>{assignment.employee_id}</td>
                <td>{assignment.period_start}</td>
                <td>{assignment.period_end}</td>
                <td>{JSON.stringify(assignment.target_value)}</td>
                <td>{assignment.status}</td>
                <td>{JSON.stringify(assignment.submitted_value) || 'N/A'}</td>
                <td>{assignment.evidence_url || 'N/A'}</td>
                <td>{assignment.reviewed_by || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default KPIDashboard;
"use client";

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=E';

const getPrimaryStatus = (status) => {
  if (Array.isArray(status) && status.length > 0) return status[0];
  return typeof status === 'string' ? status : null;
};

const formatStatusDisplay = (status) => {
  if (Array.isArray(status) && status.length > 0) {
    return status.map(s => s.replace(/-/g, ' ')).join(' | ');
  }
  return typeof status === 'string' ? status.replace(/-/g, ' ') : '—';
};

const getStatusColor = (status) => {
  const primary = getPrimaryStatus(status)?.toLowerCase();

  switch (primary) {
    case 'in-time':
    case 'present':
    case 'on-time':
      return 'bg-green-100 text-green-800';
    case 'absent':
      return 'bg-red-100 text-red-800';
    case 'late':
      return 'bg-orange-100 text-orange-800';
    case 'on-leave':
      return 'bg-blue-100 text-blue-800';
    case 'early-departure':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Attendance = () => {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // ── Real-time Clock ─────────────────────────────
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
    const id = setInterval(updateDateTime, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const empData = await apiService.getEmployees(router);
        const employeeMap = empData.reduce((map, emp) => {
          map[emp.id] = emp;
          return map;
        }, {});

        // Fetch today's attendance
        const today = new Date().toISOString().split('T')[0];
        const attendanceData = await apiService.getAttendanceTransactions(
          { start_date: today, end_date: today },
          router
        );

        // Combine: attach employee details + avatar to attendance records
        const enriched = (Array.isArray(attendanceData) ? attendanceData : [])
          .map(record => {
            const emp = employeeMap[record.employee?.id] || {};
            return {
              ...record,
              employeeDetails: emp,
              avatar: emp.avatar_url || DEFAULT_AVATAR,
              name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown Employee',
              email: emp.email || '—',
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, 10)

        setAttendanceToday(enriched);
        setEmployees(empData);
      } catch (err) {
        console.error('Failed to load dashboard attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // ── Summary Calculation ───────────────────────
  const summary = {
    present: attendanceToday.filter(r => {
      const s = getPrimaryStatus(r.status);
      return ['in-time', 'present', 'on-time'].includes(s?.toLowerCase());
    }).length,
    absent: attendanceToday.filter(r => getPrimaryStatus(r.status)?.toLowerCase() === 'absent').length,
    late: attendanceToday.filter(r => r.status?.includes?.('Late')).length,
    onLeave: attendanceToday.filter(r => getPrimaryStatus(r.status)?.toLowerCase() === 'on-leave').length,
    earlyDeparture: attendanceToday.filter(r => r.status?.includes?.('Early-departure')).length,
  };

  // ── Loading Skeleton Row ───────────────────────
  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 animate-pulse"></div>
          <div className="ml-4">
            <div className="h-4 bg-gray-300 rounded w-32 mb-1 animate-pulse"></div>
            <div className="h-3 bg-gray-300 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 w-20 bg-gray-300 rounded-full animate-pulse"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">—</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">—</td>
    </tr>
  );

  return (
    <div className="relative bg-white rounded-lg border-[0.5px] border-solid border-[#DDD9D9] shadow-sm p-6 my-8" style={{ maxHeight: '540px', overflowY: 'auto' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Attendance Overview</h1>
        </div>
        <span className="rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] text-sm mt-4 sm:mt-0">
          {currentDateTime}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
            ) : attendanceToday.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No attendance records for today.
                </td>
              </tr>
            ) : (
              attendanceToday.map((record) => (
                <tr key={record.id || record.employee?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        <img
                          className="h-full w-full object-cover rounded-full"
                          src={record.avatar}
                          alt=""
                          onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{record.name}</div>
                        <div className="text-sm text-gray-500">{record.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {formatStatusDisplay(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.check_out ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* See All Link */}
      <div className="mt-6 text-right">
        <button
          onClick={() => router.push('/humanResources/attendance')}
          className="text-[#153087] font-medium hover:underline text-sm"
        >
          See all attendance records
        </button>
      </div>
    </div>
  );
};

export default Attendance;
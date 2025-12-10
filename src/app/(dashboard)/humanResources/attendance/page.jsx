"use client";

import React, { useState, useEffect, useMemo } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=U';

// ── Helper: Safely extract primary status ─────
const getPrimaryStatus = (status) => {
  if (Array.isArray(status) && status.length > 0) return status[0];
  return typeof status === 'string' ? status : null;
};

// ── Format status for display ─────
const formatStatusDisplay = (status) => {
  if (Array.isArray(status) && status.length > 0) {
    return status.map(s => s.replace(/-/g, ' ')).join(' | ');
  }
  return typeof status === 'string' ? status.replace(/-/g, ' ') : 'Unknown';
};

// ── Status Color Mapping ─────
const getStatusColor = (status) => {
  const primary = getPrimaryStatus(status)?.toLowerCase();

  switch (primary) {
    case 'in-time':
    case 'present':
      return 'bg-green-100 text-green-800';
    case 'absent':
      return 'bg-red-100 text-red-800';
    case 'late':
      return 'bg-orange-100 text-orange-800';
    case 'early-departure':
      return 'bg-purple-100 text-purple-800';
    case 'on-leave':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ── Safe Avatar Component with Fallback ─────
const SafeAvatar = ({ src, alt = "", className = "h-10 w-10 rounded-full object-cover" }) => {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_AVATAR);

  useEffect(() => {
    if (src && src !== DEFAULT_AVATAR) {
      setImgSrc(src);
    } else {
      setImgSrc(DEFAULT_AVATAR);
    }
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(DEFAULT_AVATAR)}
    />
  );
};

const TableRowSkeleton = () => (
  <tbody className="divide-y divide-gray-200 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <tr key={i}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
            <div className="ml-4">
              <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        </td>
        {[...Array(6)].map((_, j) => (
          <td key={j} className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const AttendanceRecordTable = () => {
  const router = useRouter();

  // ── Data ─────────────────────────────────────
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Filters & UI ─────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByDate, setFilterByDate] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [displayMode, setDisplayMode] = useState('table');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ── Summary ──────────────────────────────────
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
    earlyDeparture: 0,
    others: 0,
  });

  // ── Sync Modal ───────────────────────────────
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStart, setSyncStart] = useState('');
  const [syncEnd, setSyncEnd] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  // ── Biometric Modal ──────────────────────────
  const [showManageBiometricModal, setShowManageBiometricModal] = useState(false);
  const [biometricSearch, setBiometricSearch] = useState('');

  // ── Fetch Employees ──────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees(router);
        setEmployees(data || []);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };
    fetchEmployees();
  }, [router]);

  // ── Fetch Attendance ─────────────────────────
  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterByDate === 'custom' && customStartDate && customEndDate) {
        filters.start_date = customStartDate;
        filters.end_date = customEndDate;
      } else if (filterByDate !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const last7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const last30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

        switch (filterByDate) {
          case 'today': filters.start_date = filters.end_date = today; break;
          case 'yesterday': filters.start_date = filters.end_date = yesterday; break;
          case 'last7days': filters.start_date = last7; filters.end_date = today; break;
          case 'last30days': filters.start_date = last30; filters.end_date = today; break;
        }
      }

      const data = await apiService.getAttendanceTransactions(filters, router);
      setAttendanceRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance records');
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterByDate, customStartDate, customEndDate]);

  // ── Real-time Clock ──────────────────────────
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

  // ── Employee Map ─────────────────────────────
  const employeeMap = useMemo(() => {
    return employees.reduce((map, emp) => {
      map[emp.id] = emp;
      return map;
    }, {});
  }, [employees]);

  // ── Filtered Records ─────────────────────────
  // ── Filtered & Sorted Records ─────────────────────────
  const filteredAttendanceRecords = useMemo(() => {
    let filtered = attendanceRecords;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const emp = employeeMap[record.employee?.id];
        if (!emp) return false;
        return (
          emp.first_name?.toLowerCase().includes(term) ||
          emp.last_name?.toLowerCase().includes(term) ||
          emp.email?.toLowerCase().includes(term) ||
          (emp.biotime_id && emp.biotime_id.toString().includes(term))
        );
      });
    }

    // Calendar month filter
    if (displayMode === 'calendar') {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      filtered = filtered.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }

    // Sort by date: newest first (descending)
    filtered.sort((a, b) => {
      // Ensure we compare actual Date objects
      return new Date(b.date) - new Date(a.date);
    });

    return filtered;
  }, [attendanceRecords, searchTerm, employeeMap, displayMode, currentMonth]);

  // ── Summary ──────────────────────────────────
  useEffect(() => {
    const summary = { present: 0, absent: 0, late: 0, onLeave: 0, earlyDeparture: 0, others: 0 };
    filteredAttendanceRecords.forEach(r => {
      const primary = getPrimaryStatus(r.status)?.toLowerCase();
      if (['in-time', 'present'].includes(primary)) summary.present++;
      else if (primary === 'absent') summary.absent++;
      else if (primary === 'late') summary.late++;
      else if (primary === 'on-leave') summary.onLeave++;
      else if (primary === 'early-departure') summary.earlyDeparture++;
      else summary.others++;
    });
    setAttendanceSummary(summary);
  }, [filteredAttendanceRecords]);

  // ── Pagination ───────────────────────────────
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendanceRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendanceRecords.length / itemsPerPage);
  const paginate = page => setCurrentPage(page);

  // ── Sync Modal Handlers ──────────────────────
  // ── Sync Modal Handlers ──────────────────────
  const handleOpenSyncModal = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const format = (date) => date.toISOString().split('T')[0];

    setSyncStart(format(yesterday));
    setSyncEnd(format(today));
    setShowSyncModal(true);
  };

  const performSync = async () => {
    if (!syncStart || !syncEnd) {
      toast.error('Please select both dates');
      return;
    }
    setSyncLoading(true);
    try {
      await apiService.syncAttendanceTransactions({ start_date: syncStart, end_date: syncEnd }, router);
      toast.success('Sync completed successfully!');
      fetchAttendance();
      setTimeout(() => setShowSyncModal(false), 2000);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // ── Biometric Management ─────────────────────
  const refreshEmployees = async () => {
    const data = await apiService.getEmployees(router);
    setEmployees(data || []);
  };

  const handleEnroll = async (employeeId, name) => {
    if (!window.confirm(`Enroll ${name} in biometric device?`)) return;
    try {
      await apiService.createBiometricEmployee(employeeId, router);
      await refreshEmployees();
      toast.success('Enrolled successfully');
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (employeeId, name) => {
    if (!window.confirm(`Delete biometric record for ${name}? This cannot be undone.`)) return;
    try {
      await apiService.deleteBiometricEmployee(employeeId, router);
      await refreshEmployees();
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // ── Calendar View ────────────────────────────
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleMonthChange = offset => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setCurrentPage(1);
  };

  const getStatusColorForCalendar = pct => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-orange-500';
    if (pct > 0) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const renderCalendar = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const days = getDaysInMonth(y, m);
    const first = getFirstDayOfMonth(y, m);
    const cells = [];

    for (let i = 0; i < first; i++) {
      cells.push(<div key={`e-${i}`} className="p-2 border border-gray-200 rounded-md"></div>);
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = filteredAttendanceRecords.filter(r => r.date === dateStr);
      const total = dayRecords.length;
      const attended = dayRecords.filter(r => {
        const primary = getPrimaryStatus(r.status)?.toLowerCase();
        return ['in-time', 'present', 'late', 'early-departure'].includes(primary);
      }).length;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

      cells.push(
        <div
          key={`d-${d}`}
          className={`p-2 text-center border rounded-md border-gray-200 flex flex-col items-center justify-center text-white ${getStatusColorForCalendar(pct)}`}
          title={dayRecords.map(r => {
            const emp = employeeMap[r.employee?.id];
            const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
            return `${name}: ${formatStatusDisplay(r.status)}`;
          }).join('\n')}
        >
          <span className="font-semibold text-sm">{d}</span>
          {total > 0 ? (
            <div className="text-xs mt-1">
              <span className="font-bold">{pct}%</span> - {total}
            </div>
          ) : (
            <span className="text-xs mt-1 text-gray-700">N/A</span>
          )}
        </div>
      );
    }

    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => handleMonthChange(-1)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-[#faf714] hover:text-[black] hover:text-white transition-all">
            Prev
          </button>
          <h3 className="text-lg font-semibold">
            {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => handleMonthChange(1)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-[#faf714] hover:text-[black] hover:text-white transition-all">
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-sm font-medium text-gray-700 mb-2 text-center">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-2">{cells}</div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>≥80% Present</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>50–79%</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>&lt;50%</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-300 mr-1"></span>No Data</div>
        </div>
      </div>
    );
  };

  // ── Formatters ───────────────────────────────
  const formatTime = iso => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—');
  const formatDate = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      .replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
  };

  // ── RENDER ───────────────────────────────────
  if (error) return <div className="text-center py-8 text-red-600">Error: {error}</div>;

  return (
    <div className="relative">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 mb-14">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Attendance Records</h1>
          <p className="text-[#A09D9D] font-medium mt-2 text-sm">View and manage employee attendance records</p>
        </div>
        <span className="rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] text-sm mt-4 sm:mt-0">
          {currentDateTime}
        </span>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end mb-6 space-x-2">
        <button
          onClick={() => setDisplayMode('table')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${displayMode === 'table' ? 'bg-[#153087] text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Table View
        </button>
        <button
          onClick={() => setDisplayMode('calendar')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${displayMode === 'calendar' ? 'bg-[#153087] text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Calendar View
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mb-8 flex flex-col sm:flex-row justify-end gap-4">
        <button onClick={handleOpenSyncModal} className="px-6 py-3 bg-[#153087] text-white font-semibold rounded-lg hover:bg-[#a07917] transition-all shadow-md">
          Sync Attendance
        </button>
        <button
          onClick={() => { setBiometricSearch(''); setShowManageBiometricModal(true); }}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md"
        >
          Manage Biometric Enrollment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Attendance List</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search employee..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153087]"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          {displayMode === 'table' && (
            <select
              value={filterByDate}
              onChange={e => {
                setFilterByDate(e.target.value);
                setCurrentPage(1);
                if (e.target.value !== 'custom') {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153087]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          )}

          {displayMode === 'table' && filterByDate === 'custom' && (
            <div className="flex space-x-2">
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-green-50 px-5 py-8 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">Present</p>
            <p className="text-2xl font-bold text-green-800">{attendanceSummary.present}</p>
          </div>
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="bg-red-50 px-5 py-8 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Absent</p>
            <p className="text-2xl font-bold text-red-800">{attendanceSummary.absent}</p>
          </div>
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2A9 9 0 111 12a9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="bg-orange-50 px-5 py-8 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700">Late</p>
            <p className="text-2xl font-bold text-orange-800">{attendanceSummary.late}</p>
          </div>
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="bg-blue-50 px-5 py-8 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">On Leave</p>
            <p className="text-2xl font-bold text-blue-800">{attendanceSummary.onLeave}</p>
          </div>
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div className="bg-purple-50 px-5 py-8 rounded-lg shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700">Early Departure</p>
            <p className="text-2xl font-bold text-purple-800">{attendanceSummary.earlyDeparture}</p>
          </div>
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
        </div>
      </div>

      {/* Table / Calendar */}
      {displayMode === 'table' ? (
        filteredAttendanceRecords.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-500">No attendance records found.</div>
        ) : (
          <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              {loading ? (
                <TableRowSkeleton />
              ) : (
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map(record => {
                    const emp = employeeMap[record.employee?.id] || {};
                    const avatarUrl = emp.avatar_url || DEFAULT_AVATAR;
                    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown Employee';

                    return (
                      <tr key={`${record.employee?.id}-${record.date}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                              <SafeAvatar src={avatarUrl} alt={fullName} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{fullName}</div>
                              <div className="text-sm text-gray-500">{emp.email || ''}</div>
                              <div className={`text-sm font-medium ${emp.biotime_id ? 'text-green-600' : 'text-red-600'}`}>
                                Biometric: {emp.biotime_id || 'Not enrolled'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.departments?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.position || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(record.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(record.check_in)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(record.check_out)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {formatStatusDisplay(record.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
        )
      ) : renderCalendar()}

      {/* Pagination */}
      {displayMode === 'table' && filteredAttendanceRecords.length > 0 && !loading && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              Sync Attendance from Device
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (Yesterday)
                </label>
                <input
                  type="date"
                  value={syncStart}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Today)
                </label>
                <input
                  type="date"
                  value={syncEnd}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="text-sm text-gray-600 mt-2">
                The system will sync attendance records for <strong>{syncStart}</strong> to <strong>{syncEnd}</strong>.
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={performSync}
                disabled={syncLoading}
                className="px-6 py-2 bg-[#153087] text-white rounded-lg hover:bg-[#a07917] disabled:opacity-70"
              >
                {syncLoading ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Modal */}
      {showManageBiometricModal && (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Manage Biometric Enrollment</h3>
            <input
              type="text"
              placeholder="Search employee..."
              value={biometricSearch}
              onChange={e => setBiometricSearch(e.target.value)}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087]"
            />
            <div className="space-y-3">
              {employees
                .filter(emp => {
                  const term = biometricSearch.toLowerCase();
                  const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
                  return fullName.includes(term) || (emp.email && emp.email.toLowerCase().includes(term));
                })
                .map(emp => (
                  <div key={emp.id} className="flex justify-between items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200">
                        <SafeAvatar src={emp.avatar_url} alt={`${emp.first_name} ${emp.last_name}`} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-sm text-gray-600">{emp.email}</p>
                        <p className={`text-sm font-medium ${emp.biotime_id ? 'text-green-600' : 'text-red-600'}`}>
                          Biometric ID: {emp.biotime_id || 'Not enrolled'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {emp.biotime_id ? (
                        <button onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                          Delete
                        </button>
                      ) : (
                        <button onClick={() => handleEnroll(emp.id, `${emp.first_name} ${emp.last_name}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Enroll
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setShowManageBiometricModal(false)} className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceRecordTable;
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCheck,
  faTimes,
  faCalendarMinus,
  faClock,
  faChevronLeft,
  faChevronRight,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import AttendanceCard from "@/components/employee/attendance/AttendanceCard";
import AttendanceTable from "@/components/employee/attendance/AttendanceTable";
import Pagination from "@/components/employee/attendance/AttendancePagination";
import apiService from "@/app/lib/apiService";
import { createClient } from "@/app/lib/supabase/client";
import toast, { Toaster } from "react-hot-toast";

// Skeleton Row Component
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
  </tr>
);

// Skeleton Table
const SkeletonTable = () => (
  <div className="rounded-xl shadow-md overflow-hidden border border-solid border-[#DDD9D9]">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Date", "Day", "Clock in", "Clock out", "Hours worked", "Status", "Notes"].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AttendancePage = () => {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const [first_name, setFirstName] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayMode, setDisplayMode] = useState("table");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Fetch employee
  useEffect(() => {
    const fetchUser = async () => {
      const stored = localStorage.getItem("first_name");
      if (stored) setFirstName(stored);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: emp, error } = await supabase
        .from("employees")
        .select("id, first_name")
        .eq("user_id", user.id)
        .single();

      if (error || !emp) {
        toast.error("Employee not found");
        return;
      }

      setEmployeeId(emp.id);
      if (!stored) {
        setFirstName(emp.first_name);
        localStorage.setItem("first_name", emp.first_name);
      }
    };
    fetchUser();
  }, [supabase]);

  // Fetch attendance
  const fetchAttendance = async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getEmployeeAttendanceTransactions(employeeId, router);
      setRawRecords(Array.isArray(data) ? data : []);
      toast.success("Attendance loaded");
    } catch (err) {
      setError(err.message || "Failed to load attendance");
      toast.error(err.message || "Failed to load attendance");
      setRawRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [employeeId]);

  // Clock + Greeting
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      setGreeting(
        h >= 5 && h < 12
          ? "Good Morning"
          : h >= 12 && h < 18
          ? "Good Afternoon"
          : "Good Evening"
      );
      setCurrentDateTime(
        now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Helpers
  const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return "—";
    const diff = (new Date(outTime) - new Date(inTime)) / 3600000;
    const hrs = Math.floor(diff);
    const mins = Math.round((diff % 1) * 60);
    return `${hrs}hrs ${mins}min`;
  };

  const normalizeStatus = (status) => {
    if (!status) return "Absent";
    switch (status.toLowerCase()) {
      case "in-time": return "Present";
      case "late": return "Late";
      case "absent": return "Absent";
      case "early-departure": return "Early Departure";
      case "on-leave": return "On Leave";
      default: return status;
    }
  };

  // Build monthly data — ONLY real records
  const monthData = useMemo(() => {
    if (rawRecords.length === 0) return [];

    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    return rawRecords
      .filter((rec) => {
        if (!rec.date) return false;
        const recDate = new Date(rec.date);
        return recDate.getFullYear() === y && recDate.getMonth() === m;
      })
      .map((rec) => {
        const dateObj = new Date(rec.date);
        const dayName = dateObj.toLocaleString("en-US", { weekday: "long" });
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        const status = normalizeStatus(rec.status);
        const clockIn = rec.check_in ? formatTime(rec.check_in) : "—";
        const clockOut = rec.check_out ? formatTime(rec.check_out) : "—";
        const hoursWorked = rec.check_in && rec.check_out
          ? calculateHours(rec.check_in, rec.check_out)
          : "—";

        const notes =
          status === "Late"
            ? "Came late"
            : status === "Absent" && !isWeekend
            ? "Sick leave"
            : "—";

        return {
          date: dateObj.toLocaleString("en-US", { month: "short", day: "2-digit" }),
          day: dayName,
          clockIn,
          clockOut,
          hoursWorked,
          status,
          notes,
        };
      })
      .sort((a, b) => {
        const [aMonth, aDay] = a.date.split(" ");
        const [bMonth, bDay] = b.date.split(" ");
        return new Date(`${aMonth} ${aDay}, ${y}`) - new Date(`${bMonth} ${bDay}, ${y}`);
      });
  }, [currentMonth, rawRecords]);

  // Search
  const filteredData = useMemo(() => {
    if (!searchTerm) return monthData;
    const term = searchTerm.toLowerCase();
    return monthData.filter(
      (r) =>
        r.status.toLowerCase().includes(term) ||
        r.notes.toLowerCase().includes(term) ||
        r.day.toLowerCase().includes(term)
    );
  }, [monthData, searchTerm]);

  // Summary
  const summary = useMemo(() => {
    const workingDays = filteredData.filter((d) => d.status !== "Weekend").length;
    return {
      totalWorkingDays: workingDays,
      daysPresent: filteredData.filter((d) => d.status === "Present").length,
      daysAbsent: filteredData.filter((d) => d.status === "Absent").length,
      leavesTaken: filteredData.filter((d) => d.status === "On Leave").length,
      lateArrivals: filteredData.filter((d) => d.status === "Late").length,
    };
  }, [filteredData]);

  const cards = [
    { label: "Total working days", value: summary.totalWorkingDays, icon: faCalendarDays, color: "text-blue-600", backgroundColor: "bg-blue-50", borderClass: "border-blue-400" },
    { label: "Days present", value: summary.daysPresent, icon: faCheck, color: "text-green-400", backgroundColor: "bg-green-50", borderClass: "border-green-400" },
    { label: "Days absent", value: summary.daysAbsent, icon: faTimes, color: "text-red-400", backgroundColor: "bg-red-50", borderClass: "border-red-400" },
    { label: "Leaves taken", value: summary.leavesTaken, icon: faCalendarMinus, color: "text-yellow-400", backgroundColor: "bg-yellow-50", borderClass: "border-yellow-400" },
    { label: "Late arrivals", value: summary.lateArrivals, icon: faClock, color: "text-purple-400", backgroundColor: "bg-purple-50", borderClass: "border-purple-400" },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginated = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePage = (p) => setCurrentPage(p);

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() - 1);
      return n;
    });
    setCurrentPage(1);
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const n = new Date(prev);
      n.setMonth(n.getMonth() + 1);
      return n;
    });
    setCurrentPage(1);
  };

  // Calendar View
  const renderCalendar = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const first = new Date(y, m, 1).getDay();
    const cells = [];

    // Empty cells
    for (let i = 0; i < first; i++) {
      cells.push(<div key={`e-${i}`} className="p-2 border border-gray-200 rounded-md" />);
    }

    // Map records by day
    const recordMap = {};
    filteredData.forEach((r) => {
      const day = parseInt(r.date.split(" ")[1], 10);
      recordMap[day] = r.status;
    });

    for (let d = 1; d <= days; d++) {
      const status = recordMap[d] || null;
      const color = status
        ? {
            Present: "bg-green-500",
            Absent: "bg-red-500",
            Late: "bg-yellow-500",
            "Early Departure": "bg-purple-500",
            "On Leave": "bg-blue-500",
          }[status] || "bg-gray-200"
        : "bg-white border border-gray-300";

      cells.push(
        <div
          key={`d-${d}`}
          className={`p-2 text-center border rounded-md flex flex-col items-center justify-center text-sm ${color} ${
            !status ? "text-gray-700" : "text-white"
          }`}
          title={status ? `${d}: ${status}` : `${d}: No record`}
        >
          <span className="font-medium">{d}</span>
          {status && <div className="text-xs mt-1">{status}</div>}
        </div>
      );
    }

    return (
      <div className="mt-8">
        <div className="grid grid-cols-7 gap-2 text-sm font-medium text-gray-700 mb-2 text-center">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-2">{cells}</div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>Present</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>Absent</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>Late</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 mr-1"></span>Early Departure</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>On Leave</div>
        </div>
      </div>
    );
  };

  // Render
  return (
    <div>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Summary</h1>
          <p className="text-[#A09D9D] font-medium mt-2">
            {greeting}, {first_name || "Loading..."}
          </p>
        </div>
        <span className="rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]">
          {currentDateTime}
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <AttendanceCard
                  label={<div className="h-4 bg-gray-200 rounded w-24"></div>}
                  value={<div className="h-8 bg-gray-200 rounded w-12"></div>}
                  icon={faCalendarDays}
                  color="text-gray-400"
                  backgroundColor="bg-gray-50"
                  borderClass="border-gray-300"
                />
              </div>
            ))
          : cards.map((c, i) => (
              <AttendanceCard
                key={i}
                label={c.label}
                value={c.value}
                icon={c.icon}
                color={c.color}
                backgroundColor={c.backgroundColor}
                borderClass={c.borderClass}
              />
            ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold text-gray-800">
            {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-[#faf714] hover:text-[black] hover:text-white"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-[#faf714] hover:text-[black] hover:text-white"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 px-4 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#153087]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="bg-[#153087] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#916e17] disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRefresh} spin={loading} />
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setDisplayMode(displayMode === "table" ? "calendar" : "table")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {displayMode === "table" ? "Calendar View" : "Table View"}
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : loading ? (
        <SkeletonTable />
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No attendance records found for{" "}
          {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </div>
      ) : displayMode === "table" ? (
        <>
          <AttendanceTable data={paginated} />
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePage} />
            </div>
          )}
        </>
      ) : (
        renderCalendar()
      )}
    </div>
  );
};

export default AttendancePage;
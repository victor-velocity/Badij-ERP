"use client";

import React, { useEffect, useState, useCallback } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function ShiftPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const shiftTypeCache = new Map();

  /* -------------------------------------------------------------
   *  1. Get current employee ID
   * ------------------------------------------------------------- */
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const profile = await apiService.getEmployees(router);
        setEmployeeId(profile.id);
      } catch (err) {
        console.error("Failed to get employee ID", err);
        toast.error("Please log in again");
        router.replace("/login");
      }
    };
    fetchEmployee();
  }, [router]);

  /* -------------------------------------------------------------
   *  2. Fetch employee's shift assignments
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (!employeeId) return;

    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getEmployeeShiftSchedules(employeeId, router);

        if (Array.isArray(data) && data.length > 0) {
          setAssignments(data);
        } else {
          setAssignments([]);
          setShifts([]);
        }
      } catch (err) {
        const msg = err.message || "Failed to load shift assignments";
        setError(msg);
        toast.error(msg);
        if (msg.toLowerCase().includes("unauthorized")) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [employeeId, router]);

  /* -------------------------------------------------------------
   *  3. Fetch shift_type details for each assignment
   * ------------------------------------------------------------- */
  useEffect(() => {
    if (assignments.length === 0) {
      setShifts([]);
      return;
    }

    const fetchShiftDetails = async () => {
      setLoading(true);
      const enrichedShifts = [];

      for (const assignment of assignments) {
        const cacheKey = assignment.shift_type_id;
        let shiftType = shiftTypeCache.get(cacheKey);

        if (!shiftType) {
          try {
            shiftType = await apiService.getShiftById(cacheKey, router);
            shiftTypeCache.set(cacheKey, shiftType);
          } catch (err) {
            console.error(`Failed to fetch shift type ${cacheKey}`, err);
            shiftType = { name: "Unknown Shift", start_time: "", end_time: "", location: "", notes: "" };
          }
        }

        enrichedShifts.push({
          ...assignment,
          shift_name: shiftType.name || "Unnamed Shift",
          start_time: shiftType.start_time,
          end_time: shiftType.end_time,
          location: shiftType.location,
          notes: shiftType.notes || shiftType.description,
        });
      }

      // Sort by start_date (most recent first)
      enrichedShifts.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
      setShifts(enrichedShifts);
      setLoading(false);
    };

    fetchShiftDetails();
  }, [assignments, router]);

  /* -------------------------------------------------------------
   *  Helpers
   * ------------------------------------------------------------- */
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const formatDateRange = (start, end) => {
    const options = { month: "short", day: "numeric" };
    const startDate = new Date(start).toLocaleDateString("en-US", options);
    const endDate = new Date(end).toLocaleDateString("en-US", options);
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();

    if (startDate === endDate) return startDate;
    return `${startDate} ${startYear} → ${endDate} ${endYear}`;
  };

  /* -------------------------------------------------------------
   *  Skeleton Loader Component
   * ------------------------------------------------------------- */
  const SkeletonCard = () => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-6 bg-gray-200 rounded w-40"></div>
        <div className="h-5 bg-indigo-100 rounded-full w-24"></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-5 bg-gray-200 rounded w-28"></div>
        <div className="h-5 bg-gray-200 rounded w-28"></div>
      </div>
      <div className="mt-3 h-4 bg-gray-200 rounded w-36"></div>
    </div>
  );

  /* -------------------------------------------------------------
   *  Render
   * ------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm h-full flex flex-col">
        <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Your Shift Schedule
        </h2>
        <div className="flex-1 overflow-y-auto space-y-4">
          {[1].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px] rounded-lg bg-white p-6 shadow-md">
        <p className="text-red-600 font-semibold text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm h-full flex flex-col">
      <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
        Your Shift Schedule
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4">
        {shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-5 p-4 bg-yellow-100 rounded-full">
              <svg className="w-12 h-12 text-[#153087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-yellow-800 mb-1">
              No shifts assigned yet
            </p>
            <p className="text-sm text-[#153087]">
              Contact your administrator for scheduling.
            </p>
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-gray-900">
                  {shift.shift_name}
                </h4>
                <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                  {formatDateRange(shift.start_date, shift.end_date)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Time:</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                  </span>
                </div>
                {shift.location && (
                  <div>
                    <span className="text-gray-600">Location:</span>{" "}
                    <span className="font-medium text-gray-800">{shift.location}</span>
                  </div>
                )}
              </div>

              {shift.notes && (
                <div className="mt-3 text-sm italic text-gray-600 border-t border-gray-200 pt-2">
                  <strong>Note:</strong> {shift.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
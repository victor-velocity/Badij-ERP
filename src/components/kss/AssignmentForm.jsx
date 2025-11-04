// components/kss/AssignmentForm.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import { createClient } from "@/app/lib/supabase/client";

const supabase = createClient();

export default function AssignmentForm({ moduleId, onSuccess }) {
  const router = useRouter();

  // Form state
  const [targetType, setTargetType] = useState("all");
  const [targetValue, setTargetValue] = useState("");
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptError, setDeptError] = useState(null);

  // Submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -----------------------------------------------------------------
  // 2. Fetch departments **directly from Supabase** when needed
  // -----------------------------------------------------------------
  useEffect(() => {
    if (targetType !== "department") {
      setDepartments([]);
      setTargetValue("");
      setDeptError(null);
      return;
    }

    const fetchDepts = async () => {
      setDeptLoading(true);
      setDeptError(null);
      try {
        const { data, error } = await supabase
          .from("departments")
          .select("id, name")
          .order("name", { ascending: true });

        if (error) throw error;
        setDepartments(data || []);
      } catch (err) {
        console.error("Supabase dept error:", err);
        setDeptError("Failed to load departments");
      } finally {
        setDeptLoading(false);
      }
    };

    fetchDepts();
  }, [targetType]);

  // -----------------------------------------------------------------
  // 3. Build payload according to spec
  // -----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let finalValue = null;

    if (targetType === "all") {
      finalValue = "ALL";
    } else if (targetType === "department") {
      if (!targetValue) {
        setError("Please select a department");
        setLoading(false);
        return;
      }
      finalValue = targetValue; // UUID
    } else if (targetType === "role") {
      if (!["user", "manager", "hr_manager"].includes(targetValue)) {
        setError("Please select a valid role");
        setLoading(false);
        return;
      }
      finalValue = targetValue;
    }

    const payload = {
      target_type: targetType,
      target_value: finalValue,
    };

    try {
      // Uses your existing apiService (POST to Flask)
      await apiService.createAssignment(moduleId, payload, router);
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Failed to assign module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------- TARGET TYPE ---------- */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Target Type
        </label>
        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setTargetValue("");
            setError(null);
          }}
          className="w-full px-3 py-2 border border-solid border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
        >
          <option value="all">All Employees</option>
          <option value="department">Department</option>
          <option value="role">Role</option>
        </select>
      </div>

      {/* ---------- DEPARTMENT SELECT ---------- */}
      {targetType === "department" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department *
          </label>
          {deptLoading ? (
            <p className="mt-2 text-sm text-gray-500">Loading departments...</p>
          ) : deptError ? (
            <p className="mt-2 text-sm text-red-600">{deptError}</p>
          ) : departments.length > 0 ? (
            <select
              required
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No departments found</p>
          )}
        </div>
      )}

      {/* ---------- ROLE SELECT ---------- */}
      {targetType === "role" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Role *
          </label>
          <select
            required
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
          >
            <option value="">Select a role</option>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="hr_manager">HR Manager</option>
          </select>
        </div>
      )}

      {/* ---------- ERROR ---------- */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ---------- SUBMIT ---------- */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || deptLoading}
          className="rounded bg-[#d4a53b] px-6 py-2 text-white hover:bg-[#c49632] disabled:opacity-70 transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Assigning…
            </>
          ) : (
            "Assign Module"
          )}
        </button>
      </div>
    </form>
  );
}
// components/hr/employees/EmployeeDetails.jsx
"use client";

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import Image from "next/image";
import { faLocation, faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  faFileAlt,
  faDownload,
  faSignature,
  faFolderOpen,
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const DEFAULT_AVATAR = "/default-profile.png";

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n ?? 0);

const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

// Skeleton Components
const SkeletonAvatar = () => (
  <div className="w-20 h-20 bg-gray-300 rounded-full animate-pulse" />
);

const SkeletonText = ({ width = "w-32", height = "h-5" }) => (
  <div className={`bg-gray-200 rounded ${width} ${height} animate-pulse`} />
);

const SkeletonLine = () => <SkeletonText width="w-full" height="h-4" />;

const SkeletonCard = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm animate-pulse">
    <SkeletonText width="w-16" height="h-3" />
    <SkeletonText width="w-20" height="h-6" />
  </div>
);

const EmployeeDetailModal = ({ isOpen, onClose, employee: rawEmployee, router }) => {
  const [currentData, setCurrentData] = useState(null);        // salary + current month
  const [paymentHistory, setPaymentHistory] = useState([]);    // full payroll history
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  // Load current month salary + details
  useEffect(() => {
    if (!isOpen || !rawEmployee?.id) return;

    const loadCurrent = async () => {
      setLoadingCurrent(true);
      try {
        const data = await apiService.getEmployeePaymentById(rawEmployee.id, router);
        setCurrentData(data[0] ?? null);
      } catch (e) {
        console.error("Failed to load current employee data:", e);
      } finally {
        setLoadingCurrent(false);
      }
    };
    loadCurrent();
  }, [isOpen, rawEmployee?.id, router]);

  // Load full payment history
  useEffect(() => {
    if (!isOpen || !rawEmployee?.id) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await apiService.getEmployeePayroll(rawEmployee.id, router);
        setPaymentHistory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load payment history:", e);
        setPaymentHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [isOpen, rawEmployee?.id, router]);

  if (!isOpen || !rawEmployee) return null;

  const details = currentData?.["month-yearemployee_details"] ?? rawEmployee;
  const salary = currentData?.salary ?? {};
  const fullName = `${details.first_name ?? ""} ${details.last_name ?? ""}`.trim();

  // ==================== ID CARD DATA (Fix for ReferenceError) ====================
  const positionUpper = (rawEmployee.position || "Employee").toUpperCase();
  const departmentUpper = capitalize(details.department || "Department").toUpperCase();
  const employeeId = `MJ-${String(rawEmployee.id || "00000").padStart(5, "0")}`;

  const hireDateObj = rawEmployee.hire_date ? new Date(rawEmployee.hire_date) : null;
  const issueDate = hireDateObj ? formatDate(rawEmployee.hire_date) : "—";
  const expiryDate = hireDateObj
    ? formatDate(new Date(hireDateObj.getFullYear() + 5, hireDateObj.getMonth(), hireDateObj.getDate()))
    : "—";
  // =================================================================================

  const isLoading = loadingCurrent || loadingHistory;

  return (
    <div
      className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-500 hover:text-red-600 text-3xl z-10"
        >
          ×
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#b88b1b] to-[#d4a53b] text-white p-6 rounded-t-2xl">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <SkeletonAvatar />
              <div className="space-y-2">
                <SkeletonText width="w-48" height="h-8" />
                <SkeletonText width="w-36" height="h-5" />
                <SkeletonText width="w-32" height="h-4" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <img
                src={details.avatar_url || DEFAULT_AVATAR}
                alt={fullName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
              <div>
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <p className="text-sm opacity-90">{details.email}</p>
                <p className="text-xs opacity-80 mt-1">
                  {rawEmployee.position || "N/A"} • {capitalize(details.department || "N/A")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Info */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-[#b88b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h3>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <SkeletonText width="w-20" height="h-4" />
                    <SkeletonLine />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Address:</span>
                  <p className="font-semibold text-gray-800">
                    {`${rawEmployee.address || ""}, ${rawEmployee.city || ""}, ${rawEmployee.state || ""}, ${rawEmployee.country || ""}`}
                    {rawEmployee.zip_code && ` - ${rawEmployee.zip_code}`}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="font-semibold text-gray-800">{rawEmployee.phone_number || "—"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date of Birth:</span>
                  <p className="font-semibold text-gray-800">{formatDate(rawEmployee.date_of_birth)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Marital Status:</span>
                  <p className="font-semibold text-gray-800">{rawEmployee.marital_status || "—"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Hire Date:</span>
                  <p className="font-semibold text-gray-800">{formatDate(rawEmployee.hire_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p className="font-semibold text-gray-800">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${rawEmployee.employment_status === "active"
                        ? "bg-green-100 text-green-800"
                        : rawEmployee.employment_status === "on leave"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {capitalize(rawEmployee.employment_status)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Guarantor */}
          {(rawEmployee.guarantor_name || rawEmployee.guarantor_phone_number) && !isLoading && (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#b88b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Guarantor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="font-semibold text-gray-800">{rawEmployee.guarantor_name || "—"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="font-semibold text-gray-800">{rawEmployee.guarantor_phone_number || "—"}</p>
                </div>
              </div>
            </section>
          )}

          {/* Salary */}
          {isLoading ? (
            <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse mr-2" />
                <SkeletonText width="w-48" height="h-6" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </section>
          ) : salary.base_salary !== undefined ? (
            <section className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Current Salary Package
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Base</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(salary.base_salary)}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Bonus</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(salary.bonus)}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-600">Incentives</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(salary.incentives)}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-green-300">
                  <p className="text-xs text-gray-600">Gross</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(
                      Number(salary.base_salary ?? 0) +
                      Number(salary.bonus ?? 0) +
                      Number(salary.incentives ?? 0)
                    )}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Payment History */}
          {loadingHistory ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#b88b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Payment History
              </h3>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <SkeletonText width="w-40" height="h-5" />
                        <SkeletonText width="w-56" height="h-4" />
                      </div>
                      <div className="text-right space-y-1">
                        <SkeletonText width="w-24" height="h-6" />
                        <SkeletonText width="w-16" height="h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : paymentHistory.length > 0 ? (
            <section>
              <div className="flex justify-between items-center mb-6 gap-5 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#b88b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Payment History
                </h3>
                <button
                  onClick={() => setShowIdCard(true)}
                  className="flex items-center gap-2 bg-[#b88b1b] hover:bg-[#d4a53b] text-white font-medium py-2 px-4 rounded-lg shadow-lg transition transform hover:scale-105 mr-3 "
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h10m-9 4h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Print ID Card
                </button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {paymentHistory.map((p, i) => (
                  <div
                    key={p.id ?? i}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {formatDate(p.payment_date)} • {p.month_year || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Gross: {formatCurrency(p.gross_salary)} | Deductions: {formatCurrency(p.total_deductions)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-700">{formatCurrency(p.net_salary)}</p>
                        <p className="text-xs text-gray-500">Net Pay</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : !loadingHistory ? (
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#b88b1b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Payment History
              </h3>
              <p className="text-gray-500 italic">No payment history available.</p>
            </section>
          ) : null}

          {/* Signature & Documents Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
              <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 mr-2 text-[#b88b1b]" />
              Signature & Uploaded Documents
            </h3>

            <div className="space-y-8">

              {/* Employee Signature - Direct signature_url field */}
              {rawEmployee.signature_url && !isLoading && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-md">
                  <h4 className="text-xl font-bold text-indigo-800 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faSignature} className="w-6 h-6 mr-3 text-indigo-600" />
                    Employee Digital Signature
                  </h4>
                  <div className="flex flex-col md:flex-row items-center gap-6 bg-white rounded-xl p-6 shadow-inner">
                    <div className="flex-shrink-0">
                      <img
                        src={rawEmployee.signature_url}
                        alt="Employee Signature"
                        className="h-32 w-auto object-contain border border-gray-300 rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.src = "/signature-placeholder.png"; // fallback
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                    <div className="text-center md:text-left">
                      <p className="text-2xl font-bold text-gray-800">{fullName}</p>
                      <p className="text-sm text-gray-600 mt-1">{rawEmployee.position || "Employee"}</p>
                      <a
                        href={rawEmployee.signature_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        Download Signature
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Uploaded Documents */}
              {rawEmployee.employee_documents && rawEmployee.employee_documents.length > 0 && !isLoading && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faFolderOpen} className="w-5 h-5 mr-2 text-[#b88b1b]" />
                    Other Documents ({rawEmployee.employee_documents.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rawEmployee.employee_documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition">
                            <FontAwesomeIcon icon={faFileAlt} className="text-blue-700 text-xl" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm line-clamp-2">
                              {doc.name || `Document ${doc.id.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-gray-500 capitalize mt-1">
                              {doc.category || doc.type || "File"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {doc.created_at ? formatDate(doc.created_at) : ""}
                            </p>
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-blue-600 group-hover:text-blue-800 transition"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No signature & no documents */}
              {!rawEmployee.signature_url &&
                (!rawEmployee.employee_documents || rawEmployee.employee_documents.length === 0) &&
                !isLoading && (
                  <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FontAwesomeIcon icon={faFileAlt} className="text-4xl text-gray-300 mb-3" />
                    <p className="text-lg">No signature or documents uploaded yet.</p>
                  </div>
                )}
            </div>
          </section>
          {showIdCard && (
            <div
              className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-auto print:bg-white"
              onClick={() => setShowIdCard(false)}
            >
              <div className="relative min-w-4xl w-full p-8 flex" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-16 mt-20 print:mt-0 print:gap-12 w-full mx-auto">
                  {/* FRONT */}
                  <div className="h-[85mm] w-[50mm] bg-cover bg-center relative" style={{ backgroundImage: 'url("/id-card-01.svg")' }}>
                    <Image src={details.avatar_url || DEFAULT_AVATAR}
                      alt={fullName} width={100} height={100} className="w-18 h-18 rounded-full absolute top-[50.4px] left-[22.45px] translate-x-1/2 object-cover" />
                    <Image src='/logo-icon.jpg' width={100} height={100} alt="id card front page" className="w-7 absolute top-[50.4px] right-6 translate-x-1/2" />
                    <div className="absolute translate-x-1/2 -left-1/2 top-32 w-full">
                      <h2 className="text-center font-bold text-xl text-[#b88b1b]">{fullName || "Employee Name"}</h2>
                      <h4 className="text-center text-[14px] font-semibold">{rawEmployee.position || "Position"}</h4>
                      <hr className="w-[80%] text-[#b88b1b] mx-auto h-[2px] mt-2" />
                    </div>
                    <div className="absolute bottom-[48px] left-1/2 -translate-x-1/2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          JSON.stringify({
                            name: fullName,
                            dob: formatDate(rawEmployee.date_of_birth),
                            department: capitalize(details.department || "N/A"),
                            position: rawEmployee.position || "N/A",
                            status: capitalize(rawEmployee.employment_status || "active"),
                            id: employeeId,
                            issued: issueDate,
                            expires: expiryDate,
                          })
                        )}`}
                        alt="Employee Details QR"
                        className="w-20 h-20 mx-auto shadow-md"
                      />
                    </div>
                  </div>

                  {/* BACK */}
                  <div className="h-[85mm] w-[50mm] bg-cover bg-center relative" style={{ backgroundImage: 'url("/id-card-02.svg")' }}>
                    <Image src='/madisonjayng_logo.png' width={100} height={100} alt="id card front page" className="w-32 absolute top-[54px] -left-[37px] translate-x-1/2" />
                    <div className="absolute mx-2 top-24 w-[96%]">
                      <p className="text-[11.7px] text-gray-700">This is a property of <strong>Madison Jay</strong> and if found, kindly return to the address below or contact:</p>
                      <p className="text-[12px] text-gray-700 mt-2"><strong> <FontAwesomeIcon icon={faPhone} /> </strong> 09046746391, 08167392756</p>
                      <p className="text-[12px] text-gray-700 mt-2"><strong> <FontAwesomeIcon icon={faLocation} /> </strong> Alhaji Kanke CLose, Ikoyi, Lagos.</p>
                    </div>

                    <div className="absolute w-full bottom-10">
                      <hr className="w-[80%] mx-auto" />
                      <p className="text-center font-bold text-[14px] text-gray-500">Supervisor</p>
                    </div>
                  </div>
                </div>
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex gap-8 print:hidden z-50">
                  <button
                    onClick={() => window.print()}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-2xl transition transform hover:scale-105"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setShowIdCard(false)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-2xl transition transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
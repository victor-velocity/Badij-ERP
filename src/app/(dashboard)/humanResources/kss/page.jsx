// app/kss/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import ModuleForm from "@/components/kss/ModuleForm";
import LessonForm from "@/components/kss/LessonForm";
import AssignmentForm from "@/components/kss/AssignmentForm";
import QuestionForm from "@/components/kss/QuestionForm";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faPlus,
  faTrash,
  faUsers,
  faCheckCircle,
  faQuestionCircle,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { createClient } from "@/app/lib/supabase/client";

const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {title && <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>}
        <div className="mb-6">{children}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse space-y-3 rounded-lg border border-solid border-gray-400 p-5 bg-white">
    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
    <div className="h-4 w-full rounded bg-gray-200"></div>
    <div className="h-4 w-5/6 rounded bg-gray-200"></div>
  </div>
);

export default function KSS() {
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState("");

  // Modal states
  const [modModal, setModModal] = useState(false);
  const [lesModal, setLesModal] = useState(false);
  const [assModal, setAssModal] = useState(false);
  const [quesModal, setQuesModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selModule, setSelModule] = useState(null);
  const [selLesson, setSelLesson] = useState(null);
  const [selAssignment, setSelAssignment] = useState(null);
  const [selQuestion, setSelQuestion] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [delType, setDelType] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Employee progress states
  const [employeeData, setEmployeeData] = useState([]);
  const [employeeLessonMap, setEmployeeLessonMap] = useState({});
  const [employeeQuizMap, setEmployeeQuizMap] = useState({});
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const supabase = createClient();

  // Live Clock (WAT - Nigeria)
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const opts = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Africa/Lagos",
      };
      const formatted = d.toLocaleString("en-US", opts);
      setNow(formatted.replace(", ", " • "));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // FETCH ALL – modules + lessons + assignments + questions + PROGRESS + QUIZ + EMPLOYEES
  const fetchAll = async () => {
    try {
      setLoading(true);

      const modulesData = await apiService.getModules(router);
      if (!modulesData || !Array.isArray(modulesData))
        throw new Error("No modules returned");

      const sortedModules = [...modulesData].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      const { data: allDepts = [], error: deptErr } = await supabase
        .from("departments")
        .select("id, name");
      if (deptErr) console.warn("Dept load error:", deptErr);
      const deptMap = Object.fromEntries(allDepts.map((d) => [d.id, d.name]));

      const modulesWithData = await Promise.all(
        sortedModules.map(async (mod) => {
          const sortedLessons = [...(mod.lessons || [])].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );

          let assignments = [];
          try {
            assignments = await apiService.getAssignments(mod.id, router);
          } catch (e) {
            console.warn(`Assignments for module ${mod.id} failed:`, e.message);
          }

          const enrichedAssignments = assignments.map((ass) => {
            let label = "";

            if (ass.department_id && deptMap[ass.department_id]) {
              label = `Department: ${deptMap[ass.department_id]}`;
            } else if (ass.role) {
              const roleName = ass.role
                .split("_")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
              label = `Role: ${roleName}`;
            } else {
              label = "All Employees";
            }

            return {
              ...ass,
              displayLabel: label,
            };
          });

          let questions = [];
          try {
            questions = await apiService.getQuestions(mod.id, router);
          } catch (e) {
            console.warn(`Questions for module ${mod.id} failed:`, e.message);
          }

          const progressStats = {
            totalAssignedEmployees: 0,
            lessonCompleteCount: {},
            moduleCompleted: 0,
            moduleCompletionPercent: 0,
            quizCompleted: 0,
            quizPassed: 0,
            averageScore: 0,
          };

          let employees = [];
          let lessonMap = {};
          let quizMap = {};

          if (assignments.length) {
            const employeeIds = new Set();

            for (const ass of assignments) {
              // 1. All Employees
              if (!ass.role && !ass.department_id) {
                const { data: emps = [] } = await supabase
                  .from("employees")
                  .select("id")
                  .neq("employment_status", "terminated");
                emps.forEach(e => employeeIds.add(e.id));
                continue;
              }

              // 2. Department assignment
              if (ass.department_id) {
                const { data: emps = [] } = await supabase
                  .from("employees")
                  .select("id")
                  .eq("department_id", ass.department_id)
                  .neq("employment_status", "terminated");
                emps.forEach(e => employeeIds.add(e.id));
              }

              // 3. Role assignment — FIXED & WORKING
              if (ass.role) {
                const { data: userIds = [], error: rpcError } = await supabase
                  .rpc("get_user_ids_by_role", { target_role: ass.role });

                if (rpcError) {
                  console.warn("RPC error for role", ass.role, rpcError);
                  continue;
                }

                if (userIds.length === 0) continue;

                const authUserIds = userIds.map(u => u.user_id);

                const { data: emps = [] } = await supabase
                  .from("employees")
                  .select("id")
                  .in("user_id", authUserIds)
                  .neq("employment_status", "terminated");

                emps.forEach(e => employeeIds.add(e.id));
              }
            }

            const empArr = Array.from(employeeIds);
            progressStats.totalAssignedEmployees = empArr.length;

            // Final fetch: full employee details
            if (empArr.length > 0) {
              const { data: emps = [] } = await supabase
                .from("employees")
                .select(`
                  id,
                  user_id,
                  first_name,
                  last_name,
                  email,
                  employment_status,
                  department:department_id (name)
                `)
                .in("id", empArr)
                .neq("employment_status", "terminated");

              employees = emps.map(e => ({
                ...e,
                name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Unknown",
                department_name: e.department?.name || "No Department",
              }));
            }
          }

          return {
            ...mod,
            lessons: sortedLessons,
            assignments: enrichedAssignments,
            questions: Array.isArray(questions) ? questions : [],
            progressStats,
            employees,
            employeeLessonMap: lessonMap,
            employeeQuizMap: quizMap,
          };
        })
      );

      setModules(modulesWithData);
      setError(null);
    } catch (e) {
      console.error("fetchAll error:", e);
      setError(e.message ?? "Failed to load data");
      toast.error(e.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [router]);

  // CRUD Handlers
  const openCreateModule = () => {
    setSelModule(null);
    setModModal(true);
  };
  const openEditModule = (m) => {
    setSelModule(m);
    setModModal(true);
  };
  const openCreateLesson = (m) => {
    setSelModule(m);
    setSelLesson(null);
    setLesModal(true);
  };
  const openEditLesson = (l) => {
    setSelLesson(l);
    setLesModal(true);
  };
  const openCreateAssignment = (m) => {
    setSelModule(m);
    setAssModal(true);
  };
  const openCreateQuestion = (m) => {
    setSelModule(m);
    setSelQuestion(null);
    setQuesModal(true);
  };
  const openEditQuestion = (q) => {
    setSelQuestion(q);
    setQuesModal(true);
  };
  const openViewDetails = (m) => {
    setSelectedModule(m);
    setEmployeeData(m.employees || []);
    setEmployeeLessonMap(m.employeeLessonMap || {});
    setEmployeeQuizMap(m.employeeQuizMap || {});
    setEmployeeSearch("");
    setCurrentPage(1);
    setViewModal(true);
  };

  const openDelete = (item, type) => {
    if (type === "module") setSelModule(item);
    else if (type === "lesson") {
      setSelLesson(item);
      setSelModule(item.module || modules.find((m) => m.id === item.module_id));
    } else if (type === "assignment") {
      setSelAssignment(item);
      setSelModule({ id: item.module_id });
    } else if (type === "question") {
      setSelQuestion(item);
      setSelModule({ id: item.module_id });
    }
    setDelType(type);
    setDelModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (delType === "module") {
        await apiService.deleteModule(selModule.id, router);
        toast.success("Module deleted");
      } else if (delType === "lesson") {
        await apiService.deleteLesson(selLesson.id, router);
        toast.success("Lesson deleted");
      } else if (delType === "assignment") {
        await apiService.deleteAssignment(selAssignment.id, router);
        toast.success("Assignment removed");
      } else if (delType === "question") {
        await apiService.deleteQuestion(selQuestion.id, router);
        toast.success("Question deleted");
      }
      await fetchAll();
    } catch (e) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeleting(false);
      setDelModal(false);
      setSelAssignment(null);
      setSelLesson(null);
      setSelModule(null);
      setSelQuestion(null);
    }
  };

  const afterSave = async () => {
    setModModal(false);
    setLesModal(false);
    setAssModal(false);
    setQuesModal(false);
    toast.success("Saved successfully");
    await fetchAll();
  };

  // Pagination & Filter
  const filteredEmployees = employeeData
    .filter(emp => emp.employment_status !== "terminated") // Extra safety
    .filter(emp =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearch.toLowerCase())
    );

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-14 mt-5">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Sharing System</h1>
          <p className="mt-2 text-gray-500 font-medium">
            Manage training modules, lessons, assignments, quizzes & track progress
          </p>
        </div>
        <span className="rounded-[20px] border border-gray-300 px-3 py-2 text-gray-500">
          {now}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-7">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="rounded bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">No modules yet.</p>
            <button
              onClick={openCreateModule}
              className="mt-4 rounded bg-[#d4a53b] px-6 py-2 text-white hover:bg-[#c49632] transition"
            >
              Create First Module
            </button>
          </div>
        ) : (
          modules.map((mod, modIdx) => {
            const stats = mod.progressStats || {};
            const hasProgress = stats.totalAssignedEmployees > 0;

            return (
              <div
                key={mod.id}
                className="rounded-xl border border-solid border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#153087]">
                        Module {modIdx + 1}: {mod.title}
                      </h3>
                      <p className="text-sm opacity-90 text-gray-900 font-bold">{mod.description}</p>

                      {hasProgress && (
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faUsers} className="text-yellow-700" />
                            <span>{stats.totalAssignedEmployees} assigned</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-600" />
                            <span>
                              {stats.moduleCompleted} completed lessons (
                              {stats.moduleCompletionPercent}%)
                            </span>
                          </div>
                          {stats.quizCompleted > 0 && (
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-700" />
                              <span>
                                {stats.quizCompleted} took quiz • {stats.quizPassed} passed •
                                Avg: {stats.averageScore}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openViewDetails(mod);
                        }}
                        className="p-2"
                        title="View details"
                      >
                        <FontAwesomeIcon
                          className="text-yellow-500 hover:text-yellow-800 transition"
                          icon={faEye}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModule(mod);
                        }}
                        className="p-2"
                        title="Edit module"
                      >
                        <FontAwesomeIcon
                          className="text-blue-600 hover:text-blue-800 transition"
                          icon={faEdit}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(mod, "module");
                        }}
                        className="p-2"
                        title="Delete module"
                      >
                        <FontAwesomeIcon
                          className="text-red-600 hover:text-red-800 transition"
                          icon={faTrash}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating + Button */}
      {!loading && modules.length > 0 && (
        <button
          onClick={openCreateModule}
          className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a53b] text-3xl text-white shadow-lg hover:bg-[#c49632] transition-all duration-300"
          title="Create new module"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {/* VIEW DETAILS MODAL */}
      <CustomModal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title=""
      >
        {selectedModule && (
          <div className="space-y-6">
            {/* Header: Title + Live Info */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#153087]">
                    {selectedModule.title}
                  </h2>
                  {selectedModule.description && (
                    <p className="mt-1 text-sm text-gray-700">{selectedModule.description}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="flex items-center justify-end gap-2 text-gray-500 font-medium">
                    <span>{now}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-lg">NG</span>
                    <span className="text-xs text-gray-500">Nigeria</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Summary */}
            {selectedModule.progressStats.totalAssignedEmployees > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3">Training Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedModule.progressStats.totalAssignedEmployees}
                    </div>
                    <div className="text-xs text-gray-600">Assigned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedModule.progressStats.moduleCompleted}
                    </div>
                    <div className="text-xs text-gray-600">
                      Completed Lessons ({selectedModule.progressStats.moduleCompletionPercent}%)
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedModule.progressStats.quizCompleted}
                    </div>
                    <div className="text-xs text-gray-600">
                      Took Quiz • <strong className="text-green-600">
                        {selectedModule.progressStats.quizPassed} Passed
                      </strong> • Avg: {selectedModule.progressStats.averageScore}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Employee Table */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Employee Progress ({selectedModule.progressStats.totalAssignedEmployees} total)
              </h4>

              <input
                type="text"
                placeholder="Search employees..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full mb-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4a53b]"
              />

              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lessons
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quiz
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedEmployees.map((emp) => {
                      const lessonCount = employeeLessonMap[emp.id]?.completed || 0;
                      const quiz = employeeQuizMap[emp.id];
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{emp.name}</div>
                              <div className="text-xs text-gray-500">{emp.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <div>
                              <span className="font-medium">{lessonCount}</span>/{selectedModule.lessons.length}
                            </div>
                            {selectedModule.lessons.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {Math.round((lessonCount / selectedModule.lessons.length) * 100)}%
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {quiz ? (
                              <div>
                                <span className={`font-medium ${quiz.passed ? "text-green-600" : "text-red-600"}`}>
                                  {quiz.score}%
                                </span>
                                <div className="text-xs text-gray-500">
                                  {quiz.passed ? "Passed" : "Failed"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not taken</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, filteredEmployees.length)} of{" "}
                    {filteredEmployees.length} employees
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lessons */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  Lessons ({selectedModule.lessons?.length ?? 0})
                </h4>
                <button
                  onClick={() => {
                    setSelModule(selectedModule);
                    setSelLesson(null);
                    setLesModal(true);
                    setViewModal(false);
                  }}
                  className="text-sm font-medium text-[#153087] hover:underline"
                >
                  + Add Lesson
                </button>
              </div>

              {selectedModule.lessons?.length ? (
                <div className="space-y-3">
                  {selectedModule.lessons.map((les, lesIdx) => {
                    const completed =
                      selectedModule.progressStats.lessonCompleteCount?.[les.id] || 0;
                    const total = selectedModule.progressStats.totalAssignedEmployees || 0;

                    return (
                      <div
                        key={les.id}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-bold text-[#153087] text-sm min-w-[40px]">
                            {lesIdx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 truncate">
                              {les.title}
                            </h5>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {les.description}
                            </p>
                            {les.youtube_link && (
                              <a
                                href={les.youtube_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center text-xs text-[#153087] font-medium hover:underline"
                              >
                                Watch Video
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="text-right min-w-[100px] px-4">
                          <div className="text-sm font-medium text-gray-700">
                            {completed}/{total}
                          </div>
                          {total > 0 && (
                            <div className="text-xs text-gray-500">
                              {Math.round((completed / total) * 100)}%
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelLesson(les);
                              setLesModal(true);
                              setViewModal(false);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800"
                            title="Edit lesson"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => openDelete(les, "lesson")}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Delete lesson"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="italic text-sm text-gray-500">No lessons yet.</p>
              )}
            </div>

            {/* Quiz Questions */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  Quiz Questions ({selectedModule.questions?.length ?? 0})
                </h4>
                <button
                  onClick={() => {
                    setSelModule(selectedModule);
                    setSelQuestion(null);
                    setQuesModal(true);
                    setViewModal(false);
                  }}
                  className="text-sm font-medium text-[#153087] hover:underline"
                >
                  + Add Question
                </button>
              </div>

              {selectedModule.questions?.length ? (
                <div className="space-y-3">
                  {selectedModule.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[#153087] text-sm">
                              Q{qIdx + 1}.
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {q.question_type === "multiple_choice"
                                ? "Multiple Choice"
                                : "Short Answer"}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{q.question_text}</p>

                          {q.question_type === "multiple_choice" && (
                            <div className="mt-2 space-y-1 text-sm">
                              {Object.entries(q.options || {}).map(([key, val]) => (
                                <div
                                  key={key}
                                  className={`pl-6 ${key === q.correct_answer
                                    ? "text-green-700 font-medium"
                                    : "text-gray-600"
                                    }`}
                                >
                                  {key}. {val}
                                  {key === q.correct_answer && " (Correct)"}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.question_type === "short_answer" && (
                            <p className="mt-2 text-sm text-green-700 font-medium pl-6">
                              Answer: {q.correct_answer}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => {
                              setSelQuestion(q);
                              setQuesModal(true);
                              setViewModal(false);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800"
                            title="Edit question"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => openDelete(q, "question")}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Delete question"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-sm text-gray-500">No quiz questions yet.</p>
              )}
            </div>

            {/* Assignments */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                  Assignments ({selectedModule.assignments?.length ?? 0})
                </h4>
                <button
                  onClick={() => {
                    setSelModule(selectedModule);
                    setAssModal(true);
                    setViewModal(false);
                  }}
                  className="text-sm font-medium text-[#153087] hover:underline"
                >
                  + Assign Module
                </button>
              </div>

              {selectedModule.assignments?.length ? (
                <div className="space-y-3">
                  {selectedModule.assignments.map((ass) => (
                    <div
                      key={ass.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <span className="font-medium text-gray-800">{ass.displayLabel}</span>
                      <button
                        onClick={() => openDelete(ass, "assignment")}
                        className="p-2 text-red-600 hover:text-red-800 transition"
                        title="Remove assignment"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-sm text-gray-500">
                  Not assigned to anyone yet.
                </p>
              )}
            </div>
          </div>
        )}
      </CustomModal>

      {/* OTHER MODALS */}
      <CustomModal
        isOpen={modModal}
        onClose={() => setModModal(false)}
        title={selModule ? "Update Module" : "Create New Module"}
      >
        <ModuleForm initialData={selModule} onSuccess={afterSave} />
      </CustomModal>

      <CustomModal
        isOpen={lesModal}
        onClose={() => setLesModal(false)}
        title={`${selLesson ? "Update" : "Create"} Lesson`}
      >
        <LessonForm
          moduleId={selModule?.id}
          initialData={selLesson}
          onSuccess={afterSave}
        />
      </CustomModal>

      <CustomModal
        isOpen={assModal}
        onClose={() => setAssModal(false)}
        title={`Assign Module${selModule ? ` – ${selModule.title}` : ""}`}
      >
        <AssignmentForm moduleId={selModule?.id} onSuccess={afterSave} />
      </CustomModal>

      <CustomModal
        isOpen={quesModal}
        onClose={() => setQuesModal(false)}
        title={selQuestion ? "Update Question" : "Create New Question"}
      >
        <QuestionForm
          moduleId={selModule?.id}
          initialData={selQuestion}
          onSuccess={afterSave}
        />
      </CustomModal>

      <CustomModal
        isOpen={delModal}
        onClose={() => setDelModal(false)}
        title="Confirm Delete"
      >
        <div className="text-gray-700 space-y-3">
          <p>
            Are you sure you want to delete this <strong>{delType}</strong>?
          </p>
          <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded">
            {delType === "module"
              ? selModule?.title
              : delType === "lesson"
                ? selLesson?.title
                : delType === "assignment"
                  ? selAssignment?.displayLabel ||
                  `Assignment ${selAssignment?.id?.slice(0, 8)}…`
                  : delType === "question"
                    ? selQuestion?.question_text?.slice(0, 60) + "..."
                    : "Unknown"}
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition ${deleting
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
              }`}
          >
            {deleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </CustomModal>
    </div>
  );
}
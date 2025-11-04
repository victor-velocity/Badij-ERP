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
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded bg-gray-500 px-6 py-2 text-white hover:bg-gray-600 transition"
          >
            Cancel
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
  const [openModuleId, setOpenModuleId] = useState(null);

  // Modal states
  const [modModal, setModModal] = useState(false);
  const [lesModal, setLesModal] = useState(false);
  const [assModal, setAssModal] = useState(false);
  const [quesModal, setQuesModal] = useState(false);
  const [delModal, setDelModal] = useState(false);
  const [selModule, setSelModule] = useState(null);
  const [selLesson, setSelLesson] = useState(null);
  const [selAssignment, setSelAssignment] = useState(null);
  const [selQuestion, setSelQuestion] = useState(null);
  const [delType, setDelType] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Clock
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
      };
      setNow(d.toLocaleString("en-US", opts));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // -----------------------------------------------------------------
  // FETCH ALL – modules + lessons + assignments + questions + PROGRESS
  // -----------------------------------------------------------------
  const fetchAll = async () => {
    try {
      setLoading(true);
      const modulesData = await apiService.getModules(router);
      if (!modulesData || !Array.isArray(modulesData))
        throw new Error("No modules returned");

      const sortedModules = [...modulesData].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      const modulesWithData = await Promise.all(
        sortedModules.map(async (mod) => {
          // Sort lessons
          const sortedLessons = [...(mod.lessons || [])].sort(
            (a, b) =>
              new Date(a.created_at || new Date()) -
              new Date(b.created_at || new Date())
          );

          // Assignments
          let assignments = [];
          try {
            assignments = await apiService.getAssignments(mod.id, router);
          } catch (e) {
            console.warn(`Assignments for module ${mod.id} failed:`, e.message);
          }

          // Questions
          let questions = [];
          try {
            questions = await apiService.getQuestions(mod.id, router);
          } catch (e) {
            console.warn(`Questions for module ${mod.id} failed:`, e.message);
          }

          // === PROGRESS STATS ===
          let progressStats = {
            totalAssignedEmployees: 0,
            lessonCompleteCount: {},
            moduleCompleted: 0,
            moduleCompletionPercent: 0,
          };

          if (assignments.length > 0) {
            const employeeIds = new Set();

            for (const ass of assignments) {
              if (ass.target_type === "all") {
                const allEmps = await supabase.from('employees').select('id').execute();
                allEmps.data?.forEach(e => employeeIds.add(e.id));
              } else if (ass.target_type === "department") {
                const depts = await supabase
                  .from('employees')
                  .select('id')
                  .eq('department', ass.target_value)
                  .execute();
                depts.data?.forEach(e => employeeIds.add(e.id));
              } else if (ass.target_type === "role") {
                const roles = await supabase
                  .from('employees')
                  .select('id')
                  .eq('role', ass.target_value)
                  .execute();
                roles.data?.forEach(e => employeeIds.add(e.id));
              }
            }

            progressStats.totalAssignedEmployees = employeeIds.size;

            if (progressStats.totalAssignedEmployees > 0 && sortedLessons.length > 0) {
              const progressResp = await supabase
                .from('employee_lesson_progress')
                .select('lesson_id, employee_id, is_completed')
                .in_('employee_id', Array.from(employeeIds))
                .in_('lesson_id', sortedLessons.map(l => l.id))
                .execute();

              const lessonCompleteCount = {};
              const employeeLessonCounts = {};

              progressResp.data?.forEach(p => {
                if (p.is_completed) {
                  lessonCompleteCount[p.lesson_id] = (lessonCompleteCount[p.lesson_id] || 0) + 1;
                  employeeLessonCounts[p.employee_id] = (employeeLessonCounts[p.employee_id] || 0) + 1;
                }
              });

              const completedAll = Object.values(employeeLessonCounts).filter(
                count => count === sortedLessons.length
              ).length;

              progressStats = {
                ...progressStats,
                lessonCompleteCount,
                moduleCompleted: completedAll,
                moduleCompletionPercent: Math.round((completedAll / progressStats.totalAssignedEmployees) * 100),
              };
            }
          }

          return {
            ...mod,
            lessons: sortedLessons,
            assignments: Array.isArray(assignments) ? assignments : [],
            questions: Array.isArray(questions) ? questions : [],
            progressStats,
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

  // Accordion
  const toggleModule = (moduleId) => {
    setOpenModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

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

  const openDelete = (item, type) => {
    if (type === "module") setSelModule(item);
    else if (type === "lesson") {
      setSelLesson(item);
      setSelModule(item.module || modules.find(m => m.id === item.module_id));
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
      <div className="space-y-10">
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
            const isOpen = openModuleId === mod.id;
            const stats = mod.progressStats || {};
            const hasProgress = stats.totalAssignedEmployees > 0;

            return (
              <div
                key={mod.id}
                className="overflow-hidden rounded-lg border border-solid border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleModule(mod.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleModule(mod.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full text-left bg-gradient-to-r from-[#d4a53b] to-[#e6c070] p-5 text-white hover:from-[#c49632] hover:to-[#d4a53b] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={`h-5 w-5 transform transition-transform ${isOpen ? "rotate-90" : ""}`}
                      />
                      <div>
                        <h3 className="text-lg font-bold">
                          Module {modIdx + 1}: {mod.title}
                        </h3>
                        <p className="text-sm opacity-90">{mod.description}</p>
                        {hasProgress && (
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <FontAwesomeIcon icon={faUsers} className="text-yellow-200" />
                            <span>{stats.totalAssignedEmployees} employees</span>
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className={`ml-2 ${
                                stats.moduleCompletionPercent >= 80
                                  ? "text-green-300"
                                  : stats.moduleCompletionPercent >= 50
                                  ? "text-yellow-300"
                                  : "text-red-300"
                              }`}
                            />
                            <span>{stats.moduleCompletionPercent}% complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
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

                {/* Accordion Body */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-y-auto ${
                    isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="bg-gray-50 p-5 border-t border-gray-300 space-y-6">
                    {/* Lessons */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-gray-700">
                          Lessons ({mod.lessons?.length ?? 0})
                        </h4>
                        <button
                          onClick={() => openCreateLesson(mod)}
                          className="text-sm font-medium text-[#b88b1b] hover:underline"
                        >
                          + Add Lesson
                        </button>
                      </div>

                      {mod.lessons?.length ? (
                        <div className="space-y-3">
                          {mod.lessons.map((les, lesIdx) => {
                            const completed = stats.lessonCompleteCount?.[les.id] || 0;
                            const total = stats.totalAssignedEmployees || 0;
                            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                            return (
                              <div
                                key={les.id}
                                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-center gap-4">
                                  <span className="font-bold text-[#b88b1b] text-sm min-w-[40px]">
                                    {modIdx + 1}.{lesIdx + 1}
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
                                        className="mt-2 inline-flex items-center text-xs text-[#b88b1b] font-medium hover:underline"
                                      >
                                        Watch Video
                                      </a>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right min-w-[120px]">
                                  <div className="text-sm font-medium text-gray-700">
                                    {completed}/{total}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div
                                      className="bg-gradient-to-r from-[#d4a53b] to-[#e6c070] h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">{percent}%</div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => openEditLesson(les)}
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
                        <h4 className="font-bold text-gray-700">
                          Quiz Questions ({mod.questions?.length ?? 0})
                        </h4>
                        <button
                          onClick={() => openCreateQuestion(mod)}
                          className="text-sm font-medium text-[#b88b1b] hover:underline"
                        >
                          + Add Question
                        </button>
                      </div>

                      {mod.questions?.length ? (
                        <div className="space-y-3">
                          {mod.questions.map((q, qIdx) => (
                            <div
                              key={q.id}
                              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-[#b88b1b] text-sm">
                                      Q{qIdx + 1}.
                                    </span>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {q.question_type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}
                                    </span>
                                  </div>
                                  <p className="font-medium text-gray-900">{q.question_text}</p>

                                  {q.question_type === "multiple_choice" && (
                                    <div className="mt-2 space-y-1 text-sm">
                                      {Object.entries(q.options || {}).map(([key, val]) => (
                                        <div
                                          key={key}
                                          className={`pl-6 ${
                                            key === q.correct_answer
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
                                    onClick={() => openEditQuestion(q)}
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

                    {/* Assignments & Module Progress */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-gray-700">
                          Assignments ({mod.assignments?.length ?? 0})
                        </h4>
                        <button
                          onClick={() => openCreateAssignment(mod)}
                          className="text-sm font-medium text-[#b88b1b] hover:underline"
                        >
                          + Assign Module
                        </button>
                      </div>

                      {mod.assignments?.length ? (
                        <div className="space-y-3 mb-6">
                          {mod.assignments.map((ass) => {
                            const type = ass.target_type?.toLowerCase();
                            const label =
                              type === "all"
                                ? "All Employees"
                                : type === "department"
                                ? `Department: ${ass.target_value}`
                                : `Role: ${ass.target_value}`;

                            return (
                              <div
                                key={ass.id}
                                className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                              >
                                <span className="font-medium text-gray-800">{label}</span>
                                <button
                                  onClick={() => openDelete(ass, "assignment")}
                                  className="p-2 text-red-600 hover:text-red-800 transition"
                                  title="Remove assignment"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="italic text-sm text-gray-500 mb-6">
                          Not assigned to anyone yet.
                        </p>
                      )}

                      {/* Module Completion Summary */}
                      {hasProgress && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-blue-800 flex items-center gap-2">
                              <FontAwesomeIcon icon={faCheckCircle} />
                              Module Completion
                            </h5>
                            <span className="font-bold text-blue-700">
                              {stats.moduleCompleted}/{stats.totalAssignedEmployees}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-[#d4a53b] h-3 rounded-full transition-all duration-700"
                              style={{ width: `${stats.moduleCompletionPercent}%` }}
                            />
                          </div>
                          <p className="text-sm text-blue-700 mt-2 font-medium">
                            {stats.moduleCompletionPercent}% of employees completed all lessons
                          </p>
                        </div>
                      )}
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
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#d4a53b] text-3xl text-white shadow-lg hover:bg-[#c49632] transition-all duration-300"
          title="Create new module"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      )}

      {/* Modals */}
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
          <p>Are you sure you want to delete this <strong>{delType}</strong>?</p>
          <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded">
            {delType === "module"
              ? selModule?.title
              : delType === "lesson"
              ? selLesson?.title
              : delType === "assignment"
              ? (() => {
                  const type = selAssignment?.target_type?.toLowerCase();
                  return type === "all"
                    ? "All Employees"
                    : `${type === "department" ? "Department" : "Role"}: ${selAssignment?.target_value}`;
                })()
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
            onClick={() => setDelModal(false)}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition ${
              deleting
                ? "bg-red-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
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
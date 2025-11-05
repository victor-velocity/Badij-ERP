"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faPlayCircle,
  faCheckCircle,
  faPaperPlane,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <div className="mb-6">{children}</div>
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

export default function EmployeeKSS() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState("");
  const [openModuleId, setOpenModuleId] = useState(null);
  const [viewedLessons, setViewedLessons] = useState({});
  const [savingLessons, setSavingLessons] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizModal, setShowQuizModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch employee ID
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const profile = await apiService.getEmployees(router);
        setEmployeeId(profile.id);
      } catch (e) {
        console.error("Failed to get employee ID", e);
        toast.error("Please log in again");
        router.push("/login");
      }
    };
    fetchEmployee();
  }, [router]);

  // Fetch modules + completion status
  const fetchModules = async () => {
    if (!employeeId) return;

    try {
      setLoading(true);
      const data = await apiService.getModules(router);
      if (!data || !Array.isArray(data)) throw new Error("No modules returned");

      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      const fullModules = await Promise.all(
        sorted.map(async (mod) => {
          const sortedLessons = [...(mod.lessons || [])].sort(
            (a, b) =>
              new Date(a.created_at || new Date()) -
              new Date(b.created_at || new Date())
          );

          let questions = [];
          try {
            questions = await apiService.getQuestions(mod.id, router);
          } catch (e) {
            console.warn(`Questions failed for ${mod.id}:`, e);
          }

          // === Use backend completion endpoint ===
          let progress = {};
          let isCompleted = false;
          try {
            const completion = await apiService.checkModuleCompletion(mod.id, { employee_id: employeeId }, router);
            isCompleted = completion.all_lessons_completed === true;

            if (isCompleted) {
              // Mark all lessons as completed
              sortedLessons.forEach((lesson) => {
                progress[lesson.id] = true;
              });
            } else {
              // Optional: fetch individual progress if not fully complete
              try {
                const prog = await apiService.getLessonProgress?.(mod.id, router);
                if (prog) {
                  prog.forEach((p) => {
                    progress[p.lesson_id] = p.is_completed;
                  });
                }
              } catch (e) {
                console.warn("Individual progress fetch failed:", e);
              }
            }
          } catch (e) {
            console.warn(`Completion check failed for ${mod.id}:`, e);
          }

          let savedAnswers = {};
          try {
            const answers = await apiService.getQuizAnswers?.(mod.id, router);
            if (answers) {
              answers.forEach((a) => {
                savedAnswers[a.question_id] = a.answer;
              });
            }
          } catch (e) {
            console.warn("Quiz answers fetch failed:", e);
          }

          return {
            ...mod,
            lessons: sortedLessons,
            questions: Array.isArray(questions) ? questions : [],
            progress,
            savedAnswers,
            isCompleted,
          };
        })
      );

      setModules(fullModules);
      setError(null);
    } catch (e) {
      console.error("fetchModules error:", e);
      setError(e.message ?? "Failed to load your training");
      toast.error(e.message ?? "Failed to load training");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) fetchModules();
  }, [employeeId, router]);

  const toggleModule = (id) => {
    setOpenModuleId((prev) => (prev === id ? null : id));
  };

  // Click video → track only if not done
  const handleVideoClick = async (lessonId) => {
    if (!employeeId) return;

    const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId));
    if (!mod) return;

    const lesson = mod.lessons.find((l) => l.id === lessonId);
    const alreadyCompleted = mod.progress[lessonId] === true;

    // Open video immediately if already done
    if (alreadyCompleted) {
      window.open(lesson.youtube_link, "_blank");
      return;
    }

    setViewedLessons((prev) => ({ ...prev, [lessonId]: true }));
    setSavingLessons((prev) => ({ ...prev, [lessonId]: true }));

    try {
      await apiService.trackLessonProgress(lessonId, {
        employee_id: employeeId,
        lesson_id: lessonId,
        is_completed: true,
        completion_date: new Date().toISOString(),
      }, router);

      // Update local state
      setModules((prevModules) =>
        prevModules.map((m) => {
          if (m.id === mod.id) {
            const newProgress = { ...m.progress, [lessonId]: true };
            const allDone = m.lessons.every((l) => newProgress[l.id]);
            return {
              ...m,
              progress: newProgress,
              isCompleted: allDone,
            };
          }
          return m;
        })
      );

      toast.success("Lesson completed!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save progress");
      setViewedLessons((prev) => ({ ...prev, [lessonId]: false }));
    } finally {
      setSavingLessons((prev) => ({ ...prev, [lessonId]: false }));
    }

    // Open video after tracking
    window.open(lesson.youtube_link, "_blank");
  };

  const submitQuiz = async (moduleId) => {
    if (!employeeId) return;

    setSubmitting(true);
    try {
      const answers = Object.entries(quizAnswers[moduleId] || {}).map(
        ([question_id, answer]) => ({ question_id, answer })
      );

      await apiService.submitTest({
        employee_id: employeeId,
        module_id: moduleId,
        answers,
      }, router);

      toast.success("Quiz submitted!");
      setShowQuizModal(null);

      // Refresh completion after quiz
      try {
        const completion = await apiService.checkModuleCompletion(moduleId, { employee_id: employeeId }, router);
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, isCompleted: completion.all_lessons_completed } : m
          )
        );
      } catch (e) {
        console.warn("Failed to refresh completion after quiz");
      }
    } catch (e) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-14 mt-5">
        <div>
          <h1 className="text-2xl font-bold">My Training Portal</h1>
          <p className="mt-2 text-gray-500 font-medium">
            Watch the video, then mark as complete
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
          <div className="rounded bg-red-50 p-4 text-center text-red-700">{error}</div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">No training modules assigned.</p>
            <p className="text-sm text-gray-500 mt-2">Contact HR if needed.</p>
          </div>
        ) : (
          modules.map((mod, modIdx) => {
            const isOpen = openModuleId === mod.id;
            const isCompleted = mod.isCompleted === true;
            const quizDone =
              mod.questions.length > 0 &&
              Object.keys(mod.savedAnswers || {}).length === mod.questions.length;
            const completedCount = Object.values(mod.progress).filter(Boolean).length;

            return (
              <div
                key={mod.id}
                className="overflow-hidden rounded-lg border border-solid border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div
                  onClick={() => toggleModule(mod.id)}
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
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-300" />
                          <span>
                            {isCompleted
                              ? "Completed"
                              : `${completedCount}/${mod.lessons.length} lessons`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-y-auto ${
                    isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="bg-gray-50 p-5 border-t border-gray-300 space-y-6">
                    {/* Lessons */}
                    <div>
                      <h4 className="font-bold text-gray-700 mb-4">
                        Lessons ({mod.lessons.length})
                      </h4>
                      {mod.lessons.map((les, i) => {
                        const isComplete = mod.progress[les.id] === true;
                        const isSaving = savingLessons[les.id];

                        return (
                          <div
                            key={les.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border mb-3"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <span className="font-bold text-[#b88b1b] text-sm min-w-[40px]">
                                {modIdx + 1}.{i + 1}
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
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleVideoClick(les.id);
                                    }}
                                    className="mt-2 inline-flex items-center text-xs text-[#b88b1b] font-medium hover:underline"
                                  >
                                    <FontAwesomeIcon icon={faPlayCircle} className="mr-1" />
                                    Watch Video
                                  </a>
                                )}
                              </div>
                            </div>

                            <button
                              disabled={isComplete || isSaving}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVideoClick(les.id);
                              }}
                              className={`px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2 min-w-[140px] ${
                                isComplete
                                  ? "bg-green-100 text-green-700 cursor-default"
                                  : isSaving
                                  ? "bg-gray-300 text-gray-600 cursor-wait"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {isSaving ? (
                                <>
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                  Saving...
                                </>
                              ) : isComplete ? (
                                "Completed"
                              ) : (
                                "Watch & Complete"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quiz */}
                    {mod.questions.length > 0 && (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="font-bold text-gray-700">
                            Quiz ({mod.questions.length} questions)
                          </h4>
                          {quizDone ? (
                            <span className="text-sm text-green-700 font-medium">
                              Submitted
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowQuizModal(mod.id);
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [mod.id]: { ...mod.savedAnswers },
                                }));
                              }}
                              disabled={!isCompleted}
                              className={`text-sm font-medium transition ${
                                isCompleted
                                  ? "text-[#b88b1b] hover:underline"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Take Quiz
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {mod.questions.map((q, i) => (
                            <div key={q.id} className="p-4 bg-white rounded-lg border">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-[#b88b1b] text-sm">
                                  Q{i + 1}.
                                </span>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{q.question_text}</p>
                                  {q.question_type === "multiple_choice" && (
                                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                                      {Object.entries(q.options || {}).map(([k, v]) => (
                                        <div key={k} className="pl-6">
                                          {k}. {v}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quiz Modal */}
      <CustomModal
        isOpen={!!showQuizModal}
        onClose={() => setShowQuizModal(null)}
        title="Take Quiz"
      >
        <div className="space-y-5">
          {modules
            .find((m) => m.id === showQuizModal)
            ?.questions.map((q, i) => {
              const ans = quizAnswers[showQuizModal]?.[q.id] || "";

              return (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-3">
                    <span className="text-[#b88b1b] font-bold">Q{i + 1}.</span> {q.question_text}
                  </p>

                  {q.question_type === "multiple_choice" ? (
                    <div className="space-y-2">
                      {Object.entries(q.options).map(([k, v]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100"
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={k}
                            checked={ans === k}
                            onChange={(e) =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [showQuizModal]: {
                                  ...prev[showQuizModal],
                                  [q.id]: e.target.value,
                                },
                              }))
                            }
                            className="text-[#d4a53b]"
                          />
                          <span>{k}. {v}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={ans}
                      onChange={(e) =>
                        setQuizAnswers((prev) => ({
                          ...prev,
                          [showQuizModal]: {
                            ...prev[showQuizModal],
                            [q.id]: e.target.value,
                          },
                        }))
                      }
                      placeholder="Your answer..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-[#d4a53b] focus:border-[#d4a53b]"
                    />
                  )}
                </div>
              );
            })}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowQuizModal(null)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => submitQuiz(showQuizModal)}
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg transition ${
                submitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#d4a53b] hover:bg-[#c49632]"
              }`}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
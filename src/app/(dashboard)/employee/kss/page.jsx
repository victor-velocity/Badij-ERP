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

/* -------------------------------------------------
   Custom Modal (close with X button)
   ------------------------------------------------- */
const CustomModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
        <h3 className="mb-4 text-xl font-bold text-gray-900">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
};

/* -------------------------------------------------
   Skeleton Card (loading)
   ------------------------------------------------- */
const SkeletonCard = () => (
  <div className="animate-pulse space-y-3 rounded-lg border border-solid border-gray-400 p-5 bg-white">
    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
    <div className="h-4 w-full rounded bg-gray-200"></div>
    <div className="h-4 w-5/6 rounded bg-gray-200"></div>
  </div>
);

/* -------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------- */
export default function EmployeeKSS() {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState("");
  const [openModuleId, setOpenModuleId] = useState(null);
  const [savingLessons, setSavingLessons] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({}); // {moduleId: {questionId: answer}}
  const [showQuizModal, setShowQuizModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Real-time Clock (WAT) ---------- */
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
      setNow(d.toLocaleString("en-GB", opts)); // en-GB uses 24-h but we force 12-h above
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---------- Get Employee ID ---------- */
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

  /* ---------- Fetch Modules + Progress + Quiz Result ---------- */
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
          /* ---- Sort lessons ---- */
          const sortedLessons = [...(mod.lessons || [])].sort(
            (a, b) =>
              new Date(a.created_at || new Date()) -
              new Date(b.created_at || new Date())
          );

          /* ---- Questions (for modal) ---- */
          let questions = [];
          try {
            questions = await apiService.getQuestions(mod.id, router);
          } catch (e) {
            console.warn(`Questions failed for ${mod.id}:`, e);
          }

          /* ---- Lesson progress ---- */
          let progress = {};
          let isCompleted = false;
          try {
            const completion = await apiService.checkModuleCompletion(mod.id, { employee_id: employeeId }, router);
            isCompleted = completion.all_lessons_completed === true;

            if (isCompleted) {
              sortedLessons.forEach((l) => (progress[l.id] = true));
            } else {
              const prog = await apiService.getLessonProgress?.(mod.id, router);
              if (prog) {
                prog.forEach((p) => (progress[p.lesson_id] = p.is_completed));
              }
            }
          } catch (e) {
            console.warn(`Completion check failed for ${mod.id}:`, e);
          }

          /* ---- Quiz result ---- */
          let quizResult = null;
          try {
            const res = await apiService.getQuizCompletion(mod.id, router);
            if (res?.data?.completed) {
              quizResult = {
                score: res.data.score,
                passed: res.data.passed,
                completion_date: res.data.completion_date,
              };
            }
          } catch (e) {
            console.warn(`Quiz result fetch failed for ${mod.id}:`, e);
          }

          return {
            ...mod,
            lessons: sortedLessons,
            questions: Array.isArray(questions) ? questions : [],
            progress,
            isCompleted,
            quizResult,
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

  /* ---------- Watch Video & Mark Complete ---------- */
  const handleVideoClick = async (lessonId) => {
    if (!employeeId) return;

    const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId));
    if (!mod) return;

    const lesson = mod.lessons.find((l) => l.id === lessonId);
    const alreadyCompleted = mod.progress[lessonId] === true;

    if (alreadyCompleted) {
      window.open(lesson.youtube_link, "_blank");
      return;
    }

    setSavingLessons((prev) => ({ ...prev, [lessonId]: true }));

    try {
      await apiService.trackLessonProgress(
        lessonId,
        {
          employee_id: employeeId,
          lesson_id: lessonId,
          is_completed: true,
          completion_date: new Date().toISOString(),
        },
        router
      );

      setModules((prevModules) =>
        prevModules.map((m) => {
          if (m.id === mod.id) {
            const newProgress = { ...m.progress, [lessonId]: true };
            const allDone = m.lessons.every((l) => newProgress[l.id]);
            return { ...m, progress: newProgress, isCompleted: allDone };
          }
          return m;
        })
      );

      toast.success("Lesson completed!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save progress");
    } finally {
      setSavingLessons((prev) => ({ ...prev, [lessonId]: false }));
    }

    window.open(lesson.youtube_link, "_blank");
  };

  /* ---------- Submit Quiz ---------- */
  const submitQuiz = async (moduleId) => {
    if (!employeeId) return;
    setSubmitting(true);

    try {
      const responses = Object.entries(quizAnswers[moduleId] || {}).map(
        ([question_id, answer]) => ({
          question_id,
          submitted_answer: answer.trim(),
        })
      );

      if (responses.length === 0) {
        toast.error("Please answer all questions");
        return;
      }

      await apiService.submitTest(
        {
          employee_id: employeeId,
          module_id: moduleId,
          responses,
          attempt_date: new Date().toISOString(),
        },
        router
      );

      toast.success("Quiz submitted successfully!");
      setShowQuizModal(null);
      setQuizAnswers((prev) => ({ ...prev, [moduleId]: {} }));
      await fetchModules(); // Refresh quiz result
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------
     RENDER
     ------------------------------------------------- */
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-14 mt-5 px-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Training Portal</h1>
          <p className="mt-2 text-gray-500 font-medium">
            Watch the video, then mark as complete
          </p>
        </div>
        <span className="rounded-[20px] border border-gray-300 px-3 py-2 text-gray-500 text-sm">
          {now}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-10 pb-10">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="rounded bg-red-50 p-6 text-center text-red-700">{error}</div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600">No training modules assigned.</p>
            <p className="text-sm text-gray-500 mt-2">Contact HR if needed.</p>
          </div>
        ) : (
          modules.map((mod, modIdx) => {
            const isOpen = openModuleId === mod.id;
            const isCompleted = mod.isCompleted === true;
            const completedCount = Object.values(mod.progress).filter(Boolean).length;
            const quizResult = mod.quizResult;
            const quizDone = !!quizResult;

            return (
              <div
                key={mod.id}
                className="overflow-hidden rounded-lg border border-solid border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                {/* Module Header */}
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
                              ? "All Lessons Completed"
                              : `${completedCount}/${mod.lessons.length} lessons`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Body */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
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
                              <span className="font-bold text-[#153087] text-sm min-w-[40px]">
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
                                    className="mt-2 inline-flex items-center text-xs text-[#153087] font-medium hover:underline"
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

                    {/* Quiz Section */}
                    {mod.questions.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-700">
                            Quiz ({mod.questions.length} questions)
                          </h4>

                          {/* RESULT OR TAKE QUIZ */}
                          {quizDone ? (
                            <div className="flex flex-col items-end text-sm">
                              <span
                                className={`font-medium ${
                                  quizResult.passed ? "text-green-700" : "text-red-600"
                                }`}
                              >
                                {quizResult.passed ? "Pass" : "Fail"} – {quizResult.score}%
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(quizResult.completion_date).toLocaleDateString("en-GB")}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowQuizModal(mod.id);
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [mod.id]: {}, // fresh answers
                                }));
                              }}
                              disabled={!isCompleted}
                              className={`text-sm font-medium transition ${
                                isCompleted
                                  ? "text-[#153087] hover:underline"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Take Quiz
                            </button>
                          )}
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

      {/* ---------- QUIZ MODAL ---------- */}
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
                    <span className="text-[#153087] font-bold">Q{i + 1}.</span> {q.question_text}
                  </p>

                  {/* Multiple Choice */}
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
                          <span>
                            {k}. {v}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    /* Short Answer */
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

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowQuizModal(null)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
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
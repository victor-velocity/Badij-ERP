"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  faPlayCircle,
  faCheckCircle,
  faClock,
  faTrophy,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import apiService from "@/app/lib/apiService";
import { createClient } from "@/app/lib/supabase/client";

const supabase = createClient();

export default function EmployeeKSS() {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState(null);
  const [assignedModules, setAssignedModules] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------
  // 2. Load modules, assignments & progress (once we have employeeId)
  // -----------------------------------------------------------------
  useEffect(() => {

    const load = async () => {
      try {
        setLoading(true);

        // 2.1 All modules (backend filters by role)
        const modules = await apiService.getModules(router);

        // 2.2 All assignments – needed to double-check visibility
        const { data: allAssignments } = await supabase
          .from("module_assignments")
          .select("module_id, target_type, target_value");

        // 2.3 Employee details (department & role)
        const { data: emp } = await supabase
          .from("employees")
          .select("department:id, role")
          .eq("id", employeeId)
          .single();

        // 2.4 Which modules are visible for THIS employee?
        const visible = new Set();
        allAssignments?.forEach((a) => {
          const ok =
            a.target_type === "ALL" ||
            (a.target_type === "DEPARTMENT" && a.target_value === emp.department.id) ||
            (a.target_type === "ROLE" && a.target_value === emp.role);

          if (ok) visible.add(a.module_id);
        });

        const myModules = modules.filter((m) => visible.has(m.id));

        // 2.5 Load progress
        const { data: prog } = await supabase
          .from("employee_lesson_progress")
          .select("lesson_id, is_completed")
          .eq("employee_id", employeeId);

        const progMap = {};
        prog?.forEach((p) => (progMap[p.lesson_id] = p.is_completed));
        setProgressMap(progMap);

        setAssignedModules(myModules);
      } catch (e) {
        toast.error(e.message ?? "Failed to load training");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId, router]);

  // -----------------------------------------------------------------
  // 3. Mark lesson complete / incomplete
  // -----------------------------------------------------------------
  const markComplete = async (lessonId, isCompleted) => {
    try {
      await apiService.trackLessonProgress(
        lessonId,
        {
          employee_id: employeeId,
          is_completed: isCompleted,
          completion_date: isCompleted ? new Date().toISOString() : null,
        },
        router
      );

      setProgressMap((prev) => ({ ...prev, [lessonId]: isCompleted }));
      toast.success("Progress saved!");
    } catch (e) {
      toast.error(e.message ?? "Failed to save progress");
    }
  };

  // -----------------------------------------------------------------
  // 4. UI
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <p className="text-center py-12">Loading your training modules...</p>
    );
  }

  if (assignedModules.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6" />
        <p className="text-lg font-medium text-gray-700">
          No training modules assigned yet.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Contact HR if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">My Training Portal</h1>
        <p className="text-gray-600 mt-2">
          Complete all lessons to earn your certificate
        </p>
      </div>

      {assignedModules.map((mod) => {
        const completed = mod.lessons.filter((l) => progressMap[l.id]).length;
        const total = mod.lessons.length;
        const fullyDone = completed === total;

        return (
          <div
            key={mod.id}
            className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#d4a53b] to-[#e6c070] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{mod.title}</h3>
                  <p className="text-sm opacity-90">{mod.description}</p>
                </div>
                {fullyDone && (
                  <span className="flex items-center gap-2 text-green-300 font-bold">
                    <FontAwesomeIcon icon={faTrophy} />
                    Certified
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Progress</span>
                  <span>
                    {completed} / {total} lessons
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#d4a53b] to-[#e6c070] h-3 rounded-full transition-all"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Lessons */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faPlayCircle}
                    className="text-[#d4a53b]"
                  />
                  Lessons
                </h4>

                <div className="space-y-3">
                  {mod.lessons.map((les, i) => {
                    const done = progressMap[les.id];
                    return (
                      <div
                        key={les.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#b88b1b]">
                            {i + 1}.
                          </span>
                          <div>
                            <p className="font-medium">{les.title}</p>
                            {les.youtube_link && (
                              <a
                                href={les.youtube_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                <FontAwesomeIcon icon={faPlayCircle} /> Watch
                                Video
                              </a>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => markComplete(les.id, !done)}
                          className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                            done
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {done ? "Completed" : "Mark Complete"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate */}
              {fullyDone && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="font-bold text-green-800 flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={faTrophy} />
                    Certificate Earned!
                  </p>
                  <button className="mt-2 text-sm text-green-700 underline flex items-center gap-1 mx-auto">
                    <FontAwesomeIcon icon={faDownload} /> Download Certificate
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
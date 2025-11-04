// components/kss/QuestionForm.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";

export default function QuestionForm({ initialData, moduleId, onSuccess }) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("multiple_choice");
  const [options, setOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.question_text || "");
      setQuestionType(initialData.question_type || "multiple_choice");
      setOptions(initialData.options || { A: "", B: "", C: "", D: "" });
      setCorrectAnswer(initialData.correct_answer || "");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim() || !correctAnswer) {
      toast.error("Question and correct answer are required");
      return;
    }

    const payload = {
      module_id: moduleId,
      question_text: questionText,
      question_type: questionType,
      options,
      correct_answer: correctAnswer,
    };

    setLoading(true);
    try {
      if (initialData) {
        await apiService.updateQuestion(initialData.id, payload);
        toast.success("Question updated");
      } else {
        await apiService.createQuestion(payload);
        toast.success("Question created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Failed to save question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text
        </label>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none "
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Type
        </label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      {questionType === "multiple_choice" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options (A–D)
          </label>
          <div className="space-y-2">
            {Object.entries(options).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-bold w-6">{key}.</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setOptions({ ...options, [key]: e.target.value })}
                  placeholder={`Option ${key}`}
                  className="flex-1 w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correct Answer
        </label>
        {questionType === "multiple_choice" ? (
          <select
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
            required
          >
            <option value="">Select correct option</option>
            {Object.keys(options).map((key) => (
              <option key={key} value={key}>
                {key}. {options[key] || "(empty)"}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="e.g., 42"
            className="w-full px-3 py-2 border border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none"
            required
          />
        )}
      </div>

      <div className="flex justify-end gap-3 mt-7">
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 text-white rounded-lg transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#d4a53b] hover:bg-[#c49632]"
          }`}
        >
          {loading ? "Saving..." : initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
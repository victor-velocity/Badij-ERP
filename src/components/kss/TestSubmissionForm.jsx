"use client"

import { useState } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const TestSubmissionForm = ({ employeeId, moduleId, questions, onSuccess }) => {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const responses = questions.map((q) => ({
      question_id: q.id,
      submitted_answer: answers[q.id] || '',
    }));

    const testData = {
      employee_id: employeeId,
      module_id: moduleId,
      responses,
      attempt_date: new Date().toISOString(),
    };

    try {
      const result = await apiService.submitTest(testData, router);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {questions.map((q) => (
        <div key={q.id}>
          <label>{q.question_text}</label>
          {q.question_type === 'multiple_choice' && q.options ? (
            <select
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              className="border p-2 w-full"
            >
              <option value="">Select an option</option>
              {Object.entries(q.options).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              className="border p-2 w-full"
            />
          )}
        </div>
      ))}
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2">
        {loading ? 'Submitting...' : 'Submit Test'}
      </button>
    </form>
  );
};

export default TestSubmissionForm;
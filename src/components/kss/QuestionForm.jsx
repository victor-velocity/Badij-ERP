"use client"

import { useState } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const QuestionForm = ({ moduleId, initialData, onSuccess }) => {
  const [questionText, setQuestionText] = useState(initialData?.question_text || '');
  const [questionType, setQuestionType] = useState(initialData?.question_type || 'multiple_choice');
  const [options, setOptions] = useState(initialData?.options || {});
  const [correctAnswer, setCorrectAnswer] = useState(initialData?.correct_answer || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleOptionChange = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const addOption = () => {
    const newKey = String.fromCharCode(65 + Object.keys(options).length); // A, B, C...
    setOptions((prev) => ({ ...prev, [newKey]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const questionData = { module_id: moduleId, question_text: questionText, question_type: questionType, options, correct_answer: correctAnswer };

    try {
      if (initialData?.id) {
        await apiService.updateQuestion(initialData.id, questionData, router);
      } else {
        await apiService.createQuestion(questionData, router);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="questionText">Question Text</label>
        <input
          id="questionText"
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="questionType">Question Type</label>
        <select
          id="questionType"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>
      {questionType === 'multiple_choice' && (
        <div>
          <label>Options</label>
          {Object.entries(options).map(([key, value]) => (
            <div key={key} className="flex space-x-2">
              <span>{key}:</span>
              <input
                type="text"
                value={value}
                onChange={(e) => handleOptionChange(key, e.target.value)}
                className="border p-2 flex-1"
              />
            </div>
          ))}
          <button type="button" onClick={addOption} className="bg-green-500 text-white p-2 mt-2">
            Add Option
          </button>
        </div>
      )}
      <div>
        <label htmlFor="correctAnswer">Correct Answer</label>
        <input
          id="correctAnswer"
          type="text"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2">
        {loading ? 'Saving...' : initialData?.id ? 'Update Question' : 'Create Question'}
      </button>
    </form>
  );
};

export default QuestionForm;
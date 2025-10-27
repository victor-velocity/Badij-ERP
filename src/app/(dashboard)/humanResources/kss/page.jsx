"use client"

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter, useSearchParams } from 'next/navigation';
import ModuleForm from '@/components/kss/ModuleForm';
import LessonForm from '@/components/kss/LessonForm';
import QuestionForm from '@/components/kss/QuestionForm';
import AssignmentForm from '@/components/kss/AssignmentForm';
import TestSubmissionForm from '@/components/kss/TestSubmissionForm';

const CustomModal = ({ isOpen, onRequestClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        {children}
        <button onClick={onRequestClose} className="mt-4 bg-gray-500 text-white p-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

const ModulesContent = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const data = await apiService.getModules(router);
      setModules(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedModule(null);
    setModalOpen(true);
  };

  const openUpdateModal = (module) => {
    setSelectedModule(module);
    setModalOpen(true);
  };

  const openDeleteModal = (module) => {
    setSelectedModule(module);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteModule(selectedModule.id, router);
      fetchModules();
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchModules();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1>Modules</h1>
      <button onClick={openCreateModal} className="bg-green-500 text-white p-2 mb-4">
        Create New Module
      </button>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.id}>
              <td>{module.title}</td>
              <td>{module.description}</td>
              <td>
                <button onClick={() => openUpdateModal(module)} className="bg-blue-500 text-white p-1 mr-2">
                  Edit
                </button>
                <button onClick={() => openDeleteModal(module)} className="bg-red-500 text-white p-1">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CustomModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <h2>{selectedModule ? 'Update Module' : 'Create Module'}</h2>
        <ModuleForm initialData={selectedModule} onSuccess={handleSuccess} />
      </CustomModal>

      <CustomModal isOpen={deleteModalOpen} onRequestClose={() => setDeleteModalOpen(false)}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete {selectedModule?.title}?</p>
        <button onClick={handleDelete} className="bg-red-500 text-white p-2 mr-2">
          Yes
        </button>
        <button onClick={() => setDeleteModalOpen(false)} className="bg-gray-500 text-white p-2">
          No
        </button>
      </CustomModal>
    </div>
  );
};

const LessonsContent = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId'); // Optional

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      const data = await apiService.getLessons(router);
      setLessons(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedLesson(null);
    setModalOpen(true);
  };

  const openUpdateModal = (lesson) => {
    setSelectedLesson(lesson);
    setModalOpen(true);
  };

  const openDeleteModal = (lesson) => {
    setSelectedLesson(lesson);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteLesson(selectedLesson.id, router);
      fetchLessons();
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchLessons();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1>Lessons</h1>
      <button onClick={openCreateModal} className="bg-green-500 text-white p-2 mb-4">
        Create New Lesson
      </button>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>YouTube Link</th>
            <th>Module ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id}>
              <td>{lesson.title}</td>
              <td>{lesson.description}</td>
              <td>{lesson.youtube_link}</td>
              <td>{lesson.module_id}</td>
              <td>
                <button onClick={() => openUpdateModal(lesson)} className="bg-blue-500 text-white p-1 mr-2">
                  Edit
                </button>
                <button onClick={() => openDeleteModal(lesson)} className="bg-red-500 text-white p-1">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CustomModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <h2>{selectedLesson ? 'Update Lesson' : 'Create Lesson'}</h2>
        <LessonForm moduleId={moduleId || 'default_module_id'} initialData={selectedLesson} onSuccess={handleSuccess} />
      </CustomModal>

      <CustomModal isOpen={deleteModalOpen} onRequestClose={() => setDeleteModalOpen(false)}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete {selectedLesson?.title}?</p>
        <button onClick={handleDelete} className="bg-red-500 text-white p-2 mr-2">
          Yes
        </button>
        <button onClick={() => setDeleteModalOpen(false)} className="bg-gray-500 text-white p-2">
          No
        </button>
      </CustomModal>
    </div>
  );
};

const QuestionsContent = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId') || 'default_module_id';

  useEffect(() => {
    fetchQuestions();
  }, [moduleId]);

  const fetchQuestions = async () => {
    try {
      const data = await apiService.getQuestions(moduleId, router);
      setQuestions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedQuestion(null);
    setModalOpen(true);
  };

  const openUpdateModal = (question) => {
    setSelectedQuestion(question);
    setModalOpen(true);
  };

  const openDeleteModal = (question) => {
    setSelectedQuestion(question);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteQuestion(selectedQuestion.id, router);
      fetchQuestions();
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchQuestions();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1>Questions for Module {moduleId}</h1>
      <button onClick={openCreateModal} className="bg-green-500 text-white p-2 mb-4">
        Create New Question
      </button>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Text</th>
            <th>Type</th>
            <th>Options</th>
            <th>Correct Answer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.question_text}</td>
              <td>{q.question_type}</td>
              <td>{JSON.stringify(q.options)}</td>
              <td>{q.correct_answer}</td>
              <td>
                <button onClick={() => openUpdateModal(q)} className="bg-blue-500 text-white p-1 mr-2">
                  Edit
                </button>
                <button onClick={() => openDeleteModal(q)} className="bg-red-500 text-white p-1">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CustomModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <h2>{selectedQuestion ? 'Update Question' : 'Create Question'}</h2>
        <QuestionForm moduleId={moduleId} initialData={selectedQuestion} onSuccess={handleSuccess} />
      </CustomModal>

      <CustomModal isOpen={deleteModalOpen} onRequestClose={() => setDeleteModalOpen(false)}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this question?</p>
        <button onClick={handleDelete} className="bg-red-500 text-white p-2 mr-2">
          Yes
        </button>
        <button onClick={() => setDeleteModalOpen(false)} className="bg-gray-500 text-white p-2">
          No
        </button>
      </CustomModal>
    </div>
  );
};

const AssignmentsContent = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId') || 'default_module_id';

  useEffect(() => {
    fetchAssignments();
  }, [moduleId]);

  const fetchAssignments = async () => {
    try {
      const data = await apiService.getAssignments(moduleId, router);
      setAssignments(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalOpen(true);
  };

  const openDeleteModal = (assignment) => {
    setSelectedAssignment(assignment);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await apiService.deleteAssignment(selectedAssignment.id, router);
      fetchAssignments();
      setDeleteModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchAssignments();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1>Assignments for Module {moduleId}</h1>
      <button onClick={openCreateModal} className="bg-green-500 text-white p-2 mb-4">
        Create New Assignment
      </button>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Target Type</th>
            <th>Target Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id}>
              <td>{a.target_type}</td>
              <td>{a.target_value}</td>
              <td>
                <button onClick={() => openDeleteModal(a)} className="bg-red-500 text-white p-1">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <CustomModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <h2>Create Assignment</h2>
        <AssignmentForm moduleId={moduleId} onSuccess={handleSuccess} />
      </CustomModal>

      <CustomModal isOpen={deleteModalOpen} onRequestClose={() => setDeleteModalOpen(false)}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this assignment?</p>
        <button onClick={handleDelete} className="bg-red-500 text-white p-2 mr-2">
          Yes
        </button>
        <button onClick={() => setDeleteModalOpen(false)} className="bg-gray-500 text-white p-2">
          No
        </button>
      </CustomModal>
    </div>
  );
};

const TestContent = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('moduleId') || 'default_module_id';
  const employeeId = 'current_employee_id'; // Replace with actual from auth

  useEffect(() => {
    fetchQuestions();
  }, [moduleId]);

  const fetchQuestions = async () => {
    try {
      const data = await apiService.getQuestions(moduleId, router);
      setQuestions(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (res) => {
    setResult(res);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h1>Test for Module {moduleId}</h1>
      {result ? (
        <div>
          <p>Score: {result.score}</p>
          <p>Passed: {result.passed ? 'Yes' : 'No'}</p>
        </div>
      ) : (
        <TestSubmissionForm employeeId={employeeId} moduleId={moduleId} questions={questions} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default function KSS() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [activeTab, setActiveTab] = useState('Modules');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const tabs = [
        { name: 'Modules', content: <ModulesContent /> },
        { name: 'Lessons', content: <LessonsContent /> },
        { name: 'Questions', content: <QuestionsContent /> },
        { name: 'Assignments', content: <AssignmentsContent /> },
        { name: 'Test', content: <TestContent /> },
    ];

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Knowledge Sharing System</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage modules, lessons, quiz and track employees' progress</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`${
                                activeTab === tab.name
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-4">
                {tabs.find((tab) => tab.name === activeTab)?.content}
            </div>
        </div>
    );
}
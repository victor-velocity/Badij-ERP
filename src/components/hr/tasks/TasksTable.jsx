"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEye, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import DeleteConfirmationModal from './DeleteTaskModal';
import UpdateTaskModal from './UpdateTaskModal';

const TaskTable = ({ tasks, searchTerm, onViewTask, loading, error, onUpdateTask, onDeleteTask }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tasks]);

  const renderBadge = (status) => {
    let bgColorClass = '';
    let textColorClass = '';

    switch (status) {
      case 'Completed':
        bgColorClass = 'bg-green-100';
        textColorClass = 'text-green-800';
        break;
      case 'In-progress':
        bgColorClass = 'bg-yellow-100';
        textColorClass = 'text-yellow-800';
        break;
      case 'Overdue':
        bgColorClass = 'bg-red-100';
        textColorClass = 'text-red-800';
        break;
      case 'Pending':
        bgColorClass = 'bg-blue-100';
        textColorClass = 'text-blue-800';
        break;
      default:
        bgColorClass = 'bg-gray-100';
        textColorClass = 'text-gray-800';
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}
      >
        {status}
      </span>
    );
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const PageButton = ({ page, isActive, onClick }) => (
      <button
        onClick={onClick}
        className={`px-3 py-1 rounded-md text-sm font-medium ${isActive
            ? 'bg-[#b88b1b] text-white'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        {page}
      </button>
    );

    const renderPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 7;
      const middleOffset = Math.floor(maxPagesToShow / 2);

      if (totalPages <= maxPagesToShow) {
        return pages.map(page => (
          <PageButton
            key={page}
            page={page}
            isActive={page === currentPage}
            onClick={() => onPageChange(page)}
          />
        ));
      }

      let startPage = Math.max(1, currentPage - middleOffset);
      let endPage = Math.min(totalPages, currentPage + middleOffset);

      if (startPage === 1) {
        endPage = Math.min(totalPages, maxPagesToShow);
      }
      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPagesToShow + 1);
      }

      if (startPage > 1) {
        pageNumbers.push(
          <PageButton key={1} page={1} isActive={false} onClick={() => onPageChange(1)} />
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="ellipsis-start" className="px-2 py-1 text-gray-500">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <PageButton
            key={i}
            page={i}
            isActive={i === currentPage}
            onClick={() => onPageChange(i)}
          />
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="ellipsis-end" className="px-2 py-1 text-gray-500">...</span>);
        }
        pageNumbers.push(
          <PageButton key={totalPages} page={totalPages} isActive={false} onClick={() => onPageChange(totalPages)} />
        );
      }

      return pageNumbers;
    };

    return (
      <div className="flex justify-center py-3">
        <nav className="relative z-0 inline-flex items-center gap-3" aria-label="Pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <FontAwesomeIcon icon={faChevronLeft} className="h-5 w-5" aria-hidden="true" />
          </button>
          {renderPageNumbers()}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <FontAwesomeIcon icon={faChevronRight} className="h-5 w-5 text-[#b88b1b]" aria-hidden="true" />
          </button>
        </nav>
      </div>
    );
  };

  const filteredTasks = tasks.filter(task =>
    (task.assigned_to?.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.assigned_to?.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.assigned_to?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (taskId) => {
    setTaskToDeleteId(taskId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTask(taskToDeleteId);
      setShowDeleteModal(false);
      setTaskToDeleteId(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDeleteId(null);
  };

  const handleUpdateClick = (task) => {
    setTaskToUpdate(task);
    setShowUpdateModal(true);
  };

  const handleSaveUpdatedTask = async (updatedTask) => {
    try {
      await onUpdateTask(updatedTask);
      setShowUpdateModal(false);
      setTaskToUpdate(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    setTaskToUpdate(null);
  };

  if (loading) {
    return (
      <div className="bg-white border border-solid border-[#DDD9D9] rounded-lg overflow-hidden py-10 text-center">
        Loading tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-solid border-[#DDD9D9] rounded-lg overflow-hidden py-10 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-solid border-[#DDD9D9] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Assigned to
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  End date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Task title
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created By
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTasks.length > 0 ? (
                currentTasks.map((task) => {
                  const avatarSrc = task.assigned_to?.avatar;
                  const placeholderText = `${task.assigned_to?.first_name?.charAt(0) || ''}${task.assigned_to?.last_name?.charAt(0) || ''}`;
                  const placeholderUrl = `https://placehold.co/32x32/F0F0F0/000000?text=${placeholderText}`;

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {avatarSrc ? (
                              <Image
                                className="h-10 w-10 rounded-full object-cover"
                                src={avatarSrc}
                                alt={`${task.assigned_to?.first_name || ''} ${task.assigned_to?.last_name || ''}`}
                                width={40}
                                height={40}
                              />
                            ) : (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={placeholderUrl}
                                alt={`${task.assigned_to?.first_name || ''} ${task.assigned_to?.last_name || ''}`}
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{`${task.assigned_to?.first_name || ''} ${task.assigned_to?.last_name || ''}`}</div>
                            <div className="text-sm text-gray-500">{task.assigned_to?.email || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.start_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.end_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.created_by?.first_name} {task.created_by?.last_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        {renderBadge(task.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => onViewTask(task)}
                          className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                        >
                          <FontAwesomeIcon icon={faEye} className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleUpdateClick(task)}
                          className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 ml-2"
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 ml-2"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {renderPagination(currentPage, totalPages, handlePageChange)}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      {/* Update Task Modal */}
      <UpdateTaskModal
        show={showUpdateModal}
        task={taskToUpdate}
        onSave={handleSaveUpdatedTask}
        onCancel={handleCancelUpdate}
      />
    </div>
  );
};

export default TaskTable;
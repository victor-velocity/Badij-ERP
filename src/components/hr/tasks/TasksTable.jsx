"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEye, faEdit, faTrashAlt, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
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

  // Skeleton loading rows
  const skeletonRows = Array.from({ length: itemsPerPage }, (_, i) => i);

  const renderBadge = (status) => {
    let bgColorClass = '';
    let textColorClass = '';

    switch (status) {
      case 'Completed':
        bgColorClass = 'bg-green-100';
        textColorClass = 'text-green-800';
        break;
      case 'In Progress':
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
    if (totalPages <= 1) return null;

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

  const filteredTasks = tasks.filter(task => {
    if (task.status === "Cancelled") return false;

    const searchLower = (searchTerm || "").toLowerCase();
    return (
      (task.title || "").toLowerCase().includes(searchLower) ||
      (task.description || "").toLowerCase().includes(searchLower) ||
      (task.assignedEmployees || []).some(e =>
        (e?.name || "").toLowerCase().includes(searchLower)
      )
    );
  });

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

  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    setTaskToUpdate(null);
  };

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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned to</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Overdue</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                skeletonRows.map((index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Array.from({ length: 8 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : currentTasks.length > 0 ? (
                currentTasks.map((task) => {

                  return (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {task.assignedEmployees.length > 0 ? (
                            task.assignedEmployees.map((employee, index) => (
                              <div key={employee.id} className={`flex items-center ${index > 0 ? 'ml-2' : ''}`}>
                                <div className="flex-shrink-0 h-10 w-10">
                                  {employee.avatar_url ? (
                                    <Image
                                      className="h-10 w-10 rounded-full object-cover"
                                      src={employee.avatar_url}
                                      alt={`${employee.first_name} ${employee.last_name}`}
                                      width={40}
                                      height={40}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {employee.first_name?.charAt(0) || ''}{employee.last_name?.charAt(0) || ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {index === 0 && (
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {`${employee.first_name || 'Unknown'} ${employee.last_name || 'Assignee'}`}
                                    </div>
                                    <div className="text-sm text-gray-500">{employee.email || 'No email'}</div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">Unassigned</div>
                          )}
                          {task.assignedEmployees.length > 1 && (
                            <span className="text-xs text-gray-500 ml-2">
                              +{task.assignedEmployees.length - 1} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.start_date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.end_date || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.title || 'Untitled Task'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        {renderBadge(task.status || 'Pending')}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-center text-sm">
                        {task.isOverdue ? (
                          <FontAwesomeIcon icon={faCircleCheck} className="text-red-500 h-5 w-5" />
                        ) : (
                          <FontAwesomeIcon icon={faCircleXmark} className="text-gray-400 h-5 w-5" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => onViewTask(task)}
                          className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                          title="View task"
                        >
                          <FontAwesomeIcon icon={faEye} className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleUpdateClick(task)}
                          className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 ml-2"
                          title="Edit task"
                        >
                          <FontAwesomeIcon icon={faEdit} className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 ml-2"
                          title="Delete task"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && totalPages > 1 && renderPagination(currentPage, totalPages, handlePageChange)}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
      />

      <UpdateTaskModal
        show={showUpdateModal}
        task={taskToUpdate}
        onCancel={handleCancelUpdate}
      />
    </div>
  );
};

export default TaskTable;
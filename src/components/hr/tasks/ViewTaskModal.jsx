"use client";

import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFileAlt, faUser } from '@fortawesome/free-solid-svg-icons';

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    if (!isOpen || !task) return null;

    const assignedEmployees = task.assignedEmployees || [];
    const createdBy = task.created_by_details || {};

    const renderBadge = (status) => {
        let bgColorClass = '';
        let textColorClass = '';

        const normalizedStatus = status ? status.toLowerCase() : 'unknown';

        switch (normalizedStatus) {
            case 'completed':
                bgColorClass = 'bg-green-100';
                textColorClass = 'text-green-800';
                break;
            case 'pending':
                bgColorClass = 'bg-blue-100';
                textColorClass = 'text-blue-800';
                break;
            case 'in progress':
                bgColorClass = 'bg-yellow-100';
                textColorClass = 'text-yellow-800';
                break;
            case 'overdue':
                bgColorClass = 'bg-red-100';
                textColorClass = 'text-red-800';
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Task Details</h2>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Task Title:</p>
                            <p className="text-lg text-black font-semibold">{task.title || 'Untitled Task'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Description:</p>
                            <p className="text-base text-black whitespace-pre-wrap">{task.description || "----"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Start Date:</p>
                            <p className="text-base text-black font-semibold">{formatDate(task.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Due Date:</p>
                            <p className="text-base text-black font-semibold">{formatDate(task.end_date)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Priority:</p>
                            <p className="text-base text-black font-semibold capitalize">{task.priority || 'Not specified'}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Status:</p>
                            {renderBadge(task.status || 'Pending')}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-[#b88b1b] mb-1">Created By:</p>
                        <div className="flex items-center">
                            {createdBy.avatar_url ? (
                                <Image
                                    className="h-8 w-8 rounded-full object-cover mr-3"
                                    src={createdBy.avatar_url}
                                    alt={`${createdBy.first_name} ${createdBy.last_name}`}
                                    width={32}
                                    height={32}
                                    unoptimized
                                />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-600" />
                                </div>
                            )}
                            <div>
                                <p className="text-base text-black font-semibold">
                                    {createdBy.first_name} {createdBy.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{createdBy.email}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-[#b88b1b] mb-1">
                            Assigned Employees ({assignedEmployees.length}):
                        </p>
                        {assignedEmployees.length > 0 ? (
                            <div className="space-y-2">
                                {assignedEmployees.map((employee) => (
                                    <div key={employee.id} className="flex items-center p-2 bg-gray-50 rounded-md">
                                        {employee.avatar_url ? (
                                            <Image
                                                className="h-8 w-8 rounded-full object-cover mr-3"
                                                src={employee.avatar_url}
                                                alt={`${employee.first_name} ${employee.last_name}`}
                                                width={32}
                                                height={32}
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                                <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-600" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-base text-black font-semibold">
                                                {employee.first_name} {employee.last_name}
                                            </p>
                                            <p className="text-sm text-gray-600">{employee.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-base text-gray-500">No employees assigned</p>
                        )}
                    </div>

                    {task.isOverdue && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-red-700 font-medium">⚠️ This task is overdue</p>
                        </div>
                    )}

                    {task.task_documents && task.task_documents.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mb-1">Attachments:</p>
                            <div className="space-y-2">
                                {task.task_documents.map((doc, index) => (
                                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                                        <FontAwesomeIcon icon={faFileAlt} className="h-5 w-5 mr-2 text-gray-500" />
                                        <a
                                            href={doc.url || doc.document_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline break-all text-sm"
                                        >
                                            {doc.name || doc.document_name || 'Document'}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-transparent bg-[#b88b1b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewTaskModal;
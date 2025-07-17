// components/hr/tasks/ViewTaskModal.js
"use client";

import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperclip } from '@fortawesome/free-solid-svg-icons';

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    if (!isOpen || !task) return null;

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

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">Task Details: {task.taskTitle}</h2>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Task Title:</p>
                        <p className="text-lg text-gray-900">{task.taskTitle}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">Assigned To:</p>
                        <div className="flex items-center mt-1">
                            <Image
                                className="h-8 w-8 rounded-full object-cover mr-2"
                                src="/default-profile.png"
                                alt='img profile'
                                width={32}
                                height={32}
                            />
                            <p className="text-base text-gray-900">{task.assignedTo.name} ({task.assignedTo.email})</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">Department:</p>
                        <p className="text-base text-gray-900">{task.department}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Start Date:</p>
                            <p className="text-base text-gray-900">{task.startDate}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Due Date:</p>
                            <p className="text-base text-gray-900">{task.dueDate}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">Status:</p>
                        {renderBadge(task.status)}
                    </div>

                    {/* Add more details here if your task object has them, e.g., description, attachments */}
                    {/* For attachments, you'd list them if task.attachments existed */}
                    {/* Example placeholder for attachments: */}
                    {/* task.attachments && task.attachments.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mt-4">Attachments:</p>
                            <ul className="list-disc list-inside text-gray-800">
                                {task.attachments.map((file, index) => (
                                    <li key={index} className="flex items-center">
                                        <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4 mr-2 text-gray-500" />
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {file.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )*/}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="button"
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
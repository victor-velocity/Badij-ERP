"use client";

import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperclip, faFileAlt } from '@fortawesome/free-solid-svg-icons';

const ViewTaskModal = ({ isOpen, onClose, task }) => {
    if (!isOpen || !task) return null;

    const employeeName = task.assigned_to ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}` : 'N/A';
    const employeeEmail = task.assigned_to ? task.assigned_to.email : 'N/A';
    const employeeProfilePic = task.assigned_to?.profile_picture_url || '/default-profile.png';

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

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-[#b88b1b]">Task Title:</p>
                        <p className="text-lg text-black font-semibold">{task.title}</p>
                    </div>

                    {task.description && (
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b]">Description:</p>
                            <p className="text-base text-black font-semibold whitespace-pre-wrap">{task.description}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-medium text-[#b88b1b]">Assigned To:</p>
                        <div className="flex items-center mt-1">
                            <Image
                                className="h-8 w-8 rounded-full object-cover mr-2"
                                src={employeeProfilePic}
                                alt={`${employeeName}'s profile`}
                                width={32}
                                height={32}
                                unoptimized={employeeProfilePic.startsWith('http')}
                            />
                            <p className="text-base text-black font-semibold">{employeeName} {employeeEmail !== 'N/A' && `(${employeeEmail})`}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b]">Start Date:</p>
                            <p className="text-base text-black font-semibold">{task.start_date}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b]">Due Date:</p>
                            <p className="text-base text-black font-semibold">{task.end_date}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-[#b88b1b]">Status:</p>
                        {renderBadge(task.status)}
                    </div>

                    {task.attachment_urls && typeof task.attachment_urls === 'string' && (
                        <div>
                            <p className="text-sm font-medium text-[#b88b1b] mt-4">Attachment:</p>
                            <div className="flex items-center mt-1">
                                {task.attachment_urls.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                    <Image
                                        src={task.attachment_urls}
                                        alt="Task Attachment"
                                        width={100}
                                        height={100}
                                        className="rounded-md object-cover mr-2"
                                        unoptimized
                                    />
                                ) : (
                                    <FontAwesomeIcon icon={faFileAlt} className="h-6 w-6 mr-2 text-gray-500" />
                                )}
                                <a
                                    href={task.attachment_urls}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {task.attachment_urls.substring(task.attachment_urls.lastIndexOf('/') + 1)}
                                    <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4 ml-2" />
                                </a>
                            </div>
                        </div>
                    )}
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
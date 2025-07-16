"use client"

import React from 'react';

const DEFAULT_AVATAR = '/default-profile.png';

const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
};

const EmployeeDetailModal = ({ isOpen, onClose, employee }) => {
    if (!isOpen || !employee) return null;

    return (
        <div
            className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-3xl"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold text-black mb-6 text-center">Employee Details</h2>
                <div className="space-y-4 text-black">
                    <div className="flex flex-col items-center mb-4">
                        <img
                            src={employee.avatar_url || DEFAULT_AVATAR}
                            alt={`${employee.first_name}'s avatar`}
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        />
                        <p className="text-xl font-semibold text-[#b88b1b] mt-2">{`${employee.first_name} ${employee.last_name}`}</p>
                        <p className="text-gray-600">{employee.email}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                        <div>
                            <span className="font-medium text-[#b88b1b]">Address: </span>
                            <span>{`${employee.address}, ${employee.city}, ${employee.state}, ${employee.country}`}</span>
                            {employee.zip_code && <span>Zip Code: {employee.zip_code}</span>}
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Phone Number: </span>
                            <span>{employee.phone_number || '—'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Date of Birth: </span>
                            <span>{formatDate(employee.date_of_birth)}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Hire Date: </span>
                            <span>{formatDate(employee.hire_date)}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Employment Status: </span>
                            <span>{employee.employment_status}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Position: </span>
                            <span>{employee.position_id || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Department: </span>
                            <span>{employee.department_id || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Guarantor Name: </span>
                            <span>{employee.guarantor_name || '—'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Guarantor Phone: </span>
                            <span>{employee.guarantor_phone_number || '—'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Salary: </span>
                            <span>₦{employee.salary?.toLocaleString() || '0'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Compensation: </span>
                            <span>₦{employee.compensation?.toLocaleString() || '0'}</span>
                        </div>
                        <div>
                            <span className="font-medium text-[#b88b1b]">Incentive: </span>
                            <span>₦{employee.incentive?.toLocaleString() || '0'}</span>
                        </div>
                    </div>

                    {employee.document_urls && employee.document_urls.length > 0 && (
                        <div className="mt-4">
                            <p className="font-medium text-[#b88b1b]">Supporting Documents:</p>
                            <ul className="list-disc list-inside">
                                {employee.document_urls.map((url, index) => (
                                    <li key={index}>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            Document {index + 1}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailModal;

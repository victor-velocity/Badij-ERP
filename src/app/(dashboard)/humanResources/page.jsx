// app/humanResources/page.jsx
'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBriefcase, faChartLine, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import Attendance from '@/components/humanResources/AttendanceTable';

export default function HRManagerDashboardPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">HR Manager Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Employee Management */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
                    <FontAwesomeIcon icon={faUsers} className="text-[#b88b1b] text-5xl mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Employee Management</h2>
                    <p className="text-gray-600 mb-4">View, add, and manage employee profiles and records.</p>
                    <button className="bg-[#b88b1b] text-white px-6 py-2 rounded-md hover:bg-[#ad841a] transition-colors duration-200">
                        Manage Employees
                    </button>
                </div>

                {/* Card 2: Job Postings & Recruitment */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
                    <FontAwesomeIcon icon={faBriefcase} className="text-[#b88b1b] text-5xl mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Recruitment</h2>
                    <p className="text-gray-600 mb-4">Create job postings, track applications, and manage hiring.</p>
                    <button className="bg-[#b88b1b] text-white px-6 py-2 rounded-md hover:bg-[#ad841a] transition-colors duration-200">
                        View Openings
                    </button>
                </div>

                {/* Card 3: Performance & Training */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
                    <FontAwesomeIcon icon={faChartLine} className="text-[#b88b1b] text-5xl mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Performance & Training</h2>
                    <p className="text-gray-600 mb-4">Monitor performance, assign training, and track development.</p>
                    <button className="bg-[#b88b1b] text-white px-6 py-2 rounded-md hover:bg-[#ad841a] transition-colors duration-200">
                        Access Reports
                    </button>
                </div>

                {/* Card 4: Policies & Compliance */}
                <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center text-center">
                    <FontAwesomeIcon icon={faClipboardList} className="text-[#b88b1b] text-5xl mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Policies & Compliance</h2>
                    <p className="text-gray-600 mb-4">Review company policies and ensure regulatory compliance.</p>
                    <button className="bg-[#b88b1b] text-white px-6 py-2 rounded-md hover:bg-[#ad841a] transition-colors duration-200">
                        View Policies
                    </button>
                </div>
            </div>

            <Attendance />
        </div>
    );
}
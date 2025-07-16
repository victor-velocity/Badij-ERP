"use client"
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const DEFAULT_AVATAR = '/default-profile.png';

const NIGERIAN_FIRST_NAMES = [
    "Chinedu", "Fatima", "Oluwaseun", "Aisha", "Emeka", "Zainab", "Tunde", "Amaka",
    "Mohammed", "Ngozi", "David", "Blessing", "Kunle", "Funke", "Segun"
];
const NIGERIAN_LAST_NAMES = [
    "Okoro", "Abdullahi", "Adekunle", "Musa", "Nwachukwu", "Aliyu", "Oladipo", "Chukwu",
    "Ibrahim", "Nwosu", "Akpan", "Eze", "Sani", "Bello", "Okafor"
];

const DEPARTMENTS = [
    "Sales", "Warehouse", "HR", "IT", "Installer", "Loader", "Driver"
];

const POSITIONS = ["Employee"];

const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getRandomDate = (start, end) => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
};

export const generateFakeLeaveRequests = () => Array.from({ length: 20 }, (_, _i) => {
    const firstName = NIGERIAN_FIRST_NAMES[Math.floor(Math.random() * NIGERIAN_FIRST_NAMES.length)];
    const lastName = NIGERIAN_LAST_NAMES[Math.floor(Math.random() * NIGERIAN_LAST_NAMES.length)];
    const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
    const position = POSITIONS[0];

    const statuses = ["Pending", "Approved", "Declined"];
    const employmentStatus = statuses[Math.floor(Math.random() * statuses.length)];

    let leave_start_date = null;
    let leave_end_date = null;
    let leave_duration = null;
    const request_date = getRandomDate(new Date(2025, 0, 1), new Date(2025, 6, 16));

    if (employmentStatus === "Pending") {
        const today = new Date();
        const futureStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + Math.floor(Math.random() * 10) + 1);
        leave_start_date = getRandomDate(futureStart, new Date(futureStart.getFullYear(), futureStart.getMonth() + 1, futureStart.getDate()));
        const endDate = new Date(leave_start_date);
        endDate.setDate(new Date(leave_start_date).getDate() + Math.floor(Math.random() * 10) + 1);
        leave_end_date = endDate.toISOString().split('T')[0];
    } else if (employmentStatus === "Approved" || employmentStatus === "Declined") {
        const pastEnd = new Date();
        const pastStart = new Date();
        pastStart.setDate(pastEnd.getDate() - (Math.floor(Math.random() * 30) + 1));
        leave_start_date = getRandomDate(pastStart, pastEnd);
        const endDate = new Date(leave_start_date);
        endDate.setDate(new Date(leave_start_date).getDate() + Math.floor(Math.random() * 10) + 1);
        leave_end_date = endDate.toISOString().split('T')[0];
    }

    if (leave_start_date && leave_end_date) {
        const start = new Date(leave_start_date);
        const end = new Date(leave_end_date);
        const diffTime = Math.abs(end - start);
        leave_duration = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} days`;
    }

    const adminApprovalOptions = ['mark', 'x'];
    const adminApproval = adminApprovalOptions[Math.floor(Math.random() * adminApprovalOptions.length)];

    return {
        id: generateUuid(),
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        position: position,
        department: department,
        employment_status: employmentStatus,
        admin_approval: adminApproval,
        leave_start_date: leave_start_date,
        leave_end_date: leave_end_date,
        leave_duration: leave_duration,
        request_date: request_date,
    };
});

const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
};

export const LeaveRow = ({ employee, onUpdateStatus }) => {
    const [imgSrc, setImgSrc] = useState(employee.avatar || DEFAULT_AVATAR);
    const [employeeStatus, setEmployeeStatus] = useState(employee.employment_status);
    const isStatusLocked = employeeStatus === 'Approved' || employeeStatus === 'Declined';

    useEffect(() => {
        setEmployeeStatus(employee.employment_status);
    }, [employee.employment_status]);

    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDropdownChange = (e) => {
        const newStatus = e.target.value;
        setEmployeeStatus(newStatus);
        onUpdateStatus(employee.id, newStatus);
    };

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        <img
                            className="h-full w-full object-cover rounded-full"
                            src={imgSrc}
                            alt={`${employee.first_name}'s avatar`}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{`${employee.first_name} ${employee.last_name}`}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.department || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.position || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_start_date ? formatDate(employee.leave_start_date) : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_end_date ? formatDate(employee.leave_end_date) : '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_duration || '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(employeeStatus)} ${isStatusLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={employeeStatus}
                    onChange={handleDropdownChange}
                    disabled={isStatusLocked}
                >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Declined">Declined</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {employee.admin_approval === 'mark' ? (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-lg" title="Approved by Admin" />
                ) : (
                    <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 text-lg" title="Not Approved by Admin" />
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.request_date ? formatDate(employee.request_date) : '—'}
            </td>
        </tr>
    );
};
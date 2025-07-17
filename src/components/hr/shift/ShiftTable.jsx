// components/hr/shift/ShiftTable.js
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faEye } from '@fortawesome/free-solid-svg-icons';

const ShiftTable = ({ shifts, searchTerm, onViewShift }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, shifts]);

    const renderBadge = (shiftType) => {
        let bgColorClass = '';
        let textColorClass = '';

        switch (shiftType) {
            case 'Morning':
                bgColorClass = 'bg-blue-100';
                textColorClass = 'text-blue-800';
                break;
            case 'Evening':
                bgColorClass = 'bg-purple-100';
                textColorClass = 'text-purple-800';
                break;
            case 'Night':
                bgColorClass = 'bg-indigo-100';
                textColorClass = 'text-indigo-800';
                break;
            default:
                bgColorClass = 'bg-gray-100';
                textColorClass = 'text-gray-800';
        }

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}
            >
                {shiftType}
            </span>
        );
    };

    const renderPagination = (currentPage, totalPages, onPageChange) => {
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        const PageButton = ({ page, isActive, onClick }) => (
            <button
                onClick={onClick}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                    isActive
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

    const filteredShifts = shifts.filter(shift =>
        shift.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.shiftType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.note.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredShifts.length / itemsPerPage);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentShifts = filteredShifts.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="bg-white border border-solid border-[#DDD9D9] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Employee
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Department
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Shift Type
                            </th>
                             <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Date
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-xs text-center font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Start Time
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                End Time
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
                        {currentShifts.length > 0 ? (
                            currentShifts.map((shift) => (
                                <tr key={shift.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <Image
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={shift.employee.avatar || '/default-profile.png'}
                                                    alt={shift.employee.name}
                                                    width={40}
                                                    height={40}
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{shift.employee.name}</div>
                                                <div className="text-sm text-gray-500">{shift.employee.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {shift.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-left">
                                        {renderBadge(shift.shiftType)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {shift.date}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {shift.startTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {shift.endTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => onViewShift(shift)}
                                            className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                    No shifts found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(currentPage, totalPages, handlePageChange)}
        </div>
    );
};

export default ShiftTable;
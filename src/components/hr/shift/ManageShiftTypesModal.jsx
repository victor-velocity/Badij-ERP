"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const SHIFT_ORDER = ["Morning", "Afternoon", "Night"];

const sortShiftTypes = (shifts) => {
    if (!Array.isArray(shifts)) {
        return [];
    }
    return [...shifts].sort((a, b) => {
        const indexA = SHIFT_ORDER.indexOf(a.name);
        const indexB = SHIFT_ORDER.indexOf(b.name);
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });
};

export default function ManageShiftTypesModal({ isOpen, onClose, shiftTypes, onUpdateShiftType, onDeleteShiftType }) {
    const [editableShiftTypes, setEditableShiftTypes] = useState([]);

    useEffect(() => {
        if (isOpen && shiftTypes) {
            const sortedShifts = sortShiftTypes(shiftTypes);
            setEditableShiftTypes(sortedShifts.map(type => ({
                ...type,
                start_time: type.start_time || '00:00:00',
                end_time: type.end_time || '00:00:00'
            })));
        }
    }, [isOpen, shiftTypes]);

    if (!isOpen) return null;

    const handleInputChange = (id, field, value) => {
        setEditableShiftTypes(prevTypes => {
            const updatedTypes = prevTypes.map(type =>
                type.id === id ? { ...type, [field]: value } : type
            );
            return sortShiftTypes(updatedTypes);
        });
    };

    const handleSave = async (shiftTypeToSave) => {
        await onUpdateShiftType(shiftTypeToSave.id, {
            name: shiftTypeToSave.name,
            start_time: shiftTypeToSave.start_time,
            end_time: shiftTypeToSave.end_time,
        });
    };

    const handleDelete = async (shiftTypeId) => {
        if (window.confirm("Are you sure you want to delete this shift type?")) {
            await onDeleteShiftType(shiftTypeId);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Manage Shift Types</h2>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                >
                    &times;
                </button>

                {editableShiftTypes.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">No shift types available.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Shift Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Time (HH:MM:SS)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End Time (HH:MM:SS)
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {editableShiftTypes.map(type => (
                                    <tr key={type.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <input
                                                type="text"
                                                value={type.name || ''}
                                                onChange={(e) => handleInputChange(type.id, 'name', e.target.value)}
                                                className="mt-1 w-28 block px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="time"
                                                step="1"
                                                value={type.start_time || '00:00:00'}
                                                onChange={(e) => handleInputChange(type.id, 'start_time', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="time"
                                                step="1"
                                                value={type.end_time || '00:00:00'}
                                                onChange={(e) => handleInputChange(type.id, 'end_time', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-2 justify-end">
                                                <button
                                                    onClick={() => handleSave(type)}
                                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type.id)}
                                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
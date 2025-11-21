"use client";

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import apiService from '@/app/lib/apiService';

export default function CreateShiftTypeModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) return toast.error("Shift name is required.");
        if (!startTime || !endTime) return toast.error("Both times are required.");

        if (startTime >= endTime) {
            return toast.error("End time must be after start time.");
        }

        setLoading(true);

        try {
            const formatTime = (t => t.length === 5 ? `${t}:00` : t);

            const shiftData = {
                name: name.trim(),
                start_time: formatTime(startTime),
                end_time: formatTime(endTime),
            };

            await apiService.createShift(shiftData, router);

            toast.success("Shift type created successfully!");
            setName('');
            setStartTime('');
            setEndTime('');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to create shift type");
        } finally {
            setLoading(false);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Create New Shift Type</h3>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                    disabled={loading}
                    type="button"
                >
                    ×
                </button>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="shiftName" className="block text-sm font-medium text-gray-700">
                            Shift Name
                        </label>
                        <input
                            type="text"
                            id="shiftName"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="e.g., Morning Shift"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                            Start Time
                        </label>
                        <input
                            type="time"
                            id="startTime"
                            step="1"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: HH:MM:SS (24-hour)</p>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                            End Time
                        </label>
                        <input
                            type="time"
                            id="endTime"
                            step="1"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: HH:MM:SS (24-hour)</p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating..." : "Create Shift Type"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
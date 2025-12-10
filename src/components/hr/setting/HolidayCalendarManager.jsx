"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';

const HolidayCalendarManager = () => {
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ date: '', name: '', type: 'public', description: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [totalHolidays, setTotalHolidays] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingHolidayId, setDeletingHolidayId] = useState(null);

    const supabase = createClient()

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType]);

    useEffect(() => {
        fetchHolidays(currentPage, searchTerm, filterType);
    }, [currentPage, searchTerm, filterType]);

    const fetchHolidays = async (page, term, typeFilter) => {
        setLoading(true);
        setError(null);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
            .from('holidays')
            .select('*', { count: 'exact' })
            .order('date', { ascending: true });

        if (term) {
            query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
        }

        if (typeFilter && typeFilter !== 'all') {
            query = query.eq('type', typeFilter);
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching holidays:', error.message);
            setError('Failed to load holidays.');
            toast.error('Failed to load holidays.');
        } else {
            setHolidays(data);
            setTotalHolidays(count);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewHoliday(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
    };

    const addHoliday = async (e) => {
        e.preventDefault();
        setError(null);
        setIsAdding(true);

        if (!newHoliday.date || !newHoliday.name) {
            setError("Date and Name are required for a new holiday.");
            toast.error("Date and Name are required for a new holiday.");
            setIsAdding(false);
            return;
        }

        const { error: insertError } = await supabase
            .from('holidays')
            .insert([newHoliday])
            .select();

        if (insertError) {
            console.error('Error adding holiday:', insertError.message);
            setError('Failed to add holiday.');
            toast.error('Failed to add holiday.');
        } else {
            setNewHoliday({ date: '', name: '', type: 'public', description: '' });
            await fetchHolidays(currentPage, searchTerm, filterType);
            toast.success('Holiday added successfully!');
        }
        setIsAdding(false);
    };

    const deleteHoliday = async (id) => {
        setError(null);
        setDeletingHolidayId(id);

        const { error: deleteError } = await supabase
            .from('holidays')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting holiday:', deleteError.message);
            setError('Failed to delete holiday.');
            toast.error('Failed to delete holiday.');
        } else {
            await fetchHolidays(currentPage, searchTerm, filterType);
            toast.success('Holiday deleted successfully!');
        }
        setDeletingHolidayId(null);
    };

    const totalPages = Math.ceil(totalHolidays / itemsPerPage);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    };

    return (
        <div className="">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Holiday Calendar Management</h2>

            <form onSubmit={addHoliday} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 border border-solid border-gray-300 rounded-lg bg-gray-50">
                <div className="flex flex-col">
                    <label htmlFor="date" className="text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={newHoliday.date}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087]"
                        required
                        disabled={isAdding}
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={newHoliday.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Christmas Day"
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087]"
                        required
                        disabled={isAdding}
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="type" className="text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        id="type"
                        name="type"
                        value={newHoliday.type}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087]"
                        disabled={isAdding}
                    >
                        <option value="public">Public Holiday</option>
                        <option value="company">Company Holiday</option>
                    </select>
                </div>
                <div className="flex flex-col">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={newHoliday.description}
                        onChange={handleInputChange}
                        placeholder="Optional details"
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087]"
                        disabled={isAdding}
                    />
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Adding...
                            </>
                        ) : (
                            "Add Holiday"
                        )}
                    </button>
                </div>
            </form>

            <h3 className="text-xl font-semibold mb-3 text-gray-700">Existing Holidays</h3>
            {error && <div className="text-red-600 mb-4">Error: {error}</div>}

            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Holidays</label>
                    <input
                        type="text"
                        id="search"
                        name="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by name or description..."
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087] w-full"
                        // Removed 'loading' from disabled condition to allow typing during fetch
                        disabled={isAdding || deletingHolidayId !== null}
                    />
                </div>
                <div className="flex-1">
                    <label htmlFor="filterType" className="text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
                    <select
                        id="filterType"
                        name="filterType"
                        value={filterType}
                        onChange={handleFilterChange}
                        className="p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:text-[#153087] w-full"
                        // Removed 'loading' from disabled condition to allow filtering during fetch
                        disabled={isAdding || deletingHolidayId !== null}
                    >
                        <option value="all">All Types</option>
                        <option value="public">Public Holiday</option>
                        <option value="company">Company Holiday</option>
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-100 rounded-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-2 px-4 border-b border-gray-100 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">Date</th>
                            <th className="py-2 px-4 border-b border-gray-100 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">Name</th>
                            <th className="py-2 px-4 border-b border-gray-100 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">Type</th>
                            <th className="py-2 px-4 border-b border-gray-100 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">Description</th>
                            <th className="py-2 px-4 border-b border-gray-100 text-left text-sm font-semibold text-gray-600 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500 border-b border-gray-100">Loading holidays...</td>
                            </tr>
                        ) : holidays.length === 0 && totalHolidays === 0 && !searchTerm && filterType === 'all' ? (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500 border-b border-gray-100">No holidays added yet.</td>
                            </tr>
                        ) : holidays.length === 0 && (searchTerm || filterType !== 'all') ? (
                            <tr>
                                <td colSpan="5" className="py-4 px-4 text-center text-gray-500 border-b border-gray-100">No holidays found matching your criteria.</td>
                            </tr>
                        ) : (
                            holidays.map((holiday) => (
                                <tr key={holiday.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b border-gray-100 text-gray-800 whitespace-nowrap">{holiday.date}</td>
                                    <td className="py-2 px-4 border-b border-gray-100 text-gray-800 whitespace-nowrap">{holiday.name}</td>
                                    <td className="py-2 px-4 border-b border-gray-100 text-gray-800 capitalize whitespace-nowrap">{holiday.type}</td>
                                    <td className="py-2 px-4 border-b border-gray-100 text-gray-800 whitespace-nowrap">{holiday.description || 'N/A'}</td>
                                    <td className="py-2 px-4 border-b border-gray-100 whitespace-nowrap">
                                        <button
                                            onClick={() => deleteHoliday(holiday.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium p-1 rounded-full hover:bg-red-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Delete Holiday"
                                            disabled={deletingHolidayId === holiday.id || isAdding || loading}
                                        >
                                            {deletingHolidayId === holiday.id ? (
                                                <FontAwesomeIcon icon={faSpinner} spin size="lg" />
                                            ) : (
                                                <FontAwesomeIcon icon={faTrash} size="lg" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalHolidays > itemsPerPage && (
                <div className="flex justify-center items-center mt-4 space-x-2">
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || loading || isAdding || deletingHolidayId !== null}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || loading || isAdding || deletingHolidayId !== null}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default HolidayCalendarManager;

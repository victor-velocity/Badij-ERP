// src/app/(dashboard)/humanResources/employees/edit/[id]/page.jsx
"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { useParams, useRouter } from 'next/navigation'; // Import useParams and useRouter
import toast from 'react-hot-toast';

const supabase = createClient();

const EditEmployeePage = () => {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id; // Get the ID from the URL

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!employeeId) return; // Don't fetch if ID is not available yet

            setLoading(true);
            setErrorMessage('');
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('id', employeeId)
                .single(); // Use .single() to get a single record

            if (error) {
                console.error('Error fetching employee for edit:', error);
                setErrorMessage(`Failed to load employee data: ${error.message}`);
                setLoading(false);
            } else if (data) {
                setEmployee(data);
                setLoading(false);
            } else {
                setErrorMessage('Employee not found.');
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [employeeId]); // Re-run when employeeId changes

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmployee(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        if (!employee) {
            setErrorMessage("No employee data to save.");
            setLoading(false);
            return;
        }

        try {
            const employeeDataToUpdate = {
                // Ensure all fields you want to update are here
                first_name: employee.first_name,
                last_name: employee.last_name,
                email: employee.email,
                phone_number: employee.phone_number,
                address: employee.address,
                city: employee.city,
                state: employee.state,
                zip_code: employee.zip_code,
                country: employee.country,
                date_of_birth: employee.date_of_birth,
                hire_date: employee.hire_date,
                salary: parseFloat(employee.salary), // Ensure salary is a number
                employment_status: employee.employment_status,
                // Add other fields as needed
            };

            const { data, error } = await supabase
                .from('employees')
                .update(employeeDataToUpdate)
                .eq('id', employeeId)
                .select();

            if (error) {
                console.error('Error updating employee:', error);
                setErrorMessage(`Failed to update employee: ${error.message}`);
            } else {
                console.log('Employee updated successfully:', data);
                setSuccessMessage('Employee updated successfully!');
                toast.success("Employee successfully updated")
                setTimeout(() => {
                    router.push('/humanResources/employees'); // Redirect to employee list
                }, 1500);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back(); // Go back to the previous page (employee list)
    };

    if (loading) {
        return <div className="text-center py-8">Loading employee details...</div>;
    }

    if (errorMessage && !employee) {
        return <div className="text-center py-8 text-red-500">{errorMessage}</div>;
    }

    if (!employee) {
        return <div className="text-center py-8 text-gray-500">Employee data not found.</div>;
    }

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14'>
                <div>
                    <h1 className='text-2xl font-bold '>Edit Employee</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Update the details for {employee.first_name} {employee.last_name}</p>
                </div>
            </div>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> {successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form fields for editing employee details (similar to add form, but pre-filled with 'employee' state) */}
                {/* Example for first name: */}
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={employee.first_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>
                {/* ... (repeat for other fields like last_name, email, phone_number, etc.) */}

                {/* Last Name */}
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={employee.last_name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={employee.email || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={employee.phone_number || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={employee.address || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* City */}
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={employee.city || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* State */}
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="state"
                        name="state"
                        value={employee.state || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Zip Code */}
                <div>
                    <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
                        Zip Code
                    </label>
                    <input
                        type="text"
                        id="zip_code"
                        name="zip_code"
                        value={employee.zip_code || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                {/* Country */}
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                        Country <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        value={employee.country || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Date of Birth */}
                <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={employee.date_of_birth || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Hire Date */}
                <div>
                    <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Hire Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="hire_date"
                        name="hire_date"
                        value={employee.hire_date || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>


                {/* Salary */}
                <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                        Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="salary"
                        name="salary"
                        value={employee.salary || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        step="0.01"
                        required
                    />
                </div>

                {/* Employment Status */}
                <div>
                    <label htmlFor="employment_status" className="block text-sm font-medium text-gray-700 mb-1">
                        Employment Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="employment_status"
                        name="employment_status"
                        value={employee.employment_status || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Probation">Probation</option>
                        <option value="Transferred">Transferred</option>
                    </select>
                </div>


                {/* Form Actions */}
                <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#d19d19] text-white rounded-md hover:bg-[#5e460b] transition-colors shadow-md cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditEmployeePage;
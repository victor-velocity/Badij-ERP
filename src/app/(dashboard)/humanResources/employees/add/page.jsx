"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from 'next/navigation'; // Import useRouter

const supabase = createClient();

const AddEmployeePage = () => { // Removed onSave and onCancel props
    const router = useRouter(); // Initialize router

    const [newEmployee, setNewEmployee] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'Nigeria',
        date_of_birth: '',
        hire_date: '',
        salary: '',
        employment_status: 'Active',
    });
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const employeeDataToInsert = {
                first_name: newEmployee.first_name,
                last_name: newEmployee.last_name,
                email: newEmployee.email,
                phone_number: newEmployee.phone_number,
                address: newEmployee.address,
                city: newEmployee.city,
                state: newEmployee.state,
                zip_code: newEmployee.zip_code || null,
                country: newEmployee.country,
                date_of_birth: newEmployee.date_of_birth,
                hire_date: newEmployee.hire_date,
                salary: parseFloat(newEmployee.salary),
                employment_status: newEmployee.employment_status,
            };

            const { data, error } = await supabase
                .from('employees')
                .insert([employeeDataToInsert])
                .select();

            if (error) {
                console.error('Error adding employee:', error);
                setErrorMessage(`Failed to add employee: ${error.message}`);
            } else {
                console.log('Employee added successfully:', data);
                setSuccessMessage('Employee added successfully! Redirecting...');
                // Redirect to the employee list page after a short delay
                setTimeout(() => {
                    router.push('/humanResources/employees'); // Adjust path if needed
                }, 1500); // Redirect after 1.5 seconds
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setErrorMessage('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back(); // Go back to the previous page
        // Or specific path: router.push('/humanResources/employees');
    };

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14'>
                <div>
                    <h1 className='text-2xl font-bold '>Add Employee</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Fill in the details below to add employee</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
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
                {/* First Name */}
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={newEmployee.first_name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                    />
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={newEmployee.last_name}
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
                        value={newEmployee.email}
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
                        value={newEmployee.phone_number}
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
                        value={newEmployee.address}
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
                        value={newEmployee.city}
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
                        value={newEmployee.state}
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
                        value={newEmployee.zip_code}
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
                        value={newEmployee.country}
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
                        value={newEmployee.date_of_birth}
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
                        value={newEmployee.hire_date}
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
                        value={newEmployee.salary}
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
                        value={newEmployee.employment_status}
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
                        {loading ? 'Adding...' : 'Add Employee'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEmployeePage;
"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from 'next/navigation';

const supabase = createClient();

const AddEmployeePage = () => {
    const router = useRouter();

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

    const generateDefaultPassword = () => {
        // Generate a strong, random default password
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let password = '';
        for (let i = 0; i < 12; i++) { // 12-character password
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        const defaultPassword = generateDefaultPassword();
        const employeeEmail = newEmployee.email;
        const employeeFullName = `${newEmployee.first_name} ${newEmployee.last_name}`;

        try {
            // 1. Create user in Supabase Auth
            // Store 'full_name' and 'role' in user_metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: employeeEmail,
                password: defaultPassword,
                options: {
                    data: {
                        full_name: employeeFullName, // Pass full name as user metadata
                        role: 'employee' // Explicitly set role in user_metadata
                    },
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (authError) {
                if (authError.message.includes('already registered')) {
                    // If user already exists, we assume they are an employee and proceed to link.
                    // In a real app, you might want more robust handling here (e.g., admin reset password, or linking to an existing confirmed user).
                    // For now, we'll try to sign in with the default password to get their user ID.
                    const { data: existingUser, error: existingUserError } = await supabase.auth.signInWithPassword({
                        email: employeeEmail,
                        password: defaultPassword,
                    });
                    if (existingUserError && existingUserError.message.includes('Invalid login credentials')) {
                        setErrorMessage(`User with this email already exists but cannot be assigned with the default password. Please use a different email or reset the existing user's password manually in Supabase Auth.`);
                        setLoading(false);
                        return;
                    } else if (existingUserError) {
                        setErrorMessage(`Error checking existing user: ${existingUserError.message}`);
                        setLoading(false);
                        return;
                    }
                    console.log("User already registered, linking existing user:", existingUser.user);
                    authData.user = existingUser.user;
                } else {
                    setErrorMessage(`Failed to create user account: ${authError.message}`);
                    setLoading(false);
                    return;
                }
            }

            const userId = authData.user?.id;

            if (!userId) {
                setErrorMessage("Failed to get user ID after authentication.");
                setLoading(false);
                return;
            }

            // 2. Insert employee details into 'employees' table, linked by user_id
            const employeeDataToInsert = {
                user_id: userId, // Link to Supabase Auth user
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

            const { error: dbError } = await supabase
                .from('employees')
                .insert([employeeDataToInsert]);

            if (dbError) {
                console.error('Error adding employee to database:', dbError);
                setErrorMessage(`Failed to add employee details: ${dbError.message}`);
                // If DB insert fails, consider rolling back the auth user creation (requires admin client)
                // await supabase.auth.admin.deleteUser(userId);
            } else {
                setSuccessMessage('Employee registered and added successfully! Email with login details is being sent...');

                // 3. Simulate Email Sending (Replace with actual API route call)
                console.log(`--- SIMULATING EMAIL SEND ---`);
                console.log(`To: ${employeeEmail}`);
                console.log(`Subject: Welcome to Your Employee Dashboard!`);
                console.log(`Body:
                    Dear ${employeeFullName},

                    Welcome! Your employee dashboard is ready.
                    You can log in using the following credentials:

                    Username (Email): ${employeeEmail}
                    Default Password: ${defaultPassword}

                    Please log in and change your password immediately.

                    Dashboard Link: ${window.location.origin}/dashboard

                    Best regards,
                    Your HR Team
                `);
                console.log(`-----------------------------`);

                // In a real application, you would make a fetch call to your Next.js API route here:
                /*
                const emailResponse = await fetch('/api/send-welcome-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: employeeEmail,
                        subject: 'Welcome to Your Employee Dashboard!',
                        body: `Dear ${employeeFullName},\n\nWelcome! Your employee dashboard is ready.\nYou can log in using the following credentials:\n\nUsername (Email): ${employeeEmail}\nDefault Password: ${defaultPassword}\n\nPlease log in and change your password immediately.\n\nDashboard Link: ${window.location.origin}/dashboard\n\nBest regards,\nYour HR Team`,
                    }),
                });
                const emailResult = await emailResponse.json();
                if (!emailResponse.ok) {
                    console.error('Failed to send welcome email:', emailResult.error);
                    // Decide if this should block success or just log
                }
                */

                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/humanResources/employees');
                }, 2500); // Give user time to read success message
            }
        } catch (err) {
            console.error('Unexpected error during employee registration:', err);
            setErrorMessage('An unexpected error occurred during registration.');
        } finally {
            setLoading(false);
        }
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

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4">
            <div className='flex justify-between items-center mt-5 mb-14'>
                <div>
                    <h1 className='text-2xl font-bold text-black'>Add Employee</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Fill in the details below to add employee</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {successMessage && (
                <div className="bg-white border border-[#b88b1b] text-black px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> {successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="bg-white border border-black text-black px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                {/* First Name */}
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-black mb-1">
                        First Name <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={newEmployee.first_name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Last Name */}
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-black mb-1">
                        Last Name <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={newEmployee.last_name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                        Email <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={newEmployee.email}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-black mb-1">
                        Phone Number <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={newEmployee.phone_number}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                        Address <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={newEmployee.address}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* City */}
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-black mb-1">
                        City <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        name="city"
                        value={newEmployee.city}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* State */}
                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-black mb-1">
                        State <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="state"
                        name="state"
                        value={newEmployee.state}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Zip Code */}
                <div>
                    <label htmlFor="zip_code" className="block text-sm font-medium text-black mb-1">
                        Zip Code
                    </label>
                    <input
                        type="text"
                        id="zip_code"
                        name="zip_code"
                        value={newEmployee.zip_code}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                    />
                </div>

                {/* Country */}
                <div>
                    <label htmlFor="country" className="block text-sm font-medium text-black mb-1">
                        Country <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="text"
                        id="country"
                        name="country"
                        value={newEmployee.country}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Date of Birth */}
                <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-black mb-1">
                        Date of Birth <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="date"
                        id="date_of_birth"
                        name="date_of_birth"
                        value={newEmployee.date_of_birth}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>

                {/* Hire Date */}
                <div>
                    <label htmlFor="hire_date" className="block text-sm font-medium text-black mb-1">
                        Hire Date <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="date"
                        id="hire_date"
                        name="hire_date"
                        value={newEmployee.hire_date}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        required
                    />
                </div>


                {/* Salary */}
                <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-black mb-1">
                        Salary <span className="text-[#b88b1b]">*</span>
                    </label>
                    <input
                        type="number"
                        id="salary"
                        name="salary"
                        value={newEmployee.salary}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                        step="0.01"
                        required
                    />
                </div>

                {/* Employment Status */}
                <div>
                    <label htmlFor="employment_status" className="block text-sm font-medium text-black mb-1">
                        Employment Status <span className="text-[#b88b1b]">*</span>
                    </label>
                    <select
                        id="employment_status"
                        name="employment_status"
                        value={newEmployee.employment_status}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-3 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
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
                        className="px-6 py-3 border border-black rounded-md text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-[#b88b1b] text-white rounded-md hover:bg-black transition-colors shadow-md cursor-pointer"
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

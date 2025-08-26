"use client";

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from 'next/navigation';

const ProfileField = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500">{label}:</span>
        <span className="text-base text-gray-800 font-semibold">{value}</span>
    </div>
);

export default function MyProfile() {
    const router = useRouter();
    const [employee, setEmployee] = useState(null);
    const [authUserId, setAuthUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');
    const [currentDateTime, setCurrentDateTime] = useState('')

    useEffect(() => {
        const storedAuthUserId = localStorage.getItem("user_id");
        if (storedAuthUserId) {
            setAuthUserId(storedAuthUserId);
        } else {
            router.push("/login");
        }
    }, [router]);

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

    useEffect(() => {
        const fetchEmployeeDetails = async () => {
            if (!authUserId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const allEmployees = await apiService.getEmployees(router);
                const foundEmployee = allEmployees.find(emp => emp.user_id === authUserId);

                if (foundEmployee) {
                    setEmployee(foundEmployee);
                } else {
                    setError("Employee record not found for this user ID.");
                    setEmployee(null);
                }
            } catch (err) {
                console.error("Error fetching employee details:", err);
                setError("Failed to load employee details.");
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeDetails();
    }, [authUserId, router]);

    if (loading) {
        return <div className="flex justify-center items-center h-1/2 text-xl text-gray-600">Loading profile...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-1/2 text-xl text-red-600">Failed loading profile. Reload page.</div>;
    }

    if (!employee) {
        return <div className="flex justify-center items-center h-1/2 text-xl text-gray-600">No employee data found for your user ID.</div>;
    }

    return (
        <div className="">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>My Profile</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>View and manage your profile informations</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="flex flex-col md:flex-row items-center md:gap-20 gap-6 mb-10 p-6 rounded-lg border border-gray-100">
                <div className="flex flex-col items-center md:items-start flex-shrink-0">
                    {employee.avatar_url ? (
                        <img
                            src={employee.avatar_url}
                            alt={`${employee.first_name} ${employee.last_name}'s avatar`}
                            className="w-32 h-32 rounded-full object-cover border-4 border-yellow-500 shadow-md mb-3"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-5xl font-bold mb-3 border-4 border-gray-300">
                            {employee.first_name ? employee.first_name[0].toUpperCase() : '?'}{employee.last_name ? employee.last_name[0].toUpperCase() : ''}
                        </div>
                    )}
                    <h2 className="text-2xl font-semibold text-gray-800 text-center md:text-left">{employee.first_name} {employee.last_name}</h2>
                    <p className="text-md text-gray-600">{employee.position || 'N/A'}</p>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap -mb-px">
                    <button
                        className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${activeTab === 'personal'
                            ? 'border-b-2 border-yellow-500 text-yellow-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('personal')}
                    >
                        Personal Information
                    </button>
                    <button
                        className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${activeTab === 'contact'
                            ? 'border-b-2 border-yellow-500 text-yellow-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('contact')}
                    >
                        Contact Information
                    </button>
                    <button
                        className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${activeTab === 'employment'
                            ? 'border-b-2 border-yellow-500 text-yellow-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('employment')}
                    >
                        Employment Details
                    </button>
                    <button
                        className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${activeTab === 'guarantor'
                            ? 'border-b-2 border-yellow-500 text-yellow-600'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('guarantor')}
                    >
                        Guarantor Information
                    </button>
                </div>

                <div className="p-6 rounded-b-lg border border-t-0 border-gray-200">
                    <div key={activeTab} className="transition-opacity duration-300 ease-in-out opacity-100">
                        {activeTab === 'personal' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <ProfileField label="Gender" value={employee.gender || 'N/A'} />
                                <ProfileField label="Marital Status" value={employee.marital_status || 'N/A'} />
                                <ProfileField label="Email" value={employee.email} />
                                <ProfileField label="Phone Number" value={employee.phone_number || 'N/A'} />
                                <ProfileField label="Date of Birth" value={employee.date_of_birth || 'N/A'} />
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <ProfileField label="Address" value={employee.address || 'N/A'} />
                                <ProfileField label="City" value={employee.city || 'N/A'} />
                                <ProfileField label="State" value={employee.state || 'N/A'} />
                                <ProfileField label="Zip Code" value={employee.zip_code || 'N/A'} />
                                <ProfileField label="Country" value={employee.country || 'N/A'} />
                            </div>
                        )}

                        {activeTab === 'employment' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <ProfileField label="Department" value={employee.departments?.name || 'N/A'} />
                                <ProfileField label="Position" value={employee.position || 'N/A'} />
                                <ProfileField label="Employment Status" value={employee.employment_status || 'N/A'} />
                                <ProfileField label="Hire Date" value={employee.hire_date || 'N/A'} />
                                <ProfileField label="Leave Balance" value={employee.leave_balance !== undefined ? employee.leave_balance.toString() : 'N/A'} />
                            </div>
                        )}

                        {activeTab === 'guarantor' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <ProfileField label="Guarantor 1 Name" value={employee.guarantor_name || 'N/A'} />
                                <ProfileField label="Guarantor 1 Phone" value={employee.guarantor_phone_number || 'N/A'} />
                                <ProfileField label="Guarantor 2 Name" value={employee.guarantor_name_2 || 'N/A'} />
                                <ProfileField label="Guarantor 2 Phone" value={employee.guarantor_phone_number_2 || 'N/A'} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
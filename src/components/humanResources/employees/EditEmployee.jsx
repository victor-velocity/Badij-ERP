"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import toast from 'react-hot-toast';

const supabase = createClient();

const EditEmployeeModal = ({ isOpen, onClose, onEmployeeUpdated, employee }) => {
    const [editedEmployee, setEditedEmployee] = useState({
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        employment_status: 'Active',
        position_id: '',
        department_id: '',
        avatar_url: null,
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

    const [loading, setLoading] = useState(false);

    const [positions, setPositions] = useState([]);
    const [departments, setDepartments] = useState([]);

    const avatarInputRef = useRef(null);

    const modalContentRef = useRef(null);

    useEffect(() => {
        if (isOpen && employee) {
            setEditedEmployee({
                id: employee.id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                email: employee.email,
                employment_status: employee.employment_status,
                position_id: employee.position_id,
                department_id: employee.department_id,
                avatar_url: employee.avatar_url,
            });
            setAvatarPreviewUrl(employee.avatar_url);
            setAvatarFile(null);
        }
    }, [isOpen, employee]);

    useEffect(() => {
        if (isOpen) {
            const fetchLookupData = async () => {
                setLoading(true);
                try {
                    const { data: positionsData, error: positionsError } = await supabase
                        .from('positions')
                        .select('id, title');
                    if (positionsError) throw positionsError;
                    setPositions(positionsData);

                    const { data: departmentsData, error: departmentsError } = await supabase
                        .from('departments')
                        .select('id, name');
                    if (departmentsError) throw departmentsError;
                    setDepartments(departmentsData);
                } catch (error) {
                    console.error('Error fetching lookup data:', error.message);
                    toast.error('Failed to load positions or departments.');
                } finally {
                    setLoading(false);
                }
            };
            fetchLookupData();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedEmployee(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreviewUrl(URL.createObjectURL(file));
        } else {
            setAvatarFile(null);
            setAvatarPreviewUrl(employee?.avatar_url || null);
        }
    };

    const uploadFileToSupabase = async (file, bucketName, folderPath) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folderPath}/${fileName}`;
        const { error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`Error uploading file to ${bucketName}:`, error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    };

    const validateFields = useCallback(() => {
        const { employment_status, position_id, department_id } = editedEmployee;
        if (!employment_status || !position_id || !department_id) {
            toast.error('Please fill all required fields: Employment Status, Position, Department.');
            return false;
        }
        return true;
    }, [editedEmployee]);

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!validateFields()) {
            setLoading(false);
            return;
        }

        let newAvatarUrl = editedEmployee.avatar_url;

        try {
            if (avatarFile) {
                newAvatarUrl = await uploadFileToSupabase(avatarFile, 'avatars', 'employee_avatars');
            }

            const employeeDataToUpdate = {
                employment_status: editedEmployee.employment_status,
                position_id: editedEmployee.position_id,
                department_id: editedEmployee.department_id,
                avatar_url: newAvatarUrl,
            };

            const { error: dbError } = await supabase
                .from('employees')
                .update(employeeDataToUpdate)
                .eq('id', editedEmployee.id);

            if (dbError) {
                console.error('Error updating employee in database:', dbError);
                toast.error(`Failed to update employee details: ${dbError.message}`);
            } else {
                toast.success('Employee details updated successfully!');
                setTimeout(() => {
                    onEmployeeUpdated();
                    onClose();
                    setEditedEmployee({
                        id: '', first_name: '', last_name: '', email: '', employment_status: 'Active', position_id: '', department_id: '', avatar_url: null,
                    });
                    setAvatarFile(null);
                    setAvatarPreviewUrl(null);
                    if (avatarInputRef.current) avatarInputRef.current.value = '';
                }, 1500);
            }
        } catch (err) {
            console.error('Unexpected error during employee update or file upload:', err);
            toast.error(`An unexpected error occurred: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] h-full w-full z-50 flex justify-center items-center font-inter" onClick={onClose}>
            <div className="relative p-6 border w-full max-w-3xl max-h-[90vh] overflow-y-scroll mx-auto rounded-md shadow-lg bg-white"
                onClick={(e) => e.stopPropagation()}
                ref={modalContentRef}>
                <button
                    className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-2xl"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold text-center text-black mb-6">Edit Employee Details</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Employee Photo */}
                    <div className="flex flex-col items-center mb-4">
                        <label htmlFor="avatar" className="block text-sm font-medium text-black mb-2">
                            Employee Photo
                        </label>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300 flex items-center justify-center mb-3">
                            {avatarPreviewUrl ? (
                                <img src={avatarPreviewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                </svg>
                            )}
                        </div>
                        <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            ref={avatarInputRef}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#b88b1b] file:text-white
                                hover:file:bg-[#997417] cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* First Name (Disabled) */}
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-black mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={editedEmployee.first_name}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        {/* Last Name (Disabled) */}
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-black mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={editedEmployee.last_name}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        {/* Email (Disabled) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={editedEmployee.email}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                disabled
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
                                value={editedEmployee.employment_status}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                                <option value="Probation">Probation</option>
                                <option value="Transferred">Transferred</option>
                            </select>
                        </div>
                        {/* Position */}
                        <div>
                            <label htmlFor="position_id" className="block text-sm font-medium text-black mb-1">
                                Position <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="position_id"
                                name="position_id"
                                value={editedEmployee.position_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Position</option>
                                {positions.map(position => (
                                    <option key={position.id} value={position.id}>{position.title}</option>
                                ))}
                            </select>
                        </div>
                        {/* Department */}
                        <div>
                            <label htmlFor="department_id" className="block text-sm font-medium text-black mb-1">
                                Department <span className="text-[#b88b1b]">*</span>
                            </label>
                            <select
                                id="department_id"
                                name="department_id"
                                value={editedEmployee.department_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(department => (
                                    <option key={department.id} value={department.id}>{department.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#b88b1b] hover:bg-[#997417] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] transition-colors duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditEmployeeModal;
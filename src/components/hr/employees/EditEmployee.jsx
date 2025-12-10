// components/hr/employees/EditEmployeeModal.jsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import toast from 'react-hot-toast';
import apiService from "@/app/lib/apiService";
import { useRouter } from 'next/navigation';

const supabase = createClient();

const EditEmployeeModal = ({ isOpen, onClose, onEmployeeUpdated, employee }) => {
    const router = useRouter();

    const [editedEmployee, setEditedEmployee] = useState(() => {
        if (employee) {
            return {
                id: employee.id || '',
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                employment_status: employee.employment_status
                    ? employee.employment_status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    : 'active',
                position: employee.position || '',
                department_id: employee.department_id || '',
                avatar_url: employee.avatar_url || null,
                signature_url: employee.signature_url || null,
                document_urls: employee.document_urls || [],
            };
        }
        return {
            id: '',
            first_name: '',
            last_name: '',
            email: '',
            employment_status: 'active',
            position: '',
            department_id: '',
            avatar_url: null,
            signature_url: null,
            document_urls: [],
        };
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(employee?.avatar_url || null);

    const [signatureFile, setSignatureFile] = useState(null);
    const [signaturePreviewUrl, setSignaturePreviewUrl] = useState(employee?.signature_url || null);

    const [documentFiles, setDocumentFiles] = useState([]);
    const [documentPreviews, setDocumentPreviews] = useState(
        (employee?.document_urls || []).map((url, i) => ({
            name: `Document ${i + 1}.pdf`,
            url,
            isExisting: true,
        }))
    );

    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    const avatarInputRef = useRef(null);
    const signatureInputRef = useRef(null);
    const documentsInputRef = useRef(null);
    const modalContentRef = useRef(null);

    useEffect(() => {
        if (isOpen && employee) {
            setEditedEmployee({
                id: employee.id || '',
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                employment_status: employee.employment_status
                    ? employee.employment_status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                    : 'active',
                position: employee.position || '',
                department_id: employee.department_id || '',
                avatar_url: employee.avatar_url || null,
                signature_url: employee.signature_url || null,
                document_urls: employee.document_urls || [],
            });
            setAvatarPreviewUrl(employee.avatar_url || null);
            setSignaturePreviewUrl(employee.signature_url || null);
            setDocumentPreviews(
                (employee.document_urls || []).map((url, i) => ({
                    name: `Document ${i + 1}`,
                    url,
                    isExisting: true,
                }))
            );
            setAvatarFile(null);
            setSignatureFile(null);
            setDocumentFiles([]);
        } else if (!isOpen) {
            setEditedEmployee({
                id: '', first_name: '', last_name: '', email: '', employment_status: 'active', position: '', department_id: '', avatar_url: null, signature_url: null, document_urls: [],
            });
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
            setSignatureFile(null);
            setSignaturePreviewUrl(null);
            setDocumentFiles([]);
            setDocumentPreviews([]);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
            if (signatureInputRef.current) signatureInputRef.current.value = '';
            if (documentsInputRef.current) documentsInputRef.current.value = '';
        }
    }, [isOpen, employee]);

    useEffect(() => {
        if (isOpen) {
            const fetchLookupData = async () => {
                setLoading(true);
                try {
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
            setAvatarPreviewUrl(editedEmployee.avatar_url || null);
        }
    };

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSignatureFile(file);
            setSignaturePreviewUrl(URL.createObjectURL(file));
        } else {
            setSignatureFile(null);
            setSignaturePreviewUrl(editedEmployee.signature_url || null);
        }
    };

    const handleDocumentChange = (e) => {
        const files = Array.from(e.target.files);
        setDocumentFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file),
            isExisting: false
        }));
        setDocumentPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeDocument = (index) => {
        setDocumentFiles(prev => prev.filter((_, i) => i !== index));
        setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let newAvatarUrl = editedEmployee.avatar_url;
        let newSignatureUrl = editedEmployee.signature_url;
        let newDocumentUrls = editedEmployee.document_urls.filter(url => url); // keep existing ones

        try {
            if (avatarFile) {
                newAvatarUrl = await uploadFileToSupabase(avatarFile, 'avatars', 'employee_avatars');
            }
            if (signatureFile) {
                newSignatureUrl = await uploadFileToSupabase(signatureFile, 'signatures', 'employee_signatures');
            }
            if (documentFiles.length > 0) {
                const uploaded = await Promise.all(
                    documentFiles.map(file => uploadFileToSupabase(file, 'documents', 'employee_documents'))
                );
                newDocumentUrls = [...newDocumentUrls, ...uploaded];
            }

            const employeeDataToUpdate = {
                employment_status: editedEmployee.employment_status,
                position: editedEmployee.position,
                department_id: editedEmployee.department_id,
                avatar_url: newAvatarUrl,
                signature_url: newSignatureUrl || null,
                document_urls: newDocumentUrls,
            };

            await apiService.updateEmployee(editedEmployee.id, employeeDataToUpdate, router);

            toast.success('Employee details updated successfully!');
            setTimeout(() => {
                onEmployeeUpdated();
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error during employee update or file upload:', err);
            toast.error(`Failed to update employee: ${err.message || 'An unexpected error occurred'}`);
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
                    ×
                </button>
                <h2 className="text-2xl font-bold text-center text-black mb-6">Edit Employee Details</h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Avatar */}
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
                                file:bg-[#153087] file:text-white
                                hover:file:bg-[#153087] cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div>
                            <label htmlFor="employment_status" className="block text-sm font-medium text-black mb-1">
                                Employment Status <span className="text-[#153087]">*</span>
                            </label>
                            <select
                                id="employment_status"
                                name="employment_status"
                                value={editedEmployee.employment_status}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#153087] focus:border-[#153087] sm:text-sm text-black bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="position" className="block text-sm font-medium text-black mb-1">
                                Position <span className="text-[#153087]">*</span>
                            </label>
                            <input
                                id="position"
                                name="position"
                                type="text"
                                value={editedEmployee.position}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#153087] focus:border-[#153087] sm:text-sm text-black bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="department_id" className="block text-sm font-medium text-black mb-1">
                                Department <span className="text-[#153087]">*</span>
                            </label>
                            <select
                                id="department_id"
                                name="department_id"
                                value={editedEmployee.department_id}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-black rounded-md shadow-sm focus:outline-none focus:ring-[#153087] focus:border-[#153087] sm:text-sm text-black bg-white"
                            >
                                <option value="">Select Department</option>
                                {departments.map(department => (
                                    <option key={department.id} value={department.id}>{department.name}</option>
                                ))}
                            </select>
                        </div>
                        {/* Signature Upload */}
                        <div className="md:col-span-2">
                            <label htmlFor="signature" className="block text-sm font-medium text-black mb-2">
                                Scanned Copy of Signature
                            </label>
                            <div className="w-full h-32 border-2 border-gray-300 border-dashed rounded-md flex items-center justify-center mb-3 overflow-hidden">
                                {signaturePreviewUrl ? (
                                    <img src={signaturePreviewUrl} alt="Signature Preview" className="h-full object-contain" />
                                ) : (
                                    <span className="text-gray-400 text-sm">No Signature</span>
                                )}
                            </div>
                            <input
                                type="file"
                                id="signature"
                                name="signature"
                                accept="image/*"
                                onChange={handleSignatureChange}
                                ref={signatureInputRef}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#153087] file:text-white
                                hover:file:bg-[#153087] cursor-pointer"
                            />
                        </div>

                        {/* Supporting Documents */}
                        <div className="md:col-span-2">
                            <label htmlFor="documents" className="block text-sm font-medium text-black mb-2">
                                Supporting Documents (add or replace)
                            </label>
                            <input
                                type="file"
                                id="documents"
                                name="documents"
                                accept=".pdf,.doc,.docx,.jpg,.png"
                                multiple
                                onChange={handleDocumentChange}
                                ref={documentsInputRef}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#153087] file:text-white
                                hover:file:bg-[#153087] cursor-pointer"
                            />
                            <div className="mt-3 space-y-2">
                                {documentPreviews.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                        <span className="text-sm text-black truncate">
                                            {doc.isExisting ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{doc.name}</a> : doc.name}
                                        </span>
                                        {!doc.isExisting && (
                                            <button
                                                type="button"
                                                onClick={() => removeDocument(index)}
                                                className="ml-4 text-red-600 text-sm hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#153087] hover:bg-[#faf714] hover:text-[black] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#153087] transition-colors duration-200"
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
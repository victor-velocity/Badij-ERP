"use client";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';

// File types/extensions
const fileTypes = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "jpeg",
    "png",
    "txt"
];

// Document categories/purposes
const documentCategories = [
    "official documents",
    "contracts",
    "certificates",
    "ids"
];

/**
 * Extracts the file extension from a URL (ignoring query parameters)
 * and checks if it is a supported type.
 * @param {string} url - The document URL.
 * @param {string[]} supportedTypes - Array of allowed extensions.
 * @returns {string} The supported extension or an empty string.
 */
const extractTypeFromUrl = (url, supportedTypes) => {
    if (!url) return '';
    // 1. Remove query parameters and fragments (e.g., ?t=123, #hash)
    const urlWithoutQuery = url.split(/[?#]/)[0];
    // 2. Split by dot and get the last part
    const parts = urlWithoutQuery.split('.');
    if (parts.length > 1) {
        const extension = parts.pop().toLowerCase();
        // 3. Check if the extension is in our supported list
        return supportedTypes.includes(extension) ? extension : '';
    }
    return '';
};


const EditDocumentModal = ({
    document,
    isOpen,
    onClose,
    onDocumentUpdated
}) => {
    const router = useRouter();
    const supabase = createClient();

    // 1. Determine the initial file type:
    //    A. Use the type stored in the document object (if available).
    //    B. If type is missing, infer it from the document URL.
    const initialType = document?.type || extractTypeFromUrl(document?.url, fileTypes) || '';

    const [formData, setFormData] = useState({
        name: document?.name || '',
        type: initialType, // File type/extension prefilled using auto-detection or existing data
        category: document?.category || 'official documents', // Document category/purpose
        file: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Auto-detect file type from extension when a new file is selected
            const extension = file.name.split('.').pop().toLowerCase();
            const detectedType = fileTypes.includes(extension) ? extension : '';
            
            setFormData(prev => ({ 
                ...prev, 
                file: file,
                // If a type is detected from the new file, use it. Otherwise, keep the existing type in the state.
                type: detectedType || prev.type
            }));
        } else {
            // If the file input is cleared, clear the file state but keep the current type selection
            setFormData(prev => ({
                ...prev,
                file: null
            }));
        }
    };

    const uploadFileToSupabase = async (file, bucketName, folderPath) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${folderPath}/${fileName}`;
        const { error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
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

        // Basic validation check
        if (!formData.name || !formData.type || !formData.category) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            let documentUrl = document.url;

            // If a new file was uploaded, upload it and get the new URL
            if (formData.file) {
                documentUrl = await uploadFileToSupabase(
                    formData.file,
                    'documents',
                    'employee_documents'
                );
            }

            const payload = {
                name: formData.name,
                type: formData.type, // Use the final type from the form state
                category: formData.category, // Document category
                // Only include the new URL if a new file was uploaded
                ...(formData.file && { url: documentUrl })
            };

            await apiService.updateEmployeeDocument(
                document.id,
                payload,
                router
            );

            toast.success('Document updated successfully!');
            onClose();
            onDocumentUpdated();
        } catch (error) {
            console.error("Update failed:", error);
            toast.error(error.message || 'Failed to update document');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-semibold text-gray-800">Edit Document</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-500 hover:text-[#b88b1b] transition-colors p-2 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold mb-1 text-gray-700">
                            Document Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition disabled:bg-gray-50 disabled:opacity-70"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">
                                File Type (Auto-Detected)
                            </label>
                            <div className={`w-full p-3 border rounded-lg bg-gray-100 disabled:opacity-70 ${formData.type ? 'border-gray-300 text-gray-700' : 'border-red-400 text-red-600 font-medium'}`}>
                                {formData.type ? `.${formData.type.toUpperCase()}` : 'UNSUPPORTED TYPE ⚠️'}
                            </div>
                            {!formData.type && (
                                <p className="text-xs text-red-500 mt-1">
                                    File type is required. Please select a supported file to replace the current one.
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-700">
                                Category
                            </label>
                            <select
                                name="category"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] transition disabled:bg-gray-50 disabled:opacity-70"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            >
                                {documentCategories.map(category => (
                                    <option key={category} value={category}>
                                        {category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-6 border-t pt-4">
                        <label className="block text-sm font-semibold mb-1 text-gray-700">
                            Current Document Details
                        </label>
                        <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 mb-4">
                            <p className="text-sm font-medium truncate text-gray-700">
                                File: {document?.url?.split('/').pop()?.split('?')[0] || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Type: {document?.type?.toUpperCase() || initialType.toUpperCase() || 'N/A'}
                            </p>
                        </div>
                        
                        <label className="block text-sm font-semibold mb-1 text-gray-700">
                            Replace File (optional)
                        </label>
                        <input
                            type="file"
                            className="w-full file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-[#b88b1b] file:text-white
                                hover:file:bg-[#8d6b14] transition-colors
                                cursor-pointer disabled:opacity-50"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            accept={fileTypes.map(type => `.${type}`).join(',')}
                        />
                        {formData.file && (
                            <p className="text-xs text-green-600 mt-2">
                                <span className="font-semibold">Selected for upload:</span> {formData.file.name}
                                {formData.type && ` (Type: .${formData.type.toUpperCase()})`}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-[#b88b1b] text-white rounded-lg hover:bg-[#8d6b14] transition-colors disabled:opacity-50 font-medium flex items-center justify-center shadow-md shadow-[#b88b1b]/30"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDocumentModal;
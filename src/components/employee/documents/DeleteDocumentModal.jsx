"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const DeleteDocumentModal = ({
    document,
    isOpen,
    onClose,
    onDocumentUpdated
}) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await apiService.deleteEmployeeDocument(document.id, router);
            toast.success('Document deleted successfully!');
            onClose();
            onDocumentUpdated();
        } catch (error) {
            toast.error(error.message || 'Failed to delete document');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Delete Document</h2>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-gray-700">
                        Are you sure you want to delete the document <strong>"{document?.name}"</strong>?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                        This action cannot be undone.
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 border rounded border-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteDocumentModal;
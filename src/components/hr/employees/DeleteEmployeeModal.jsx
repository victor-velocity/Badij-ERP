// components/hr/employees/DeleteEmployeeModal.jsx
import React, { useState } from 'react'; // Import useState
import { toast } from 'react-hot-toast';
import apiService from "@/app/lib/apiService";

const DeleteEmployeeModal = ({ isOpen, onClose, employee, onEmployeeDeleted, router }) => {
    // Add a loading state
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!employee || !employee.id) {
            toast.error("Employee data is missing for termination.");
            onClose();
            return;
        }

        setIsLoading(true); // Set loading to true when deletion starts
        try {
            await apiService.deleteEmployee(employee.id, router);
            toast.success('Employee successfully terminated!');
            onEmployeeDeleted();
            onClose();
        } catch (error) {
            console.error("Error terminating employee. Try again!");
            toast.error(`Failed to terminate employee: ${error.message || 'An unexpected error occurred'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h2>
                <p className="text-gray-700 mb-6">
                    Are you sure you want to terminate <span className="font-semibold">{employee?.first_name} {employee?.last_name}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={isLoading}
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteEmployeeModal;
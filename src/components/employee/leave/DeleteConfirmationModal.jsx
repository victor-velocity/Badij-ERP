import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const modalRoot = useRef(null);

    useEffect(() => {
        modalRoot.current = document.getElementById('modal-root');
    }, []);

    if (!isOpen || !modalRoot.current) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Cancellation</h3>
                <p className="text-gray-700 mb-6">
                    Are you sure you want to cancel the leave request? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                        disabled={isLoading}
                    >
                        No, Keep It
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
                    </button>
                </div>
            </div>
        </div>,
        modalRoot.current
    );
};

export default DeleteConfirmationModal;
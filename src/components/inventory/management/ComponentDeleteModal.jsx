import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const goldColor = '#b88b1b';

const ComponentDeleteModal = ({ component, onClose, onDelete }) => {
    const [deleting, setDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(component.component_id);
        } finally {
            setDeleting(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    disabled={deleting}
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
                
                <h3 className="text-xl font-bold mb-4 text-center" style={{ color: goldColor }}>
                    Confirm Delete
                </h3>
                
                <p className="text-gray-600 mb-6 text-left">
                    Are you sure you want to delete the component <strong>{component.name}</strong> (SKU: {component.sku})?
                </p>

                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                        disabled={deleting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmDelete}
                        className="px-6 py-2 text-white rounded-md hover:opacity-90 transition duration-200 disabled:opacity-50"
                        style={{ backgroundColor: '#dc2626' }}
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComponentDeleteModal;
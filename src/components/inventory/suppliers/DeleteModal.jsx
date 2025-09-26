"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle, faTrash } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

const goldColor = '#b88b1b';

export const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName,
  isLoading = false 
}) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success('Supplier deleted successfully!', {
        duration: 4000,
        position: 'top-right',
      });
      onClose();
    } catch (error) {
      toast.error('Failed to delete supplier. Please try again.', {
        duration: 5000,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-lg" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Delete Supplier
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Are you sure you want to delete this supplier? This action cannot be undone.
          </p>
          {itemName && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
              <p className="text-red-800 font-medium text-sm">
                <span className="font-semibold">Supplier:</span> {itemName}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] bg-red-600 hover:bg-red-700 transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
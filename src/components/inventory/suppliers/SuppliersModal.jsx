"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const goldColor = '#b88b1b';

// Supplier Modal Component
export const SupplierModal = ({ isOpen, onClose, initialData = null }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        contact_email: initialData.contact_email || '',
        contact_phone: initialData.contact_phone || '',
        address: initialData.address || '',
        website: initialData.website || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        name: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        website: '',
        notes: ''
      });
    }
    // Clear errors when modal opens/closes or initialData changes
    setErrors({});
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting.');
      return;
    }

    setIsLoading(true);

    const dataToSend = {
      name: formData.name.trim(),
      contact_email: formData.contact_email.trim() || undefined,
      contact_phone: formData.contact_phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      website: formData.website.trim() || undefined,
      notes: formData.notes.trim() || undefined
    };

    try {
      let response;
      const isEdit = initialData && initialData.supplier_id;

      if (isEdit) {
        response = await apiService.updateSupplier(initialData.supplier_id, dataToSend, router);
      } else {
        response = await apiService.createSupplier(dataToSend, router);
      }

      if (response.status === 'success') {
        toast.success(
          isEdit
            ? 'Supplier updated successfully!'
            : 'Supplier created successfully!',
          {
            duration: 4000,
            position: 'top-right',
          }
        );
        onClose();
      } else {
        toast.error(response.message || `Failed to ${isEdit ? 'update' : 'create'} supplier. Please try again.`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(
        `An error occurred while ${initialData ? 'updating' : 'creating'} the supplier. Please try again.`,
        {
          duration: 5000,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="relative bg-white max-h-[95vh] overflow-auto rounded-2xl shadow-xl p-6 w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {initialData ? 'Edit Supplier' : 'Add new supplier'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Supplier Name */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Supplier name
              </label>
              <span className="text-red-500">*</span>
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:outline-none ${errors.name
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b]'
                }`}
              placeholder="Enter supplier name"
              disabled={isLoading} 
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Contact email
              </label>
            </div>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:outline-none ${errors.contact_email
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b]'
                }`}
              placeholder="Enter supplier contact email (optional)"
              disabled={isLoading}
              required
            />
            {errors.contact_email && (
              <p className="mt-1 text-sm text-red-500">{errors.contact_email}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Contact phone
              </label>
            </div>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              placeholder="Enter supplier contact phone (optional)"
              disabled={isLoading}
              required
            />
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Address
              </label>
            </div>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              placeholder="Enter supplier address (optional)"
              disabled={isLoading}
              required
            ></textarea>
          </div>

          {/* Website */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Website
              </label>
            </div>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:outline-none ${errors.website
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b]'
                }`}
              placeholder="Enter supplier website (optional)"
              disabled={isLoading}
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-500">{errors.website}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Notes
              </label>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              placeholder="Enter any notes (optional)"
              disabled={isLoading}
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              style={{ backgroundColor: goldColor }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Supplier' : 'Add new supplier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
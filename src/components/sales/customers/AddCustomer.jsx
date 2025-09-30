"use client"

import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";

const AddCustomerModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        state: "",
        status: "active"
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone === "" ? null : formData.phone,
                address: formData.address === "" ? null : formData.address,
                state: formData.state === "" ? null : formData.state,
                status: formData.status === "" ? null : formData.status
            };

            await apiService.createCustomer(payload, null);
            toast.success("Customer added successfully!");
            setFormData({
                name: "",
                phone: "",
                email: "",
                address: "",
                state: "",
                status: "active"
            });
            onClose();
        } catch (error) {
            let errorMessage = error.message;
            if (errorMessage.includes('duplicate key value violates unique constraint "customers_email_key"')) {
                errorMessage = "Customer already exists";
            } else if (errorMessage.includes("Validation failed")) {
                errorMessage = error.message;
            } else {
                errorMessage = errorMessage || "Failed to add customer";
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#b88b1b]">Add New Customer</h2>
                    <button onClick={onClose} disabled={isLoading}>
                        <FontAwesomeIcon icon={faTimes} className={`text-gray-600 hover:text-[#b88b1b] ${isLoading ? 'opacity-50' : ''}`} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            disabled={isLoading}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#886817] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"></path>
                                    </svg>
                                    Adding...
                                </span>
                            ) : (
                                "Add Customer"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCustomerModal;
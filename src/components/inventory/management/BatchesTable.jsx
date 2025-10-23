"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import CreateBatchModal from "./CreateBatchModal";
import EditBatchModal from "./EditBatchModal";
import ViewBatchModal from "./ViewBatchModal";
import DeleteBatchModal from "./DeleteBatchModal";
import toast from 'react-hot-toast';

export default function BatchesTable({ onDataChange }) {
    const [batches, setBatches] = useState([]);
    const [suppliers, setSuppliers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    useEffect(() => {
        loadBatches();
    }, []);

    const fetchSupplierDetails = async (supplierId) => {
        try {
            if (suppliers[supplierId]) {
                return suppliers[supplierId];
            }

            const response = await apiService.getSupplierById(supplierId);
            if (response.status === 'success' && response.data) {
                const supplierData = response.data[0] || response.data;
                setSuppliers(prev => ({
                    ...prev,
                    [supplierId]: supplierData
                }));
                return supplierData;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching supplier ${supplierId}:`, error);
            toast.error('Failed to fetch supplier details');
            return null;
        }
    };

    const loadBatches = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.getImportBatches();

            if (response.status === 'success') {
                const batchesData = response.data || [];
                setBatches(batchesData);

                const supplierPromises = batchesData.map(batch =>
                    fetchSupplierDetails(batch.supplier_id)
                );

                await Promise.all(supplierPromises);
            } else {
                setError('Failed to load import batches');
                toast.error('Failed to load import batches');
            }
        } catch (error) {
            console.error('Error loading batches:', error);
            setError('Failed to load import batches');
            toast.error('Failed to load import batches');
        } finally {
            setLoading(false);
        }
    };

    const getSupplierDisplayName = (supplierId) => {
        const supplier = suppliers[supplierId];
        return supplier ? supplier.name : "Loading...";
    };

    const getSupplierDetails = (supplierId) => {
        const supplier = suppliers[supplierId];
        if (!supplier) {
            return { name: "Loading...", contact: "", email: "", address: "" };
        }

        return {
            name: supplier.name,
            contact: supplier.contact_phone || "N/A",
            email: supplier.contact_email || "N/A",
            address: supplier.address || "N/A"
        };
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        loadBatches();
        onDataChange();
    };

    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        setSelectedBatch(null);
        loadBatches();
        onDataChange();
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        setSelectedBatch(null);
        loadBatches();
        onDataChange();
    };

    const openEditModal = (batch) => {
        setSelectedBatch(batch);
        setShowEditModal(true);
    };

    const openViewModal = async (batch) => {
        setSelectedBatch(batch);
        await fetchSupplierDetails(batch.supplier_id);
        setShowViewModal(true);
    };

    const openDeleteModal = (batch) => {
        setSelectedBatch(batch);
        setShowDeleteModal(true);
    };

    const statusColors = {
        processing: 'bg-yellow-100 text-yellow-800',
        completed: 'bg-green-100 text-green-800',
        in_transit: 'bg-purple-100 text-purple-800'
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b88b1b]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Import Batches</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#b88b1b] text-white px-4 py-2 rounded-lg transition-all hover:bg-[#856515] flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Batch
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Batch Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Expected Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Received Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {batches.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    No import batches found
                                </td>
                            </tr>
                        ) : (
                            batches.map((batch) => (
                                <tr key={batch.batch_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {batch.batch_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getSupplierDisplayName(batch.supplier_id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {batch.expected_date || 'Not set'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {batch.received_date || 'Not received'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[batch.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {batch.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => openViewModal(batch)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="View Details"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(batch)}
                                            disabled={batch.status === 'completed'}
                                            className={`p-1 rounded ${batch.status === 'completed' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-900 hover:bg-green-50'}`}
                                            title="Edit Batch"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(batch)}
                                            disabled={batch.status === 'completed'}
                                            className={`p-1 rounded ${batch.status === 'completed' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900 hover:bg-red-50'}`}
                                            title="Delete Batch"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateBatchModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {showEditModal && selectedBatch && (
                <EditBatchModal
                    batch={selectedBatch}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            {showViewModal && selectedBatch && (
                <ViewBatchModal
                    batch={selectedBatch}
                    supplierDetails={getSupplierDetails(selectedBatch.supplier_id)}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            {showDeleteModal && selectedBatch && (
                <DeleteBatchModal
                    batch={selectedBatch}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    );
}
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faAngleLeft, faAngleRight, faPlus, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { SupplierModal } from './SuppliersModal';
import DeleteModal from './DeleteModal';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

// Skeleton Loading Components
const TableSkeleton = () => {
  return (
    <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-4">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PaginationSkeleton = () => {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
        ))}
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
    </div>
  );
};

export const SupplierTable = () => {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch suppliers from the backend
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getSuppliers(router);
        if (response.status === 'success') {
          setSuppliers(response.data || []);
          setFilteredData(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch suppliers');
        }
      } catch (err) {
        setError('An error occurred while fetching suppliers');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  // Filter suppliers based on search term
  useEffect(() => {
    const results = suppliers.filter(item =>
      Object.values(item).some(value =>
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(results);
    setCurrentPage(1);
  }, [searchTerm, suppliers]);

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
    // Refresh suppliers after modal close (in case of create/update)
    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getSuppliers(router);
        if (response.status === 'success') {
          setSuppliers(response.data || []);
          setFilteredData(response.data || []);
        }
      } catch (err) {
        console.error('Error refreshing suppliers:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  };

  const handleOpenDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedSupplier(null);
    setIsDeleting(false);
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setIsDeleting(true);
    try {
      const response = await apiService.deleteSupplier(selectedSupplier.supplier_id, router);
      if (response.status === 'success') {
        setSuppliers(prev => prev.filter(supplier => supplier.supplier_id !== selectedSupplier.supplier_id));
        setFilteredData(prev => prev.filter(supplier => supplier.supplier_id !== selectedSupplier.supplier_id));
        handleCloseDeleteModal();
      } else {
        throw new Error(response.message || 'Failed to delete supplier');
      }
    } catch (err) {
      console.error('Delete error:', err);
      throw err; // This will be caught in the DeleteModal
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <button
          key="1"
          className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer text-gray-600"
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pageNumbers.push(
          <span key="ellipsis-start" className="px-2 py-1">
            <FontAwesomeIcon icon={faEllipsis} className="text-gray-400" />
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${currentPage === i ? 'text-white font-medium' : 'text-gray-600'}`}
          style={currentPage === i ? { backgroundColor: goldColor } : {}}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="ellipsis-end" className="px-2 py-1">
            <FontAwesomeIcon icon={faEllipsis} className="text-gray-400" />
          </span>
        );
      }
      pageNumbers.push(
        <button
          key={totalPages}
          className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer text-gray-600"
          onClick={() => setCurrentPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return pageNumbers;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold flex-shrink-0">Supplier list table</h2>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search suppliers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-md text-white font-medium flex-shrink-0 flex items-center justify-center gap-2"
            style={{ backgroundColor: goldColor }}
            onClick={() => handleOpenModal()}
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add new supplier
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <>
          <TableSkeleton />
          <PaginationSkeleton />
        </>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      )}

      {/* Success State */}
      {!isLoading && !error && (
        <>
          <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item) => (
                  <tr key={item.supplier_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.contact_phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.contact_email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.website || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.notes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-4 text-gray-500">
                        <button
                          className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                          aria-label="Edit"
                          onClick={() => handleOpenModal(item)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          aria-label="Delete"
                          onClick={() => handleOpenDeleteModal(item)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No suppliers found matching your search criteria.
            </div>
          )}

          {filteredData.length > 0 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 disabled:opacity-50"
                style={{ backgroundColor: goldColor }}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <FontAwesomeIcon icon={faAngleLeft} className="text-white text-sm" />
              </button>
              <div className="flex gap-2 text-sm font-medium">
                {renderPaginationNumbers()}
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 disabled:opacity-50"
                style={{ backgroundColor: goldColor }}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <FontAwesomeIcon icon={faAngleRight} className="text-white text-sm" />
              </button>
            </div>
          )}
        </>
      )}

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedSupplier}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDelete}
        itemName={selectedSupplier?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SupplierTable;
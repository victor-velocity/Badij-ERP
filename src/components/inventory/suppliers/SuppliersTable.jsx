"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faAngleLeft, faAngleRight, faPlus, faEllipsis } from '@fortawesome/free-solid-svg-icons';
import { SupplierModal } from './SuppliersModal';

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

export const SupplierTable = () => {
  const initialSupplierData = [
    { id: 'SJP-001', name: 'FormModel L4', contact: 'John Smith', phone: '+1 428 4450 890', email: 'jsmp@umwood.com', products: 'Site cost, GoRite tables', status: 'Active' },
    { id: 'SJP-002', name: 'WaveDrivlinn Co.', contact: 'Emily Johnson', phone: '+44 29 5555 678', email: 'emily@wavedrivlinn.com', products: 'Bittering tables, Bookshakers', status: 'Active' },
    { id: 'SJP-003', name: 'Combat Living Inc.', contact: 'Ahmed Khan', phone: '+971 55 224 567', email: 'ahmed@comfortable.g.com', products: 'Bork, Brothers', status: 'Inactive' },
    { id: 'SJP-004', name: 'Urban Office works', contact: 'Linda Moore', phone: '+1 495 339 222', email: 'linda@urbanoffice.com', products: 'Office clubs, Books', status: 'Active' },
    { id: 'SJP-005', name: 'Quidoor Disspace', contact: 'Mark Taylor', phone: '+15 2 333 444', email: 'mark@quidoor.com', products: 'Paste cost, Quidoor furniture', status: 'Active' },
    { id: 'SJP-006', name: 'FormModel L4', contact: 'John Smith', phone: '+1 428 4450 890', email: 'jsmp@umwood.com', products: 'Site cost, GoRite tables', status: 'Active' },
    { id: 'SJP-007', name: 'WaveDrivlinn Co.', contact: 'Emily Johnson', phone: '+44 29 5555 678', email: 'emily@wavedrivlinn.com', products: 'Bittering tables, Bookshakers', status: 'Active' },
    { id: 'SJP-008', name: 'Combat Living Inc.', contact: 'Ahmed Khan', phone: '+971 55 224 567', email: 'ahmed@comfortable.g.com', products: 'Bork, Brothers', status: 'Active' },
    { id: 'SJP-009', name: 'Urban Office works', contact: 'Linda Moore', phone: '+971 55 224 567', email: 'linda@urbanoffice.com', products: 'Office clubs, Books', status: 'Inactive' },
    { id: 'SJP-010', name: 'Premium Wood Inc.', contact: 'Robert Brown', phone: '+1 555 123 4567', email: 'robert@premiumwood.com', products: 'Wooden chairs, Tables', status: 'Active' },
    { id: 'SJP-011', name: 'MetalWorks Ltd.', contact: 'Sarah Connor', phone: '+44 20 7946 0958', email: 'sarah@metalworks.com', products: 'Metal frames, Office furniture', status: 'Active' },
    { id: 'SJP-012', name: 'Textile Innovations', contact: 'Michael Bay', phone: '+1 234 567 8901', email: 'michael@textile.com', products: 'Chair upholstery, Cushions', status: 'Inactive' },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(initialSupplierData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    const results = initialSupplierData.filter(item =>
      Object.values(item).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(results);
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
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
          className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${currentPage === i ? 'text-white font-medium' : 'text-gray-600'
            }`}
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

  const getStatusClass = (status) => {
    return status === 'Active'
      ? 'text-green-600 font-medium'
      : 'text-red-600 font-medium';
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
          >
            <FontAwesomeIcon icon={faPlus} />
            Add new supplier
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact person</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email address</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product supplied</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.contact}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.products}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${getStatusClass(item.status)}`}>
                  {item.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4 text-gray-500">
                    <button
                      className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                      aria-label="Edit"
                      onClick={() => handleOpenModal(item)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="text-red-500 hover:text-red-700 transition-colors duration-200" aria-label="Delete">
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

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={selectedSupplier}
      />
    </div>
  );
};

export default SupplierTable;
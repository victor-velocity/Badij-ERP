"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTrash, faAngleLeft, faAngleRight, faTimes, faEdit, faCubes } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import ProductModal from './ProductModal';

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

// Skeleton Row Component
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-4">
      <div className="bg-gray-200 rounded-md w-16 h-16"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-4 py-4">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-4 py-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-40"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="flex items-center space-x-4">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>
    </td>
  </tr>
);

export default function ProductsTable({ onDataChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [productToAssign, setProductToAssign] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts();
      if (response.status === 'success') {
        setProducts(response.data || []);
      } else {
        setError(response.message || 'Failed to load products');
      }
    } catch (error) {
      setError(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const renderPaginationNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(
        <span key="1" className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer" onClick={() => setCurrentPage(1)}>
          1
        </span>
      );
      if (startPage > 2) {
        pageNumbers.push(<span key="ellipsis-start" className="px-3 py-1 rounded-md border border-gray-300">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <span
          key={i}
          className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${currentPage === i ? 'text-white font-medium' : 'text-gray-600'}`}
          style={currentPage === i ? { backgroundColor: goldColor } : {}}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </span>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(<span key="ellipsis-end" className="px-3 py-1 rounded-md border border-gray-300">...</span>);
      }
      pageNumbers.push(
        <span key={totalPages} className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer" onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </span>
      );
    }

    return pageNumbers;
  };

  const handleSave = async (formData) => {
    try {
      let response;
      if (modalType === 'add') {
        response = await apiService.createProduct(formData);
      } else if (modalType === 'edit') {
        response = await apiService.updateProduct(selectedProduct.product_id, formData);
      }

      if (response.status === 'success') {
        toast.success(`Product ${modalType === 'add' ? 'created' : 'updated'} successfully`, { duration: 4000 });
        setModalType(null);
        setSelectedProduct(null);
        await loadProducts();
        if (onDataChange) onDataChange();
      } else {
        toast.error(response.message || `Failed to ${modalType} product`);
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${modalType} product`);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDelete = async (productId) => {
    try {
      const response = await apiService.deleteProduct(productId);
      if (response.status === 'success') {
        toast.success('Product deleted successfully', { duration: 4000 });
        await loadProducts();
        if (onDataChange) onDataChange();
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleAssignComponentsClick = (product) => {
    setProductToAssign(product);
    setShowAssignModal(true);
  };

  // SKELETON LOADER
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header Skeleton */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="flex w-full sm:w-auto gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <div className="h-10 bg-gray-200 rounded-md w-full sm:w-64 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-md w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                {['Image', 'Name', 'SKU', 'Price', 'Description', 'Actions'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Skeleton */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-center items-center gap-2">
          <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={loadProducts}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold flex-shrink-0">Products Management</h2>
        <div className="flex w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-md ml-3 text-white font-medium flex-shrink-0"
            style={{ backgroundColor: goldColor }}
            onClick={() => setModalType('add')}
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Keeping Unit(SKU)</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              currentProducts.map((product) => (
                <tr key={product.product_id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.product_image ? (
                      <img 
                        src={product.product_image} 
                        alt={product.name} 
                        className="w-16 h-16 object-cover rounded-md cursor-pointer" 
                        onClick={() => setExpandedImage(product.product_image)}
                      />
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₦{product.price?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {product.description || 'No description'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button 
                        className="hover:text-blue-700 text-blue-500 transition-colors duration-200" 
                        aria-label="Edit"
                        onClick={() => {
                          setSelectedProduct(product);
                          setModalType('edit');
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50"
            style={{ backgroundColor: goldColor }}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <FontAwesomeIcon icon={faAngleLeft} className="text-white" />
          </button>
          <div className="flex gap-2 text-sm font-medium">
            {renderPaginationNumbers()}
          </div>
          <button
            className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50"
            style={{ backgroundColor: goldColor }}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <FontAwesomeIcon icon={faAngleRight} className="text-white" />
          </button>
        </div>
      )}

      {(modalType === 'add' || modalType === 'edit') && (
        <ProductModal
          type={modalType}
          product={selectedProduct}
          onClose={() => {
            setModalType(null);
            setSelectedProduct(null);
          }}
          onSave={handleSave}
        />
      )}

      {expandedImage && (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50" onClick={() => setExpandedImage(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <img src={expandedImage} alt="Expanded product" className="w-full h-auto rounded-md object-contain max-h-[90vh]" />
            <button
              className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700"
              onClick={() => setExpandedImage(null)}
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
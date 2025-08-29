"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUpload, 
  faChevronDown 
} from '@fortawesome/free-solid-svg-icons';

const goldColor = '#b88b1b';

// Supplier Modal Component
export const SupplierModal = ({ isOpen, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    country: '',
    products: [],
    moq: '',
    deliveryTime: '7',
    attachment: null,
    status: 'Active'
  });

  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        address: initialData.address || '',
        country: initialData.country || '',
        products: initialData.products ? initialData.products.split(', ') : [],
        moq: initialData.moq || '',
        deliveryTime: initialData.deliveryTime || '7',
        attachment: initialData.attachment || null,
        status: initialData.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        address: '',
        country: '',
        products: [],
        moq: '',
        deliveryTime: '7',
        attachment: null,
        status: 'Active'
      });
    }
    setSearchTerm('');
    setShowProductDropdown(false);
  }, [initialData, isOpen]);

  const allProducts = [
    'Site cost',
    'GoRite tables',
    'Bittering tables',
    'Bookshakers',
    'Bork',
    'Brothers',
    'Office clubs',
    'Books',
    'Paste cost',
    'Quidoor furniture',
    'Wooden chairs',
    'Metal frames',
    'Office furniture',
    'Chair upholstery',
    'Cushions'
  ];

  const filteredProducts = allProducts.filter(product =>
    product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  const toggleProduct = (product) => {
    if (formData.products.includes(product)) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p !== product)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, product]
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Submitted:', formData);
    onClose();
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
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
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
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              placeholder="Enter supplier name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate supplier code
            </p>
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Email address
              </label>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              placeholder="Enter the supplier email here"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter supplier phone number here
            </p>
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
              style={{ borderColor: '#d1d5db' }}
              placeholder="Enter supplier address here"
              required
            ></textarea>
          </div>

          {/* Country */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Country
              </label>
            </div>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              required
            >
              <option value="">Select supplier country here</option>
              <option value="USA">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="UAE">United Arab Emirates</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Germany">Germany</option>
              <option value="China">China</option>
              <option value="India">India</option>
            </select>
          </div>

          {/* Products Supplied */}
          <div className="relative">
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Products supplied (multi-select dropdown)
              </label>
            </div>
            <div 
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none cursor-pointer flex justify-between items-center"
              style={{ borderColor: '#d1d5db' }}
              onClick={() => setShowProductDropdown(!showProductDropdown)}
            >
              <span className="text-gray-500">
                {formData.products.length > 0 
                  ? formData.products.join(', ') 
                  : 'Select as many products as possible here'
                }
              </span>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className={`text-gray-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`}
              />
            </div>
            
            {showProductDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded border-gray-300 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
                  />
                </div>
                <div className="py-1">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => toggleProduct(product)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.products.includes(product)}
                        onChange={() => {}}
                        className="mr-2 h-4 w-4 text-[#b88b1b] focus:ring-[#b88b1b] border-gray-300 rounded"
                      />
                      <span>{product}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Minimum Order Quantity */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Minimum Order Quantity (MOQ)
              </label>
            </div>
            <input
              type="number"
              name="moq"
              value={formData.moq}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              placeholder="Enter only numeric and positive values here e.g. 100"
              required
            />
          </div>

          {/* Delivery Time */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Delivery time
              </label>
            </div>
            <select
              name="deliveryTime"
              value={formData.deliveryTime}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              required
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="21">21 days</option>
              <option value="30">30 days</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-md font-medium text-gray-700 mb-2">
              Attachment (contracts, certifications, agreements e.t.c)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                <FontAwesomeIcon icon={faUpload} className="mx-auto text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-gold-600 hover:text-gold-500">
                    <span className='text-[#b88b1b]'>Upload a file</span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 2048KB</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="flex items-center mb-2">
              <label className="block text-md font-medium text-gray-700 mr-2">
                Status
              </label>
            </div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
              style={{ borderColor: '#d1d5db' }}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-md text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-white font-medium"
              style={{ backgroundColor: goldColor }}
            >
              {initialData ? 'Update Supplier' : 'Add new supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
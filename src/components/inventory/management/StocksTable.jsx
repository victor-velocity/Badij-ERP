"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import toast from "react-hot-toast";

const AddComponentModal = ({
  onClose,
  onSuccess,
  productId,
  components,
  existingComponents = [],
}) => {
  const [formData, setFormData] = useState({
    component_id: "",
    quantity: 1,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredComponents, setFilteredComponents] = useState(components);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = components
      .filter((c) => !existingComponents.some((ec) => ec.component_id === c.component_id))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.sku && c.sku.toLowerCase().includes(lower))
      );
    setFilteredComponents(filtered);
  }, [searchTerm, components, existingComponents]);

  const handleSelect = (comp) => {
    setFormData((p) => ({ ...p, component_id: comp.component_id }));
    setSearchTerm(comp.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.component_id || formData.quantity < 1) {
      toast.error("Please select a component and set a valid quantity.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        component_id: formData.component_id,
        quantity: formData.quantity,
      };

      const res = await apiService.addComponentToBOM(productId, payload);

      if (res && (res.status === "success" || res.id)) {
        toast.success("Component added to product BOM");
        onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Failed to add component");
      }
    } catch (err) {
      toast.error(err?.message || "Error adding component");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Add Component to Product</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Component Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Component
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                if (!e.target.value) {
                  setFormData((p) => ({ ...p, component_id: "" }));
                }
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#b88b1b] focus:outline-none"
              placeholder="Search by name or SKU..."
              required
            />
            {showDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredComponents.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No components available
                  </div>
                ) : (
                  filteredComponents.map((c) => (
                    <div
                      key={c.component_id}
                      onMouseDown={() => handleSelect(c)}
                      className="px-4 py-2 cursor-pointer hover:bg-amber-50 flex justify-between"
                    >
                      <span>{c.name}</span>
                      <span className="text-gray-500 text-xs">SKU: {c.sku}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Component */}
          {formData.component_id && (
            <div className="bg-green-50 text-green-800 p-2 rounded text-sm">
              Selected: <strong>{searchTerm}</strong>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Required Quantity
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  quantity: parseInt(e.target.value) || 1,
                }))
              }
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#b88b1b] focus:outline-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#9a7716] disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Component"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Skeleton Row
const SkeletonRow = () => (
  <tr>
    <td className="px-6 py-4">
      <div className="h-5 bg-gray-200 rounded-full w-20 animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
    </td>
  </tr>
);

export default function StocksTable({
  filter = "all",
  searchTerm = "",
  currentPage = 1,
  setCurrentPage,
  itemsPerPage = 10,
  refreshTrigger
}) {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [components, setComponents] = useState([]);

  useEffect(() => {
    loadStockSummary();
  }, [refreshTrigger]);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      const response = await apiService.getComponents();
      if (response.status === "success") {
        setComponents(response.data || []);
      }
    } catch (error) {
      console.error("Error loading components:", error);
    }
  };

  const loadStockSummary = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiService.getStocks();

      if (response.status === "success") {
        const productItems = (response.data.products || []).map((p) => ({
          ...p,
          type: "product",
          id: p.product_id,
          components_needed: p.components_needed || [],
        }));
        const componentItems = (response.data.components || []).map((c) => ({
          ...c,
          type: "component",
          id: c.component_id,
          components_needed: [],
        }));
        setAllItems([...productItems, ...componentItems]);
      } else {
        setError("Failed to load stock summary");
        toast.error("Failed to load stock summary");
        setAllItems([]);
      }
    } catch (error) {
      console.error("Error loading stock summary:", error);
      setError("Failed to load stock summary");
      toast.error("Failed to load stock summary");
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
  return allItems.filter((item) => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch =
      searchTerm === "" ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });
}, [allItems, filter, searchTerm]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddComponent = (productId) => {
    setSelectedProductId(productId);
    setShowAddComponentModal(true);
  };

  const handleAddComponentSuccess = () => {
    setShowAddComponentModal(false);
    loadStockSummary(); // Refresh to show new component
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const typeColors = {
    product: "bg-purple-100 text-purple-800",
    component: "bg-orange-100 text-orange-800",
  };

  const existingComponents = allItems
    .find((i) => i.id === selectedProductId && i.type === "product")
    ?.components_needed || [];

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 rounded p-3">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredItems.length} of {allItems.length} items
        {filter !== "all" && ` (${filter})`}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: Math.min(5, itemsPerPage) }).map((_, index) => (
                <SkeletonRow key={index} />
              ))
            ) : currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {searchTerm || filter !== "all"
                    ? "No items match your search/filter"
                    : "No stock entries found"}
                </td>
              </tr>
            ) : (
              currentItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          typeColors[item.type] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stock_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {item.type === "product" && (
                        <div className="flex items-center gap-3 flex-nowrap">
                          <button
                            onClick={() => handleAddComponent(item.id)}
                            className="bg-[#b88b1b] text-white p-2 rounded-lg text-xs hover:bg-[#9a7716] flex items-center"
                            title="Add Component"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </button>
                          {item.components_needed.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="text-[#b88b1b] hover:text-[#9a7716] p-1 rounded hover:bg-amber-100"
                              title={
                                expanded[item.id]
                                  ? "Hide Components"
                                  : "Show Components"
                              }
                            >
                              <FontAwesomeIcon
                                icon={expanded[item.id] ? faChevronUp : faChevronDown}
                              />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Components */}
                  {item.type === "product" && expanded[item.id] && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Components Needed
                        </h4>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Required
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Available
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {item.components_needed.map((comp) => (
                              <tr key={comp.component_id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {comp.name}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {comp.sku}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {comp.required_quantity}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {comp.available_quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredItems.length)} of{" "}
            {filteredItems.length} items
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  currentPage === page
                    ? "bg-[#b88b1b] text-white border-[#b88b1b]"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Component Modal */}
      {showAddComponentModal && (
        <AddComponentModal
          onClose={() => setShowAddComponentModal(false)}
          onSuccess={handleAddComponentSuccess}
          productId={selectedProductId}
          components={components}
          existingComponents={existingComponents}
        />
      )}
    </div>
  );
}
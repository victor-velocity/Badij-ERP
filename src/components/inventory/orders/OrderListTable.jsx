"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faEye,
  faEdit,
  faChevronLeft,
  faChevronRight,
  faBox,
  faTruck,
  faCheckCircle,
  faTimes,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faCalendar,
  faStickyNote,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import QRScannerModal from "../management/QRScannerModal";

const ITEMS_PER_PAGE = 8;

const statusFlow = {
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
};

const statusConfig = {
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800", icon: faBox },
  shipped: { label: "Shipped", color: "bg-blue-100 text-blue-800", icon: faTruck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: faCheckCircle },
};

// Skeleton Row
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-48"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 bg-gray-200 rounded-full w-24"></div>
    </td>
    <td className="px-6 py-4 text-center">
      <div className="flex justify-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    </td>
  </tr>
);

// Skeleton Table
const SkeletonTable = () => (
  <tbody className="divide-y divide-gray-200">
    {[...Array(5)].map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </tbody>
);

export default function OrderListTable({ orders: initialOrders, router, loading: isLoadingProp = false, autoOpenOrderId = null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Use prop loading or fallback
  const isLoading = isLoadingProp || initialOrders === undefined;

  // Safe filtering
  const filteredOrders = useMemo(() => {
    if (!initialOrders || !Array.isArray(initialOrders)) return [];

    return initialOrders
      .filter((o) => ["processing", "shipped", "delivered"].includes(o.status))
      .filter((o) =>
        [o.order_number, o.status, format(new Date(o.created_at), "PP")]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
  }, [initialOrders, searchTerm]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const openModal = async (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setCustomer(null);
    setLoadingCustomer(true);

    try {
      const cust = await apiService.getCustomerById(order.customer_id, router);
      setCustomer(cust.data || null);
    } catch (err) {
      toast.error("Failed to load customer details");
      console.error(err);
    } finally {
      setLoadingCustomer(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setCustomer(null);
  };

  useEffect(() => {
    if (autoOpenOrderId && initialOrders?.length > 0) {
      const order = initialOrders.find(o => o.order_id === autoOpenOrderId);
      if (order) {
        openModal(order);
        window.history.replaceState({}, "", "/orders");
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete("process");
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [autoOpenOrderId, initialOrders]);

  const updateStatus = async () => {
    if (!selectedOrder || updating) return;
    const nextStatus = statusFlow[selectedOrder.status];
    if (!nextStatus) return;

    const toastId = toast.loading(`Updating status to ${nextStatus}...`);
    setUpdating(true);

    try {
      await apiService.updateOrder(selectedOrder.order_id, { status: nextStatus }, router);
      setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      toast.success(`Order is now ${nextStatus}!`, { id: toastId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.message || "Failed to update status", { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${currentPage === i
            ? "bg-[#153087] text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5">
        <h2 className="text-xl font-bold text-gray-900">Inventory Orders</h2>
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search order ID, status, date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#153087] focus:border-transparent"
            disabled={isLoading}
          />
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Products</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Order Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <SkeletonTable />
            ) : currentOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No inventory orders found
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => {
                const config = statusConfig[order.status] || {};
                return (
                  <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.order_details?.map((d) => `${d.product_id.name} (x${d.quantity})`).join(", ") || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(order.created_at), "PP p")}
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <FontAwesomeIcon icon={config.icon} className="w-4 h-4" />
                        {config.label}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openModal(order)}
                          className="text-[#153087] hover:text-[#9a7516] transition-colors"
                          aria-label="View order"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                        </button>
                        {statusFlow[order.status] && (
                          <button
                            onClick={() => openModal(order)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                            aria-label="Update status"
                          >
                            <FontAwesomeIcon icon={faEdit} className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
          </button>
          <div className="flex gap-1">{renderPagination()}</div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ===== MODAL ===== */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order #{selectedOrder.order_number}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created on {format(new Date(selectedOrder.created_at), "PPP 'at' p")}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-500" />
                    Customer
                  </h4>
                  {loadingCustomer ? (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </div>
                  ) : customer ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-700">{customer.email}</p>
                      <p className="text-sm text-gray-700 mt-1">
                        <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-1 text-gray-500" />
                        {selectedOrder.phone_number}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Customer not found</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-gray-500" />
                    Delivery
                  </h4>
                  <p className="text-sm text-gray-900 whitespace-pre-line">{selectedOrder.dispatch_address}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 mr-1" />
                    Expected: {format(new Date(selectedOrder.delivery_date), "PPP")}
                  </p>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Products</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-700">Product</th>
                        <th className="px-4 py-2 font-medium text-gray-700 text-center">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.order_details?.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">{item.product_id.name}</td>
                          <td className="px-4 py-2 text-gray-900 text-center font-medium">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status]?.color}`}>
                    <FontAwesomeIcon icon={statusConfig[selectedOrder.status]?.icon} className="w-4 h-4" />
                    {statusConfig[selectedOrder.status]?.label}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && selectedOrder.notes.trim() && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faStickyNote} className="w-4 h-4 text-gray-500" />
                    Notes
                  </h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  {statusFlow[selectedOrder.status] && (
                    <span className="text-sm text-gray-600">
                      Next: <strong>{statusConfig[statusFlow[selectedOrder.status]]?.label}</strong>
                    </span>
                  )}
                </div>

                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => setShowScanner(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTruck} />
                    Scan to Ship
                  </button>
                )}

                {selectedOrder.status === 'shipped' && (
                  <button
                    onClick={updateStatus}
                    disabled={updating}
                    className="px-6 py-2.5 bg-[#153087] text-white rounded-lg text-sm font-medium hover:bg-[#9a7516] disabled:opacity-70 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {updating ? (
                      <>Updating...</>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faEdit} />
                        Mark as Delivered
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showScanner && (
        <QRScannerModal
          order={selectedOrder}
          onClose={() => setShowScanner(false)}
          onComplete={() => {
            setShowScanner(false);
            closeModal();
            toast.success("Sale completed!");
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
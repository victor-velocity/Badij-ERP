// app/components/DeleteOrderModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from "react-hot-toast";

const DeleteOrderModal = ({ isOpen, onClose, onDelete, order }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setIsLoading(false);
    }
  }, [order]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      if (order.status !== "Pending") {
        toast.error("Cannot delete order with status other than Pending");
        return;
      }
      onDelete(order.id);
    } catch (error) {
      toast.error("Failed to delete order. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading) return (
    <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
      <FontAwesomeIcon icon={faSpinner} spin size="2x" />
    </div>
  );

  if (!order || order.status !== "Pending") {
    return (
      <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <button onClick={onClose} className="mb-4 px-4 py-2 bg-[#b88b1b] text-white rounded-md">
            <FontAwesomeIcon icon={faTimes} className="mr-2" /> Close
          </button>
          <p className="text-center text-red-500">Order cannot be deleted (Status: {order?.status || "Not Found"})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#b88b1b]">Confirm Delete Order {order.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <p className="mb-4">Are you sure you want to delete this order for <b>{order.customer}</b>?</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting": "Delete"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            disabled={deleteLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
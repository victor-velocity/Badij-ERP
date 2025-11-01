import React from 'react';

const SkeletonLine = () => (
  <div className="space-y-3">
    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
  </div>
);

const SkeletonSupplier = () => (
  <div className="space-y-2">
    <SkeletonLine />
    <SkeletonLine />
    <SkeletonLine />
    <SkeletonLine />
  </div>
);

const ViewBatchModal = ({ batch, supplierDetails, onClose, loading = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatStatus = (status) => {
    const statusMap = {
      processing: 'Processing',
      in_transit: 'In Transit',
      completed: 'Completed'
    };
    return statusMap[status] || status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const statusColors = {
    processing: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
    in_transit: 'bg-blue-50 text-blue-800 ring-blue-600/20',
    completed: 'bg-green-50 text-green-800 ring-green-600/20'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="p-6 space-y-6">
            <SkeletonLine />
            <SkeletonSupplier />
            <div className="grid grid-cols-2 gap-6">
              <SkeletonLine />
              <SkeletonLine />
            </div>
            <SkeletonLine />
            <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Batch Details</h3>
              <p className="text-sm text-gray-500 mt-1">#{batch.batch_number}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Batch Number */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Batch Number
            </label>
            <p className="text-lg font-bold text-gray-900">{batch.batch_number}</p>
          </div>

          {/* Supplier Details */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Supplier Information</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-900">Name</span>
                <span className="text-sm text-gray-600">{supplierDetails.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
                <span className="text-sm font-medium text-gray-900">Phone</span>
                <span className="text-sm text-gray-600">{supplierDetails.contact}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
                <span className="text-sm font-medium text-gray-900">Email</span>
                <span className="text-sm text-gray-600">{supplierDetails.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white border rounded-xl">
                <span className="text-sm font-medium text-gray-900">Address</span>
                <span className="text-sm text-gray-600 truncate max-w-[200px]">{supplierDetails.address}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Date</label>
              <p className={`text-sm font-medium ${batch.expected_date ? 'text-gray-900' : 'text-gray-500 italic'}`}>
                {formatDate(batch.expected_date)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <p className={`text-sm font-medium ${batch.received_date ? 'text-green-600 font-semibold' : 'text-gray-500 italic'}`}>
                {formatDate(batch.received_date) || 'Not received'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full ring-1 ring-inset ${
              statusColors[batch.status] || 'bg-gray-100 text-gray-800 ring-gray-200'
            }`}>
              {formatStatus(batch.status)}
            </span>
          </div>

          {/* Notes */}
          {batch.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{batch.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#b88b1b] text-white rounded-xl font-medium hover:bg-[#9a7516] transition-all shadow-sm hover:shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBatchModal;
"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faUser,
  faTrash,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import EditDocumentModal from './EditDocumentModal';
import DeleteDocumentModal from './DeleteDocumentModal';

const DocumentsTable = ({ documents, loading, employees, onDocumentUpdated }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getUploaderName = (createdById) => {
    if (!createdById || !employees) return 'N/A';
    const uploader = employees.find(emp => emp.id === createdById);
    return uploader ? `${uploader.first_name} ${uploader.last_name}` : 'N/A';
  };

  const handleDownload = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', name || 'document');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowEditModal(true);
  };

  const handleDeleteClick = (doc) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
  };

  // Skeleton loader rows
  const skeletonRows = Array.from({ length: 5 }, (_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-200 rounded w-6"></div>
      </td>
    </tr>
  ));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Uploaded</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              skeletonRows
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No documents found
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {doc.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {doc.type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                      {getUploaderName(doc.created_by)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(doc.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleDownload(doc.url, doc.name)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                      <button
                        onClick={() => handleEditClick(doc)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(doc)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedDocument && (
        <EditDocumentModal
          document={selectedDocument}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          onDocumentUpdated={onDocumentUpdated}
        />
      )}

      {selectedDocument && (
        <DeleteDocumentModal
          document={selectedDocument}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDocument(null);
          }}
          onDocumentUpdated={onDocumentUpdated}
        />
      )}
    </>
  );
};

export default DocumentsTable;
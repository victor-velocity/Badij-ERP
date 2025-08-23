"use client";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisV,
  faDownload,
  faUser,
  faTrash,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef, useEffect } from 'react';
import EditDocumentModal from './EditDocumentModal';
import DeleteDocumentModal from './DeleteDocumentModal';

const DocumentsTable = ({ documents, loading, employees, onDocumentUpdated }) => {
  const [showDropdown, setShowDropdown] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const dropdownRef = useRef(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getFileExtension = (url) => {
    if (!url) return 'N/A';
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('.').pop().toUpperCase();
    } catch {
      return 'N/A';
    }
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

  const toggleDropdown = (docId, e) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === docId ? null : docId);
  };

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowEditModal(true);
    setShowDropdown(null);
  };

  const handleDeleteClick = (doc) => {
    setSelectedDocument(doc);
    setShowDeleteModal(true);
    setShowDropdown(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Type</th>
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
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                    {getFileExtension(doc.url)}
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
                  <td className="px-6 py-4 whitespace-nowrap flex gap-3 ml-3">
                    <button
                      onClick={() => handleDownload(doc.url, doc.name)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Download"
                    >
                      <FontAwesomeIcon icon={faDownload} />
                    </button>
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={(e) => toggleDropdown(doc.id, e)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FontAwesomeIcon icon={faEllipsisV} />
                      </button>
                      {showDropdown === doc.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <div className="py-1">
                            <button
                              onClick={() => handleEditClick(doc)}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <FontAwesomeIcon icon={faEdit} className="mr-2" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(doc)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                            >
                              <FontAwesomeIcon icon={faTrash} className="mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
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
"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@/app/lib/supabase/client';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const AddEmployeeDocumentModal = ({
  isOpen,
  onClose,
  employees,
  currentEmployeeId,
  onDocumentAdded
}) => {
  const supabase = createClient();
  const [documents, setDocuments] = useState([
    { name: '', type: '', category: '', file: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const activeEmployees = useMemo(() => {
    return employees.filter(
      employee => employee.employment_status?.toLowerCase() !== 'terminated'
    );
  }, [employees]);

  const fileTypes = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "jpeg",
    "png",
    "txt"
  ];

  const documentCategories = [
    "official documents",
    "contracts",
    "certificates",
    "ids",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index][field] = value;
    setDocuments(updatedDocuments);
  };

  const detectFileType = (file) => {
    if (!file) return '';

    // First try to detect from extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (fileTypes.includes(extension)) {
      return extension;
    }

    // If extension not in our list, try to detect from MIME type
    const mimeType = file.type;
    if (mimeType) {
      const mimeParts = mimeType.split('/');
      if (mimeParts.length > 1) {
        const typeFromMime = mimeParts[1].toLowerCase();
        if (fileTypes.includes(typeFromMime)) {
          return typeFromMime;
        }

        // Handle specific MIME type mappings
        const mimeMappings = {
          'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
          'vnd.ms-excel': 'xls',
          'vnd.ms-word': 'doc',
          'jpeg': 'jpg',
        };

        if (mimeMappings[typeFromMime]) {
          return mimeMappings[typeFromMime];
        }
      }
    }

    // Fallback to extension even if not in our list
    return extension;
  };

  const handleFileChange = (index, file) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index].file = file;

    // Auto-detect file type
    if (file) {
      const detectedType = detectFileType(file);
      if (detectedType) {
        updatedDocuments[index].type = detectedType;
      } else {
        // Clear type if no file is selected or type can't be detected
        updatedDocuments[index].type = '';
      }

      // Auto-populate name if empty
      if (!updatedDocuments[index].name) {
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        updatedDocuments[index].name = fileNameWithoutExt;
      }
    }

    setDocuments(updatedDocuments);
  };

  const addDocumentField = () => {
    setDocuments([...documents, { name: '', type: '', category: '', file: null }]);
  };

  const removeDocumentField = (index) => {
    if (documents.length > 1) {
      const updatedDocuments = documents.filter((_, i) => i !== index);
      setDocuments(updatedDocuments);
    }
  };

  const uploadFileToSupabase = async (file, bucketName, folderPath) => {
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${folderPath}/${fileName}`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const validateDocuments = () => {
    const typeCounts = {};
    for (const doc of documents) {
      if (!doc.name || !doc.type || !doc.category || !doc.file) {
        throw new Error("Please fill in all fields (Name, Category) and select a File for each document.");
      }

      // Check for duplicate types in this upload
      const lowerType = doc.type.toLowerCase();
      if (typeCounts[lowerType]) {
        throw new Error(`Duplicate file type "${doc.type}" in this upload. Each document must have a unique file type.`);
      }
      typeCounts[lowerType] = true;

      // Validate file type is supported
      if (!fileTypes.includes(lowerType)) {
        throw new Error(`File type "${doc.type}" is not supported. Supported types: ${fileTypes.join(', ')}`);
      }
    }

    if (!currentEmployeeId) {
      throw new Error("No employee selected");
    }
  };

  const resetForm = () => {
    setDocuments([{ name: '', type: '', category: '', file: null }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      validateDocuments();

      // Upload all files and create payload
      const uploadPromises = documents.map(doc =>
        uploadFileToSupabase(doc.file, 'documents', 'employee_documents')
          .then(url => ({
            name: doc.name,
            type: doc.type, // Uses the automatically detected type
            category: doc.category,
            url: url
          }))
      );

      const payload = await Promise.all(uploadPromises);

      await apiService.addEmployeeDocuments(
        currentEmployeeId,
        payload,
        router
      );

      toast.success(`${documents.length} document(s) uploaded successfully!`);
      resetForm();
      onClose();
      onDocumentAdded();

    } catch (error) {
      console.error("Upload failed:", error);
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        toast.error('A document with this file type already exists for the selected employee. Please choose a different type or update the existing document.');
      } else {
        toast.error(error.message || "Document upload failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Helper function to find current employee details
  const getCurrentEmployeeName = () => {
    const emp = activeEmployees.find(e => e.id === currentEmployeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Current Employee';
  };

  return (
    <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload Document(s)</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Uploading to: <span className="font-semibold">{getCurrentEmployeeName()}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Documents
              </label>
              <button
                type="button"
                onClick={addDocumentField}
                className="text-sm text-[#153087] hover:text-[#8d6b14] font-medium disabled:opacity-50"
                disabled={isSubmitting}
              >
                + Add Another Document
              </button>
            </div>

            {documents.map((doc, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-300 rounded-lg relative">
                {documents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDocumentField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </button>
                )}

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Document Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded border-gray-400 focus:ring-[#153087] focus:border-[#153087] focus:outline-none disabled:opacity-50"
                    value={doc.name}
                    onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      File Type (Auto-detected)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded bg-gray-100 border-gray-400 focus:outline-none disabled:opacity-50"
                      value={doc.type.toUpperCase() || 'Awaiting file upload...'}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Category
                    </label>
                    <select
                      className="w-full p-2 border rounded border-gray-400 focus:ring-[#153087] focus:border-[#153087] focus:outline-none disabled:opacity-50"
                      value={doc.category}
                      onChange={(e) => handleDocumentChange(index, 'category', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select Category</option>
                      {documentCategories.map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    File
                  </label>
                  <input
                    type="file"
                    className="w-full p-2 file:mr-4 file:py-2 file:px-4
  file:rounded file:border-0
  file:text-sm file:font-semibold
  file:bg-[#153087] file:text-white
  hover:file:bg-[#8d6b14] disabled:opacity-50"
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    required
                    disabled={isSubmitting}
                    accept={fileTypes.map(type => `.${type}`).join(',')}
                  />
                  {doc.file && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {doc.file.name} (Detected Type: <span className='font-semibold'>{doc.type.toUpperCase()}</span>)
                    </p>
                  )}
                  {!doc.type && doc.file && (
                    <p className="text-red-500 text-xs mt-1">
                      File type could not be automatically determined or is unsupported.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border rounded border-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#153087] text-white rounded hover:bg-[#faf714] hover:text-[black] transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : `Upload ${documents.length} Document(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeDocumentModal;
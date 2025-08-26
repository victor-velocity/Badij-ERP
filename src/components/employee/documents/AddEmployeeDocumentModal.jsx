"use client";
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createClient } from '@/app/lib/supabase/client';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const AddEmployeeDocumentModal = ({ 
  isOpen, 
  onClose, 
  currentEmployeeId,
  onDocumentAdded 
}) => {
  const supabase = createClient();
  const [documents, setDocuments] = useState([
    { name: '', type: '', category: '', file: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  const handleDocumentChange = (index, field, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index][field] = value;
    setDocuments(updatedDocuments);
  };

  const handleFileChange = (index, file) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index].file = file;
    
    if (!updatedDocuments[index].type && file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (fileTypes.includes(extension)) {
        updatedDocuments[index].type = extension;
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
    if (!currentEmployeeId) {
      throw new Error("Employee ID is required");
    }
    
    for (const doc of documents) {
      if (!doc.name || !doc.type || !doc.category || !doc.file) {
        throw new Error("Please fill in all fields for each document");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      validateDocuments();

      const uploadPromises = documents.map(doc => 
        uploadFileToSupabase(doc.file, 'documents', 'employee_documents')
          .then(url => ({
            name: doc.name,
            type: doc.type,
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
      onClose();
      onDocumentAdded();
      
      setDocuments([{ name: '', type: '', category: '', file: null }]);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error.message || "Document upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Upload Document(s)</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
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
                className="text-sm text-[#b88b1b] hover:text-[#8d6b14] font-medium"
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
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
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
                    className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-0 focus:outline-none"
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
                      File Type
                    </label>
                    <select
                      className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-0 focus:outline-none"
                      value={doc.type}
                      onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select File Type</option>
                      {fileTypes.map(type => (
                        <option key={type} value={type}>
                          {type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                      Category
                    </label>
                    <select
                      className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-0 focus:outline-none"
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
                      file:bg-[#b88b1b] file:text-white
                      hover:file:bg-[#8d6b14]"
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 border rounded border-gray-400 hover:bg-gray-100 transition-colors"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#8d6b14] transition-colors"
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
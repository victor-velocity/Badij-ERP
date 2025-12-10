"use client";
import React, { useState, useEffect, useMemo } from 'react';
import apiService from '@/app/lib/apiService';
import DocumentsSummary from '@/components/employee/documents/DocumentsSummary';
import DocumentsTable from '@/components/employee/documents/DocumentsTable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import AddEmployeeDocumentModal from '@/components/employee/documents/AddEmployeeDocumentModal';

const DocumentsPage = () => {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const router = useRouter();

  const first_name = typeof window !== 'undefined' ? localStorage.getItem('first_name') : '';

  const documentCategories = useMemo(() => [
    "official documents",
    "contracts",
    "certificates",
    "ids"
  ], []);

  // Fetch current employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        const employeeData = await apiService.getEmployees(router);

        if (employeeData && typeof employeeData === 'object') {
          setCurrentEmployee(employeeData);

          const employeeDocs = (employeeData.employee_documents || []).map(doc => ({
            ...doc,
            employeeName: `${employeeData.first_name} ${employeeData.last_name}`,
            employeeId: employeeData.id,
            created_by: doc.created_by || employeeData.id,
            name: doc.name || 'Unnamed Document',
            type: doc.type || 'Unknown',
            category: doc.category || 'official documents', // Make sure category is included
            url: doc.url || '#'
          }));

          setDocuments(employeeDocs);
        } else {
          console.warn('Unexpected employee data format:', employeeData);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [router]);

  useEffect(() => {
    const updateDateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting('Good Morning');
      } else if (hours >= 12 && hours < 18) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }

      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      setCurrentDateTime(now.toLocaleString('en-US', options));
    };

    updateDateTimeAndGreeting();
    const intervalId = setInterval(updateDateTimeAndGreeting, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const refreshDocuments = async () => {
    setLoading(true);
    try {
      const employeeData = await apiService.getEmployees(router);
      
      if (employeeData && typeof employeeData === 'object') {
        setCurrentEmployee(employeeData);

        const employeeDocs = (employeeData.employee_documents || []).map(doc => ({
          ...doc,
          employeeName: `${employeeData.first_name} ${employeeData.last_name}`,
          employeeId: employeeData.id,
          created_by: doc.created_by || employeeData.id,
          name: doc.name || 'Unnamed Document',
          type: doc.type || 'Unknown',
          category: doc.category || 'official documents',
          url: doc.url || '#'
        }));

        setDocuments(employeeDocs);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    if (!documents.length) return [];

    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.type && doc.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.category && doc.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filter === 'all' ||
        doc.category === filter ||
        doc.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, filter]);

  const categories = useMemo(() => {
    const totalDocuments = documents.length;

    const categoryCounts = documentCategories.map(category => ({
      name: category,
      count: documents.filter(d => d.category === category).length
    }));

    return [
      { name: 'all', count: loading ? '-' : totalDocuments },
      ...categoryCounts.map(category => ({
        name: category.name,
        count: loading ? '-' : category.count
      }))
    ];
  }, [documents, loading, documentCategories]);

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleDocumentAdded = async () => {
    await refreshDocuments();
  };

  return (
    <div>
      <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold '>Employee Documents</h1>
          <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
        </div>
        <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
          {currentDateTime}
        </span>
      </div>

      <DocumentsSummary
        categories={categories}
        activeFilter={filter}
        onFilterChange={setFilter}
        loading={loading}
      />

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {currentEmployee ? `${currentEmployee.first_name}'s Documents` : 'Documents'}
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="flex items-center gap-2 bg-[#153087] text-white px-4 py-2 rounded-md hover:bg-[#faf714] hover:text-[black] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleOpenUploadModal}
              disabled={loading || !currentEmployee}
              title={!currentEmployee ? "Cannot upload - employee data not loaded" : "Upload document"}
            >
              <FontAwesomeIcon icon={faUpload} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        <DocumentsTable
          documents={filteredDocuments}
          loading={loading}
          employees={[currentEmployee].filter(Boolean)}
          onDocumentUpdated={refreshDocuments}
        />
      </div>

      <AddEmployeeDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        employees={[currentEmployee].filter(Boolean)}
        currentEmployeeId={currentEmployee?.id}
        onDocumentAdded={handleDocumentAdded}
      />
    </div>
  );
};

export default DocumentsPage;
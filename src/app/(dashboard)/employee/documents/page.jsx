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
  const [employees, setEmployees] = useState([]);
  const [authUserId, setAuthUserId] = useState(null);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allEmployees = await apiService.getEmployees(router);
        const validEmployees = Array.isArray(allEmployees) ? allEmployees : [];
        setEmployees(validEmployees);

        const foundEmployee = validEmployees.find(emp => emp.user_id === authUserId);
        if (foundEmployee) setCurrentEmployee(foundEmployee);

        const docs = validEmployees.flatMap(employee =>
          (employee.employee_documents || []).map(doc => ({
            ...doc,
            employeeName: `${employee.first_name} ${employee.last_name}`,
            employeeId: employee.id,
            created_by: doc.created_by || employee.id,
            name: doc.name || 'Unnamed Document',
            type: doc.type || 'Unknown',
            url: doc.url || '#'
          }))
        );

        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUserId, router]);

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

  const handleDocumentAdded = async () => {
    setLoading(true);
    try {
      const allEmployees = await apiService.getEmployees(router);
      const validEmployees = Array.isArray(allEmployees) ? allEmployees : [];
      setEmployees(validEmployees);

      const foundEmployee = validEmployees.find(emp => emp.user_id === authUserId);
      if (foundEmployee) setCurrentEmployee(foundEmployee);

      const docs = validEmployees.flatMap(employee =>
        (employee.employee_documents || []).map(doc => ({
          ...doc,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          employeeId: employee.id,
          created_by: doc.created_by || employee.id,
          name: doc.name || 'Unnamed Document',
          type: doc.type || 'Unknown',
          url: doc.url || '#'
        }))
      );

      setDocuments(docs);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const documentTypes = useMemo(() => [
    "official documents",
    "contracts",
    "certificates",
    "ids"
  ], []);

  const filteredDocuments = useMemo(() => {
    if (!documents.length) return [];

    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.type && doc.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filter === 'all' || doc.type === filter;
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, filter]);

  const categories = useMemo(() => {
    const totalDocuments = documents.length;
    const typeCounts = documentTypes.map(type => ({
      name: type,
      count: documents.filter(d => d.type === type).length
    }));

    return [
      { name: 'all', count: loading ? '-' : totalDocuments },
      ...typeCounts.map(type => ({
        name: type.name,
        count: loading ? '-' : type.count
      }))
    ];
  }, [documents, loading, documentTypes]);

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
          <h3 className="text-lg font-semibold">Recently Added</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="flex items-center gap-2 bg-[#b88b1b] text-white px-4 py-2 rounded-md hover:bg-[#8d6b14] transition-colors"
              onClick={() => setIsUploadModalOpen(true)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faUpload} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        <DocumentsTable
          documents={filteredDocuments}
          loading={loading}
          employees={employees}
        />
      </div>

      <AddEmployeeDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        employees={employees}
        currentEmployeeId={currentEmployee?.id}
        onDocumentAdded={handleDocumentAdded}
      />
    </div>
  );
};

export default DocumentsPage;
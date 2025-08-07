"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PayslipConfirmationModal from '@/components/hr/payroll/PayslipConfirmationModal';
import AddDeductionModal from '@/components/hr/payroll/AddDeductionModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import apiService from '@/app/lib/apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlus } from '@fortawesome/free-solid-svg-icons';

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const PreparePayroll = () => {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [defaultCharges, setDefaultCharges] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedEmployeeDeductions, setSelectedEmployeeDeductions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeductionsLoading, setIsDeductionsLoading] = useState(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    const [isAddDeductionModalOpen, setIsAddDeductionModalOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');

    const mappedEmployees = useMemo(() => {
        if (!employees) return [];
        return employees.map(emp => ({
            id: emp.employee_details?.id,
            name: `${emp.employee_details?.first_name} ${emp.employee_details?.last_name}`,
            title: emp.employee_details?.department,
            avatar_url: emp.employee_details?.avatar_url,
            isReadyForPayroll: emp.isReadyForPayroll,
        }));
    }, [employees]);

    const selectedEmployee = useMemo(() => {
        const emp = mappedEmployees.find(emp => emp.id === selectedEmployeeId);
        if (!emp) return null;

        const employeeDeductions = selectedEmployeeDeductions?.map(deduction => {
            const chargeDetails = deduction.reasondefault_charge;
            return {
                id: chargeDetails?.id,
                name: chargeDetails?.charge_name || "Unknown Charge",
                price: chargeDetails?.penalty_fee || 0,
            };
        }) || [];

        const totalDeductions = employeeDeductions.reduce((sum, ded) => sum + ded.price, 0);

        const fullEmployeeData = employees.find(e => e.employee_details?.id === selectedEmployeeId);
        const grossSalary = (fullEmployeeData?.salary?.base_salary || 0) + (fullEmployeeData?.salary?.bonus || 0) + (fullEmployeeData?.salary?.incentives || 0);
        const netSalary = grossSalary - totalDeductions;

        return {
            ...emp,
            baseSalary: fullEmployeeData?.salary?.base_salary || 0,
            bonus: fullEmployeeData?.salary?.bonus || 0,
            incentives: fullEmployeeData?.salary?.incentives || 0,
            deductions: employeeDeductions,
            totalDeductions,
            grossSalary,
            netSalary,
        };
    }, [mappedEmployees, selectedEmployeeId, selectedEmployeeDeductions, employees]);

    const filteredEmployees = useMemo(() => {
        return mappedEmployees.filter(employee => {
            if (!employee || !employee.name || !employee.title) return false;
            const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDepartment = selectedDepartment === '' || employee.title.toLowerCase().includes(selectedDepartment.toLowerCase());
            const matchesStatus = selectedStatus === '' || (selectedStatus === 'Ready' && employee.isReadyForPayroll) || (selectedStatus === 'Pending' && !employee.isReadyForPayroll);
            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [mappedEmployees, searchTerm, selectedDepartment, selectedStatus]);

    const readyForPayrollCount = useMemo(() => {
        return mappedEmployees.filter(emp => emp.isReadyForPayroll).length;
    }, [mappedEmployees]);

    const handleEmployeeSelect = (id) => {
        setSelectedEmployeeId(id);
    };

    const handleEmployeeReadinessChange = useCallback((id) => {
        setEmployees(prevEmployees =>
            prevEmployees.map(emp =>
                emp.employee_details.id === id ? { ...emp, isReadyForPayroll: !emp.isReadyForPayroll } : emp
            )
        );
    }, []);

    const handleDeselectAll = () => {
        setEmployees(prevEmployees =>
            prevEmployees.map(emp => ({ ...emp, isReadyForPayroll: false }))
        );
    };

    const handleOpenAddDeductionModal = () => {
        if (selectedEmployee && selectedEmployee.isReadyForPayroll) {
            setIsAddDeductionModalOpen(true);
        } else {
            toast.info('Please mark the employee as "Ready" to add deductions.');
        }
    };

    const handleCloseAddDeductionModal = () => {
        setIsAddDeductionModalOpen(false);
    };

    const handleAddDeduction = useCallback((newDeduction) => {
        setSelectedEmployeeDeductions(prev => [...prev, newDeduction]);
    }, []);

    const handleOpenPayslipModal = () => {
        if (selectedEmployee && selectedEmployee.isReadyForPayroll) {
            setIsPayslipModalOpen(true);
        } else {
            toast.info('Please mark the employee as "Ready" to view the payslip.');
        }
    };

    const handleClosePayslipModal = () => {
        setIsPayslipModalOpen(false);
    };

    const handleConfirmPayslip = () => {
        toast.success(`Payslip for ${selectedEmployee.name} confirmed and generated!`);
        setIsPayslipModalOpen(false);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setIsLoading(true);
                const employeeData = await apiService.getEmployeePayments(router);
                const chargesData = await apiService.getDefaultCharges(router);
                
                const initialEmployees = employeeData.map(emp => ({
                    ...emp,
                    isReadyForPayroll: false
                }));
                setEmployees(initialEmployees);
                setDefaultCharges(chargesData);
            } catch (err) {
                toast.error("Failed to load employee data.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [router]);

    useEffect(() => {
        const fetchDeductions = async () => {
            if (!selectedEmployeeId) {
                setSelectedEmployeeDeductions([]);
                return;
            }

            try {
                setIsDeductionsLoading(true);
                const deductionsData = await apiService.getDeductionsById(selectedEmployeeId, router);
                // Handle the case where the API returns a 204 No Content
                if (deductionsData === null) {
                    setSelectedEmployeeDeductions([]);
                } else {
                    setSelectedEmployeeDeductions(deductionsData);
                }
            } catch (err) {
                toast.error(`Failed to load deductions for employee ID ${selectedEmployeeId}.`);
                console.error(err);
            } finally {
                setIsDeductionsLoading(false);
            }
        };

        fetchDeductions();
    }, [selectedEmployeeId, router]);

    useEffect(() => {
        if (!selectedEmployeeId && mappedEmployees.length > 0) {
            setSelectedEmployeeId(mappedEmployees[0].id);
        } else if (selectedEmployeeId && !mappedEmployees.find(emp => emp.id === selectedEmployeeId)) {
            setSelectedEmployeeId(mappedEmployees.length > 0 ? mappedEmployees[0].id : null);
        }
    }, [mappedEmployees, selectedEmployeeId]);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
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
        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto p-4">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Confirm and review employees</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] w-full sm:w-auto"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                        <option value="">All Dept</option>
                        {[...new Set(mappedEmployees.map(emp => emp.title))].map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] w-full sm:w-auto"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="Ready">Ready</option>
                        <option value="Pending">Pending</option>
                    </select>
                    <button
                        onClick={handleOpenPayslipModal}
                        className={`px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 flex items-center justify-center
                            ${selectedEmployee && selectedEmployee.isReadyForPayroll ? 'hover:bg-gray-300' : 'opacity-50 cursor-not-allowed'}`
                        }
                        disabled={!selectedEmployee || !selectedEmployee.isReadyForPayroll}
                    >
                        <FontAwesomeIcon icon={faEye} className="mr-2" /> View Payslip
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/2 xl:w-2/5 bg-white rounded-xl shadow-lg p-6 max-h-[820px] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Employee ready for payroll</h2>
                            <p className="text-sm text-gray-500">
                                {readyForPayrollCount} out of {mappedEmployees.length} employees are ready for payroll
                            </p>
                        </div>
                        <button
                            onClick={handleDeselectAll}
                            className="text-[#b88b1b] font-medium hover:text-[#a37a1a] transition-colors"
                        >
                            Deselect all
                        </button>
                    </div>

                    <div className="space-y-3 min-h-[400px] overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                                Loading employees...
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">No employees found matching your search criteria.</p>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                                    ${selectedEmployeeId === employee.id ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50 hover:bg-gray-100'}
                                    `}
                                    onClick={() => handleEmployeeSelect(employee.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-5 w-5 text-[#b88b1b] rounded focus:ring-[#b88b1b] mr-3"
                                        checked={employee.isReadyForPayroll}
                                        onChange={() => handleEmployeeReadinessChange(employee.id)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm mr-3">
                                        {employee.avatar_url ? (
                                            <img src={employee.avatar_url} alt={employee.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            employee.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-medium text-gray-900">{employee.name}</p>
                                        <p className="text-sm text-gray-500">{employee.title}</p>
                                    </div>
                                    {employee.isReadyForPayroll && (
                                        <span className="px-3 py-1 text-xs font-medium text-[#b88b1b] bg-yellow-100 rounded-full">
                                            Ready
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-1/2 xl:w-3/5 bg-white rounded-xl shadow-lg p-6">
                    {selectedEmployee ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg mr-4">
                                        {selectedEmployee.avatar_url ? (
                                            <img src={selectedEmployee.avatar_url} alt={selectedEmployee.name} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            selectedEmployee.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{selectedEmployee.name}</h3>
                                        <p className="text-sm text-gray-500">{selectedEmployee.title}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleOpenPayslipModal}
                                    className={`px-6 py-2 bg-[#b88b1b] text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-opacity-75
                                        ${selectedEmployee.isReadyForPayroll ? 'hover:bg-[#a37a1a]' : 'opacity-50 cursor-not-allowed'}`
                                    }
                                    disabled={!selectedEmployee || !selectedEmployee.isReadyForPayroll}
                                >
                                    Next
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="block text-sm font-medium text-gray-700 mb-2">Base Salary</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(selectedEmployee.baseSalary)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="block text-sm font-medium text-gray-700 mb-2">Bonus</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(selectedEmployee.bonus)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="block text-sm font-medium text-gray-700 mb-2">Incentives</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(selectedEmployee.incentives)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="block text-sm font-medium text-gray-700 mb-2">Gross Salary</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(selectedEmployee.grossSalary)}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                               <div className='flex justify-between gap-4 flex-nowrap items-center mb-4'>
                                    <p className="text-sm font-medium text-gray-700">Deductions</p>
                                    <button
                                        onClick={handleOpenAddDeductionModal}
                                        className={`text-sm font-medium text-gray-700 ${
                                            selectedEmployee.isReadyForPayroll ? 'hover:text-[#b88b1b]' : 'opacity-50 cursor-not-allowed'
                                        }`}
                                        disabled={!selectedEmployee.isReadyForPayroll}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                               </div>
                                <div className="space-y-2">
                                    {isDeductionsLoading ? (
                                        <div className="flex items-center justify-center py-4 text-gray-500">
                                             Loading deductions...
                                        </div>
                                    ) : selectedEmployee.deductions.length > 0 ? (
                                        selectedEmployee.deductions.map((deduction) => (
                                            <div key={deduction.id} className="flex items-center justify-between">
                                                <span className="ml-3 text-gray-700">{deduction.name}</span>
                                                <span className="text-gray-500 font-medium">{formatCurrency(deduction.price)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No deductions for this employee.</p>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-300 flex items-center justify-between">
                                    <p className="text-lg font-semibold text-gray-900">Total Deductions</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {isDeductionsLoading ? '--' : formatCurrency(selectedEmployee.totalDeductions)}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[400px] text-gray-500">
                            Select an employee to view details.
                        </div>
                    )}
                </div>
            </div>
            {/* RENDER MODALS */}
            <PayslipConfirmationModal
                employee={selectedEmployee}
                isOpen={isPayslipModalOpen}
                onClose={handleClosePayslipModal}
                onConfirm={handleConfirmPayslip}
            />
            <AddDeductionModal
                isOpen={isAddDeductionModalOpen}
                onClose={handleCloseAddDeductionModal}
                defaultCharges={defaultCharges}
                employeeId={selectedEmployeeId}
                onAddDeduction={handleAddDeduction}
            />
        </div>
    );
};

export default PreparePayroll;
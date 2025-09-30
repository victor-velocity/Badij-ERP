"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PayslipConfirmationModal from '@/components/hr/payroll/PaySlipConfirmationModal';
import AddDeductionModal from '@/components/hr/payroll/AddDeductionModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import apiService from '@/app/lib/apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPlus } from '@fortawesome/free-solid-svg-icons';
import EditDeductionModal from '@/components/hr/payroll/EditDeductionModal';
import DefaultChargesModal from '@/components/hr/payroll/DefaultChargesModal';
import AddDefaultChargeModal from '@/components/hr/payroll/AddDefaultChargeModal';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const LOCAL_STORAGE_KEYS = {
    EMPLOYEE_STATE: 'preparePayrollEmployeeState',
    SELECTED_EMPLOYEE_ID: 'preparePayrollSelectedEmployeeId',
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
    const [isEditDeductionModalOpen, setIsEditDeductionModalOpen] = useState(false);
    const [currentDeduction, setCurrentDeduction] = useState(null);
    const [isDefaultChargesModalOpen, setIsDefaultChargesModalOpen] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState([]);
    const [isAddDefaultChargeModalOpen, setIsAddDefaultChargeModalOpen] = useState(false);

    // Helper function to check if payroll can be prepared for an employee
    const canPreparePayrollForEmployee = (employee) => {
        if (!employee) return false;
        if (!employee.next_due_date) return true;

        const today = new Date();
        let dueDate;
        try {
            dueDate = new Date(employee.next_due_date);
            if (isNaN(dueDate.getTime())) return true;
        } catch {
            return true;
        }
        return dueDate <= today;
    };

    // Fetch all necessary data
    const fetchAllData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [employeeData, chargesData, employeesDetails] = await Promise.all([
                apiService.getEmployeePayments(router),
                apiService.getDefaultCharges(router),
                apiService.getEmployees(router)
            ]);

            setEmployeeDetails(employeesDetails);

            const paymentIds = new Set(employeeData.map(emp => emp['month-yearemployee_details']?.id).filter(Boolean));
            const detailIds = new Set(employeesDetails.map(e => e.id));
            const commonIds = [...paymentIds].filter(id => detailIds.has(id));

            const excludedIds = [...paymentIds].filter(id => !detailIds.has(id));
            if (excludedIds.length > 0) {
                console.warn('DEBUG: Excluded payment IDs (no matching details):', excludedIds);
            }

            const savedState = localStorage.getItem(LOCAL_STORAGE_KEYS.EMPLOYEE_STATE);
            const parsedState = savedState ? JSON.parse(savedState) : [];

            let initialEmployees = commonIds.map(id => {
                const empData = employeeData.find(emp => emp['month-yearemployee_details']?.id === id);
                const savedEmp = parsedState.find(s => s['month-yearemployee_details']?.id === id);
                const employeeDetail = employeesDetails.find(e => e.id === id);

                return {
                    ...empData,
                    isReadyForPayroll: savedEmp ? savedEmp.isReadyForPayroll : false,
                    canPreparePayroll: canPreparePayrollForEmployee(employeeDetail)
                };
            });

            setEmployees(initialEmployees);
            setDefaultCharges(chargesData);

            const savedEmployeeId = localStorage.getItem(LOCAL_STORAGE_KEYS.SELECTED_EMPLOYEE_ID);
            const validSavedId = savedEmployeeId && commonIds.includes(savedEmployeeId) ? savedEmployeeId : null;
            if (validSavedId) {
                setSelectedEmployeeId(validSavedId);
            } else if (initialEmployees.length > 0) {
                setSelectedEmployeeId(initialEmployees[0]['month-yearemployee_details'].id);
            } else {
                console.warn('No common employees found between payments and details.');
            }
        } catch (err) {
            toast.error("Failed to load employee data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Map employees with additional details
    const mappedEmployees = useMemo(() => {
        if (!employees) return [];
        const result = employees.map(emp => {
            const employeeDetail = employeeDetails.find(e => e.id === emp['month-yearemployee_details']?.id);
            const details = emp['month-yearemployee_details'];
            const mapped = {
                id: details?.id,
                name: `${details?.first_name || ''} ${details?.last_name || ''}`.trim() || 'Unknown Employee',
                title: details?.department || employeeDetail?.departments?.name || 'Unknown',
                avatar_url: details?.avatar_url,
                isReadyForPayroll: emp.isReadyForPayroll,
                canPreparePayroll: emp.canPreparePayroll,
                next_due_date: employeeDetail?.next_due_date || details?.next_due_date,
                employment_status: employeeDetail?.employment_status
            };
            return mapped;
        });

        return result.filter(employee =>
            employee.employment_status?.toLowerCase() !== 'terminated'
        );
    }, [employees, employeeDetails]);

    // Calculate selected employee details
    const selectedEmployee = useMemo(() => {
        const emp = mappedEmployees.find(emp => emp.id === selectedEmployeeId);
        if (!emp) return null;

        const employeeDeductions = selectedEmployeeDeductions?.map(deduction => {
            const chargeDetails = deduction.default_charge;
            const penaltyFee = chargeDetails?.penalty_fee || 0;
            const pardonedFee = deduction.pardoned_fee || 0;
            const instances = deduction.instances || 1;

            const finalDeduction = (penaltyFee * instances) - pardonedFee;

            return {
                id: deduction.id,
                name: chargeDetails?.charge_name || "Unknown Charge",
                price: finalDeduction > 0 ? finalDeduction : 0,
                originalPrice: penaltyFee * instances,
                instances: instances,
                pardoned_fee: pardonedFee,
                reason: deduction.reason || '',
                default_charge: chargeDetails
            };
        }) || [];

        const totalDeductions = employeeDeductions.reduce((sum, ded) => sum + ded.price, 0);

        const fullEmployeeData = employees.find(e => e['month-yearemployee_details']?.id === selectedEmployeeId);  // Updated key
        const employeeDetail = employeeDetails.find(e => e.id === selectedEmployeeId);
        const details = fullEmployeeData?.['month-yearemployee_details'];
        const baseSalary = fullEmployeeData?.salary?.base_salary || 0;
        const bonus = fullEmployeeData?.salary?.bonus || 0;
        const incentives = fullEmployeeData?.salary?.incentives || 0;
        const compensation = fullEmployeeData?.salary?.compensation || 0;

        const grossSalary = baseSalary + bonus + incentives;
        const netSalary = grossSalary - totalDeductions;

        return {
            ...emp,
            baseSalary,
            bonus,
            incentives,
            compensation,
            deductions: employeeDeductions,
            totalDeductions,
            grossSalary,
            netSalary,
            canPreparePayroll: canPreparePayrollForEmployee(employeeDetail)
        };
    }, [mappedEmployees, selectedEmployeeId, selectedEmployeeDeductions, employees, employeeDetails]);

    // Filter employees based on search and filters
    const filteredEmployees = useMemo(() => {
        const result = mappedEmployees.filter(employee => {
            if (!employee || !employee.name || !employee.title) {
                return false;
            }
            const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDepartment = selectedDepartment === '' || employee.title.toLowerCase().includes(selectedDepartment.toLowerCase());
            const matchesStatus = selectedStatus === '' || (selectedStatus === 'Ready' && employee.isReadyForPayroll) || (selectedStatus === 'Pending' && !employee.isReadyForPayroll);
            const finalMatch = matchesSearch && matchesDepartment && matchesStatus;
            return finalMatch;
        });
        return result;
    }, [mappedEmployees, searchTerm, selectedDepartment, selectedStatus]);

    // Count ready employees
    const readyForPayrollCount = useMemo(() => {
        const count = mappedEmployees.filter(emp => emp.isReadyForPayroll).length;
        return count;
    }, [mappedEmployees]);

    // Handlers
    const handleEmployeeSelect = (id) => {
        setSelectedEmployeeId(id);
    };

    const handleEmployeeReadinessChange = useCallback((id) => {
        setEmployees(prevEmployees => {
            return prevEmployees.map(emp => {
                if (emp['month-yearemployee_details']?.id === id) {  // Updated key
                    const employeeDetail = employeeDetails.find(e => e.id === id);
                    if (!canPreparePayrollForEmployee(employeeDetail)) {
                        toast.error("Cannot prepare payroll for this employee yet. Check next due date.");
                        return emp;
                    }
                    return { ...emp, isReadyForPayroll: !emp.isReadyForPayroll };
                }
                return emp;
            });
        });
    }, [employeeDetails]);

    const handleDeselectAll = () => {
        setEmployees(prevEmployees =>
            prevEmployees.map(emp => ({ ...emp, isReadyForPayroll: false }))
        );
    };

    const handleOpenAddDeductionModal = () => {
        if (selectedEmployee && selectedEmployee.isReadyForPayroll && selectedEmployee.canPreparePayroll) {
            setIsAddDeductionModalOpen(true);
        } else if (!selectedEmployee.canPreparePayroll) {
            toast.error('Cannot add deductions - employee not due for payroll');
        } else {
            toast.info('Please mark the employee as "Ready" to add deductions.');
        }
    };

    const handleCloseAddDeductionModal = () => {
        setIsAddDeductionModalOpen(false);
    };

    const handleOpenPayslipModal = () => {
        if (selectedEmployee && selectedEmployee.isReadyForPayroll && selectedEmployee.canPreparePayroll) {
            setIsPayslipModalOpen(true);
        } else if (!selectedEmployee.canPreparePayroll) {
            toast.error('Cannot view payslip - employee not due for payroll');
        } else {
            toast.info('Please mark the employee as "Ready" to view the payslip.');
        }
    };

    const handleClosePayslipModal = () => {
        setIsPayslipModalOpen(false);
    };

    const handleConfirmPayslip = () => {
        toast.success(`Payment for ${selectedEmployee.name} confirmed!`);
        setIsPayslipModalOpen(false);
    };

    const handleEditDeduction = (deduction) => {
        if (!deduction) {
            toast.error("No deduction selected for editing");
            return;
        }

        if (!selectedEmployee.canPreparePayroll) {
            toast.error('Cannot edit deductions - employee not due for payroll');
            return;
        }

        const deductionToEdit = {
            id: deduction.id,
            instances: deduction.instances || 1,
            pardoned_fee: deduction.pardoned_fee || 0,
            reason: deduction.reason || '',
            default_charge: deduction.default_charge || {
                charge_name: deduction.name || "Unknown Charge",
                penalty_fee: deduction.price / (deduction.instances || 1)
            }
        };

        setCurrentDeduction(deductionToEdit);
        setIsEditDeductionModalOpen(true);
    };

    const handleRefreshCharges = useCallback(async () => {
        try {
            const chargesData = await apiService.getDefaultCharges(router);
            setDefaultCharges(chargesData);
        } catch (err) {
            toast.error("Failed to refresh default charges");
            console.error(err);
        }
    }, [router]);

    // Fetch deductions for selected employee
    const fetchDeductions = useCallback(async () => {
        if (!selectedEmployeeId) {
            setSelectedEmployeeDeductions([]);
            return;
        }

        try {
            setIsDeductionsLoading(true);
            const deductionsData = await apiService.getDeductionsById(selectedEmployeeId, router);
            setSelectedEmployeeDeductions(deductionsData || []);
        } catch (err) {
            toast.error(`Failed to load deductions for employee ID ${selectedEmployeeId}.`);
            console.error(err);
        } finally {
            setIsDeductionsLoading(false);
        }
    }, [selectedEmployeeId, router]);

    const handleAddDeduction = useCallback(async () => {
        try {
            setIsDeductionsLoading(true);
            const updatedDeductions = await apiService.getDeductionsById(selectedEmployeeId, router);
            setSelectedEmployeeDeductions(updatedDeductions || []);
        } catch (err) {
            toast.error('Failed to refresh deductions');
            console.error(err);
        } finally {
            setIsDeductionsLoading(false);
        }
    }, [selectedEmployeeId, router]);

    // Effects
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        if (employees.length > 0) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.EMPLOYEE_STATE, JSON.stringify(employees));
        }
    }, [employees]);

    useEffect(() => {
        if (selectedEmployeeId !== null) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.SELECTED_EMPLOYEE_ID, selectedEmployeeId);
        }
    }, [selectedEmployeeId]);

    useEffect(() => {
        fetchDeductions();
    }, [selectedEmployeeId, fetchDeductions]);

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
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization's teams</p>
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
                        {[...new Set(mappedEmployees.map(emp => emp.title))].map((dept, index) => (
                            <option key={index} value={dept}>{dept}</option>
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
                        onClick={() => setIsDefaultChargesModalOpen(true)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-75 flex items-center justify-center hover:bg-gray-300"
                    >
                        <FontAwesomeIcon icon={faEye} className="mr-2" /> View Default Charges
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Employee List */}
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
                            filteredEmployees.map((employee) => {
                                const employeeDetail = employeeDetails.find(e => e.id === employee.id);
                                const canPrepare = canPreparePayrollForEmployee(employeeDetail);

                                return (
                                    <div
                                        key={employee.id}
                                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedEmployeeId === employee.id ? 'bg-yellow-50 border border-yellow-300' : 'bg-gray-50 hover:bg-gray-100'} ${!canPrepare ? 'opacity-50' : ''}`}
                                        onClick={() => handleEmployeeSelect(employee.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className={`form-checkbox h-5 w-5 text-[#b88b1b] rounded focus:ring-[#b88b1b] mr-3 ${!canPrepare ? 'cursor-not-allowed' : ''}`}
                                            checked={employee.isReadyForPayroll}
                                            onChange={() => handleEmployeeReadinessChange(employee.id)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!canPrepare) {
                                                    e.preventDefault();
                                                    toast.error("Cannot prepare payroll for this employee yet. Check next due date.");
                                                }
                                            }}
                                            disabled={!canPrepare}
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
                                            {employeeDetail?.next_due_date && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Next due: {new Date(employeeDetail.next_due_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        {!canPrepare && (
                                            <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full ml-2">
                                                Not Due
                                            </span>
                                        )}
                                        {employee.isReadyForPayroll && canPrepare && (
                                            <span className="px-3 py-1 text-xs font-medium text-[#b88b1b] bg-yellow-100 rounded-full">
                                                Ready
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Employee Details */}
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
                                        {selectedEmployee.next_due_date && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Next payroll due: {new Date(selectedEmployee.next_due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleOpenPayslipModal}
                                    className={`px-6 py-2 bg-[#b88b1b] text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-opacity-75 ${selectedEmployee.isReadyForPayroll && selectedEmployee.canPreparePayroll ? 'hover:bg-[#a37a1a]' : 'opacity-50 cursor-not-allowed'}`}
                                    disabled={!selectedEmployee || !selectedEmployee.isReadyForPayroll || !selectedEmployee.canPreparePayroll}
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
                                        className={`text-sm font-medium text-gray-700 ${selectedEmployee.isReadyForPayroll && selectedEmployee.canPreparePayroll ? 'hover:text-[#b88b1b]' : 'opacity-50 cursor-not-allowed'}`}
                                        disabled={!selectedEmployee.isReadyForPayroll || !selectedEmployee.canPreparePayroll}
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
                                            <div
                                                key={deduction.id}
                                                className="flex items-center justify-between group relative"
                                            >
                                                <div className="flex items-center">
                                                    <span className="ml-3 text-gray-700">
                                                        {deduction.name} ({deduction.instances} instances)
                                                        {deduction.pardoned_fee > 0 && (
                                                            <span className="text-xs text-green-600 ml-2">
                                                                (Pardoned: {formatCurrency(deduction.pardoned_fee)})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-gray-500 font-medium mr-2">
                                                        {formatCurrency(deduction.price)}
                                                    </span>
                                                    {deduction.reason && (
                                                        <div className="absolute left-0 -top-0 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                            {deduction.reason}
                                                        </div>
                                                    )}
                                                    {selectedEmployee.canPreparePayroll && (
                                                        <button
                                                            onClick={() => handleEditDeduction(deduction)}
                                                            className="text-gray-400 hover:text-[#b88b1b] opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
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

            {/* Modals */}
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
                onSuccess={handleAddDeduction}
            />
            <EditDeductionModal
                isOpen={isEditDeductionModalOpen}
                onClose={() => setIsEditDeductionModalOpen(false)}
                deduction={currentDeduction}
                employeeId={selectedEmployeeId}
                onSuccess={handleAddDeduction}
            />
            <DefaultChargesModal
                charges={defaultCharges}
                isOpen={isDefaultChargesModalOpen}
                onClose={() => setIsDefaultChargesModalOpen(false)}
                refreshCharges={handleRefreshCharges}
            />
            <AddDefaultChargeModal
                isOpen={isAddDefaultChargeModalOpen}
                onClose={() => setIsAddDefaultChargeModalOpen(false)}
                onSuccess={handleRefreshCharges}
            />
        </div>
    );
};

export default PreparePayroll;
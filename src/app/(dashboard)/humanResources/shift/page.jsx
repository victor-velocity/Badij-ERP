"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import ShiftCard from "@/components/hr/shift/ShiftCard";
import UpdateShiftModal from "@/components/hr/shift/UpdateShiftModal";
import ManageShiftTypesModal from "@/components/hr/shift/ManageShiftTypesModal";
import CreateShiftTypeModal from "@/components/hr/shift/CreateShiftTypeModal";
import ShiftTable from "@/components/hr/shift/ShiftTable";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faQuestionCircle, faSun, faCloudSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ShiftPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAssignShiftModalOpen, setIsAssignShiftModalOpen] = useState(false);
    const [isManageShiftTypesModalOpen, setIsManageShiftTypesModalOpen] = useState(false);
    const [isCreateShiftTypeModalOpen, setIsCreateShiftTypeModalOpen] = useState(false);
    const [allAssignedShifts, setAllAssignedShifts] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeToUpdateShift, setEmployeeToUpdateShift] = useState(null);
    const [currentShift, setCurrentShift] = useState({ name: 'No Active Shift', start_time: '--:--', end_time: '--:--' });

    const shiftCache = useRef(new Map());
    const employeeCache = useRef(new Map()); // Cache for employee details

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                           hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            setCurrentDateTime(now.toLocaleString('en-US', opts));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    const fetchAssignedShifts = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const schedules = await apiService.getCurrentShiftSchedules(router);
            const transformed = await Promise.all(schedules.map(async (s) => {
                let shiftName = 'Unassigned';
                let startTime = 'N/A';
                let endTime = 'N/A';

                if (s.shift_type_id) {
                    let shift = shiftCache.current.get(s.shift_type_id);
                    if (!shift) {
                        try {
                            shift = await apiService.getShiftById(s.shift_type_id, router);
                            shiftCache.current.set(s.shift_type_id, shift);
                        } catch (e) {
                            console.error("Failed to fetch shift:", e);
                        }
                    }
                    if (shift) {
                        shiftName = shift.name;
                        startTime = shift.start_time.substring(0, 5);
                        endTime = shift.end_time.substring(0, 5);
                    }
                }

                // Fetch full employee details (position + department)
                let position = 'N/A';
                let department = 'N/A';
                if (s.employee?.id) {
                    let emp = employeeCache.current.get(s.employee.id);
                    if (!emp) {
                        try {
                            emp = await apiService.getEmployeeById(s.employee.id, router);
                            employeeCache.current.set(s.employee.id, emp);
                        } catch (e) {
                            console.error("Failed to fetch employee:", e);
                        }
                    }
                    if (emp) {
                        position = emp.position ?? 'N/A';
                        department = emp.departments?.name ?? 'N/A';
                    }
                }

                return {
                    id: s.id,
                    employee: {
                        id: s.employee?.id || 'N/A',
                        name: `${s.employee?.first_name || ''} ${s.employee?.last_name || ''}`.trim() || 'N/A',
                        email: s.employee?.email || 'N/A',
                        avatar_url: s.employee?.avatar_url || '/default-profile.png',
                        first_name: s.employee?.first_name || '',
                        last_name: s.employee?.last_name || ''
                    },
                    department,
                    position,
                    shiftType: shiftName,
                    shiftTypeId: s.shift_type_id || null,
                    date: s.start_date ? new Date(s.start_date).toLocaleDateString('en-US') : 'N/A',
                    endDate: s.end_date ? new Date(s.end_date).toLocaleDateString('en-US') : 'N/A',
                    startTime,
                    endTime,
                    originalScheduleData: s
                };
            }));
            setAllAssignedShifts(transformed);
        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to load shift schedules.");
            toast.error(e.message || "Failed to load shift schedules.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchShiftTypes = async () => {
        try { setShiftTypes(await apiService.getShifts(router)); }
        catch (e) { console.error(e); toast.error(e.message || "Failed to load shift types."); }
    };

    const fetchAllEmployees = async () => {
        try { setAllEmployees(await apiService.getEmployees(router)); }
        catch (e) { console.error(e); toast.error(e.message || "Failed to load employees."); }
    };

    useEffect(() => { fetchAssignedShifts(); fetchShiftTypes(); fetchAllEmployees(); }, [fetchAssignedShifts, router]);

    const detectCurrentShift = useCallback(async () => {
        const now = new Date();
        const curMins = now.getHours() * 60 + now.getMinutes();

        for (const sched of allAssignedShifts) {
            if (!sched.shiftTypeId) continue;

            let shift = shiftCache.current.get(sched.shiftTypeId);
            if (!shift) {
                try { shift = await apiService.getShiftById(sched.shiftTypeId, router); shiftCache.current.set(sched.shiftTypeId, shift); }
                catch (e) { console.error(e); continue; }
            }

            const [sh, sm] = shift.start_time.split(':').map(Number);
            const [eh, em] = shift.end_time.split(':').map(Number);
            const startMins = sh * 60 + sm;
            const endMins = eh * 60 + em;

            const active = startMins <= endMins
                ? curMins >= startMins && curMins < endMins
                : curMins >= startMins || curMins < endMins;

            if (active) {
                setCurrentShift({
                    name: shift.name,
                    start_time: shift.start_time.substring(0,5),
                    end_time: shift.end_time.substring(0,5)
                });
                return;
            }
        }
        setCurrentShift({ name: 'No Active Shift', start_time: '--:--', end_time: '--:--' });
    }, [allAssignedShifts, router]);

    useEffect(() => {
        if (allAssignedShifts.length) {
            detectCurrentShift();
            const iv = setInterval(detectCurrentShift, 60_000);
            return () => clearInterval(iv);
        }
    }, [allAssignedShifts, detectCurrentShift]);

    const handleSearchChange = e => setSearchTerm(e.target.value);

    const handleUpdateShiftSchedule = async data => {
        try {
            const { scheduleId, shiftTypeId, startDate, endDate, employeeId } = data;
            if (scheduleId) {
                await apiService.updateShiftSchedule(scheduleId, {
                    shift_type_id: shiftTypeId === "unassign" ? null : shiftTypeId,
                    start_date: startDate,
                    end_date: endDate
                }, router);
                toast.success("Shift schedule updated!");
            } else {
                await apiService.createShiftSchedule({
                    employee_id: employeeId,
                    shift_type_id: shiftTypeId,
                    start_date: startDate,
                    end_date: endDate
                }, router);
                toast.success("Shift assigned!");
            }
            setIsAssignShiftModalOpen(false);
            setEmployeeToUpdateShift(null);
            fetchAssignedShifts();
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Failed to update schedule.");
        }
    };

    const handleCreateShiftType = async d => {
        try {
            await apiService.createShift(router, d);
            toast.success("Shift type created!");
            setIsCreateShiftTypeModalOpen(false);
            fetchShiftTypes();
            fetchAssignedShifts();
        } catch (e) { console.error(e); toast.error(e.message || "Failed to create shift type."); }
    };

    const handleUpdateShiftType = async (id, d) => {
        toast.loading("Updating...", { id: `upd-${id}` });
        try {
            await apiService.updateShift(id, d, router);
            toast.success("Shift type updated!", { id: `upd-${id}` });
            fetchShiftTypes();
            fetchAssignedShifts();
        } catch (e) {
            console.error(e);
            toast.error(`Failed: ${e.message || "unknown"}`, { id: `upd-${id}` });
        }
    };

    const getShiftColor = name => {
        const m = { Morning: 'bg-yellow-50 text-yellow-700',
                    Afternoon: 'bg-blue-50 text-blue-700',
                    Night: 'bg-gray-50 text-gray-700' };
        return m[name] || 'bg-gray-100 text-gray-600';
    };

    const renderSearchBar = () => (
        <div className="relative rounded-md shadow-sm w-full max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#b88b1b] sm:text-sm sm:leading-6 focus:border-0"
                   placeholder="Search shifts..." value={searchTerm} onChange={handleSearchChange} />
        </div>
    );

    const filteredShifts = allAssignedShifts.filter(s => {
        if (!s) return false;
        const low = searchTerm.toLowerCase();
        return s.employee?.name?.toLowerCase().includes(low) ||
               s.department?.toLowerCase().includes(low) ||
               s.position?.toLowerCase().includes(low) ||
               s.shiftType?.toLowerCase().includes(low);
    });

    const unassignedCount = allAssignedShifts.filter(s => s.shiftType === 'Unassigned').length;

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Shift Management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Organize and track employee work schedules efficiently.</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
                <ShiftCard title="Unassigned Shifts" count={unassignedCount} loading={loading}
                           icon={faQuestionCircle} bgColor="bg-red-50" textColor="text-red-700"/>
                <ShiftCard title="Morning Shifts"
                           count={allAssignedShifts.filter(s=>s.shiftType==='Morning').length}
                           loading={loading} icon={faSun} bgColor="bg-yellow-50" textColor="text-yellow-700"/>
                <ShiftCard title="Afternoon Shifts"
                           count={allAssignedShifts.filter(s=>s.shiftType==='Afternoon').length}
                           loading={loading} icon={faCloudSun} bgColor="bg-blue-50" textColor="text-blue-700"/>
                <ShiftCard title="Night Shifts"
                           count={allAssignedShifts.filter(s=>s.shiftType==='Night').length}
                           loading={loading} icon={faMoon} bgColor="bg-gray-50" textColor="text-gray-700"/>
                <div className={`p-4 rounded-lg ${getShiftColor(currentShift.name)} flex items-center space-x-3 min-w-[200px]`}>
                    <FontAwesomeIcon icon={
                        currentShift.name.includes('Morning') ? faSun :
                        currentShift.name.includes('Afternoon') ? faCloudSun :
                        currentShift.name.includes('Night') ? faMoon : faQuestionCircle
                    } className="h-6 w-6"/>
                    <div>
                        <p className="text-xs font-medium">Current Shift</p>
                        <p className="text-sm font-bold">{currentShift.name}</p>
                        <p className="text-xs">{currentShift.start_time} – {currentShift.end_time}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-white border-b border-gray-200 rounded-t-lg">
                <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">Shift Schedules</h1>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    {renderSearchBar()}
                    <button onClick={()=>{ setEmployeeToUpdateShift({employee:{id:null,name:'',email:'',avatar_url:''},originalScheduleData:null}); setIsAssignShiftModalOpen(true); }}
                            className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto">
                        Assign Shift
                    </button>
                    <button onClick={()=>setIsCreateShiftTypeModalOpen(true)}
                            className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto">
                        Create Shift Type
                    </button>
                    <button onClick={()=>setIsManageShiftTypesModalOpen(true)}
                            className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto">
                        Manage Shift Types
                    </button>
                </div>
            </div>

            <div className="mt-0">
                <ShiftTable shifts={filteredShifts}
                            onOpenUpdateShiftModal={s=>{setEmployeeToUpdateShift(s);setIsAssignShiftModalOpen(true);}}
                            loading={loading} error={error}/>
            </div>

            <UpdateShiftModal isOpen={isAssignShiftModalOpen}
                onClose={()=>{setIsAssignShiftModalOpen(false);setEmployeeToUpdateShift(null);}}
                onAssignShift={handleUpdateShiftSchedule}
                shiftTypes={shiftTypes} employee={employeeToUpdateShift} allEmployees={allEmployees}/>
            <ManageShiftTypesModal isOpen={isManageShiftTypesModalOpen}
                onClose={()=>setIsManageShiftTypesModalOpen(false)}
                shiftTypes={shiftTypes}
                onUpdateShiftType={handleUpdateShiftType}
                onDeleteShiftType={async id=>{
                    try{await apiService.deleteShift(id,router);toast.success("Deleted!");fetchShiftTypes();fetchAssignedShifts();}
                    catch(e){console.error(e);toast.error(e.message||"Failed");}
                }}/>
            <CreateShiftTypeModal isOpen={isCreateShiftTypeModalOpen}
                onClose={()=>setIsCreateShiftTypeModalOpen(false)} onCreateShiftType={handleCreateShiftType}/>
        </div>
    );
}
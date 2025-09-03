"use client";

import React, { useState, useEffect } from "react";
import TaskCard from "@/components/hr/tasks/TaskCard";
import TaskTable from "@/components/hr/tasks/TasksTable";
import AddTaskModal from "@/components/hr/tasks/AddTaskModal";
import ViewTaskModal from "@/components/hr/tasks/ViewTaskModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function TaskPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const router = useRouter();

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
                hour12: true
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 60000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const tasks = await apiService.getTasks(router);

            if (!tasks || tasks.length === 0) {
                setAllTasks([]);
                setLoading(false);
                return;
            }

            const processedTasks = tasks.map(task => {
                const dueDate = task.end_date ? new Date(task.end_date) : null;
                const now = new Date();
                const isOverdue = dueDate && !isNaN(dueDate) && dueDate < now && task.status !== 'Completed';

                const assignedEmployees = task.task_assignments?.map(assignment => {
                    const employee = assignment.employees || {
                        first_name: 'Unknown',
                        last_name: 'Employee',
                        email: 'unknown@example.com',
                        avatar_url: null
                    };
                    return {
                        id: assignment.employee_id,
                        name: `${employee.first_name} ${employee.last_name}`,
                        ...employee
                    };
                }) || [];

                const primaryAssigned = assignedEmployees.length > 0 ? assignedEmployees[0] : null;

                return {
                    ...task,
                    isOverdue,
                    assignedEmployees,
                    assigned_to: primaryAssigned?.id || null,
                    assigned_to_details: primaryAssigned || {
                        first_name: 'Unassigned',
                        last_name: '',
                        email: 'N/A',
                        avatar_url: null
                    }
                };
            }).sort((a, b) => {
                const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                const aPriority = priorityOrder[a.priority] || 3;
                const bPriority = priorityOrder[b.priority] || 3;

                if (aPriority !== bPriority) return aPriority - bPriority;

                const aDate = a.end_date ? new Date(a.end_date) : null;
                const bDate = b.end_date ? new Date(b.end_date) : null;

                if (aDate && bDate) return aDate - bDate;
                return 0;
            });

            setAllTasks(processedTasks);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setError(err.message || "Failed to load tasks.");
            setAllTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [router, refreshKey]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleViewTask = async (task) => {
        try {
            const creator = await apiService.getEmployeeById(task.created_by, router);
            setSelectedTask({
                ...task,
                created_by_details: creator
            });
        } catch (err) {
            console.error("Failed to fetch creator details:", err);
            setSelectedTask({
                ...task,
                created_by_details: {
                    first_name: 'Unknown',
                    last_name: 'Creator',
                    email: 'unknown@example.com',
                    avatar_url: null
                }
            });
        }
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedTask(null);
    };

    const handleAddTask = async () => {
        setIsAddTaskModalOpen(false);
        setRefreshKey(prev => prev + 1);
        toast.success("Task created successfully!");
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await apiService.deleteTask(taskId, router);
            setRefreshKey(prev => prev + 1);
            toast.success("Task deleted successfully!");
        } catch (err) {
            console.error("Failed to delete task:", err);
            toast.error("Failed to delete task. Try again");
        }
    };

    const renderSearchBar = (placeholder = 'Search...', value, onChange) => {
        return (
            <div className="relative rounded-md shadow-sm w-full max-w-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#b88b1b] sm:text-sm sm:leading-6"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            </div>
        );
    };

    const filteredTasks = allTasks.filter(task => {
        if (task.status === "Cancelled") return false;

        const searchLower = (searchTerm || "").toLowerCase();
        return (
            (task.title || "").toLowerCase().includes(searchLower) ||
            (task.description || "").toLowerCase().includes(searchLower) ||
            (task.assignedEmployees || []).some(e =>
                (e?.name || "").toLowerCase().includes(searchLower)
            )
        );
    });

    return (
        <div className="">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Task management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization's teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="flex flex-wrap gap-5 items-center justify-between mb-14">
                <TaskCard
                    title="All tasks"
                    count={loading ? 0 : allTasks.filter(t => t.status !== "Cancelled").length}
                    loading={loading}
                />
                <TaskCard
                    title="Pending"
                    count={loading ? 0 : allTasks.filter(t => t.status === 'Pending').length}
                    loading={loading}
                />
                <TaskCard
                    title="In progress"
                    count={loading ? 0 : allTasks.filter(t => t.status === 'In Progress').length}
                    loading={loading}
                />
                <TaskCard
                    title="Completed"
                    count={loading ? 0 : allTasks.filter(t => t.status === 'Completed').length}
                    loading={loading}
                />
                <TaskCard
                    title="Overdue"
                    count={loading ? 0 : allTasks.filter(t => t.isOverdue).length}
                    loading={loading}
                />
            </div>

            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Task list</h1>
                <div className="flex items-center space-x-4">
                    {renderSearchBar('Search tasks...', searchTerm, handleSearchChange)}
                    <button
                        onClick={() => setIsAddTaskModalOpen(true)}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                    >
                        Add new task
                    </button>
                </div>
            </div>

            <TaskTable
                tasks={filteredTasks}
                searchTerm={searchTerm}
                onViewTask={handleViewTask}
                onDeleteTask={handleDeleteTask}
                loading={loading}
                error={error}
            />

            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onAddTask={handleAddTask}
            />

            {selectedTask && (
                <ViewTaskModal
                    isOpen={isViewModalOpen}
                    onClose={handleCloseViewModal}
                    task={selectedTask}
                    onDeleteTask={handleDeleteTask}
                />
            )}
        </div>
    );
}
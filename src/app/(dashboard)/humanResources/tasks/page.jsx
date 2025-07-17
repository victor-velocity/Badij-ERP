// pages/TaskPage.js (or wherever your main TaskPage component is)
"use client";

import React, { useState, useEffect } from "react";
import TaskCard from "@/components/hr/tasks/TaskCard";
import TaskTable from "@/components/hr/tasks/TasksTable";
import AddTaskModal from "@/components/hr/tasks/AddTaskModal";
import ViewTaskModal from "@/components/hr/tasks/ViewTaskModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function TaskPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [allTasks, setAllTasks] = useState([
        {
            id: '1',
            assignedTo: { name: 'John Doe', email: 'john@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 5, 2025',
            taskTitle: 'Staff training',
            department: 'HR',
            status: 'Completed',
        },
        {
            id: '2',
            assignedTo: { name: 'Fuad Abdulrauf', email: 'fuad@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 1, 2025',
            taskTitle: 'Designing of landing page',
            department: 'IT',
            status: 'Completed',
        },
        {
            id: '3',
            assignedTo: { name: 'Victor Oluwatobi', email: 'victor@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 30, 2025',
            taskTitle: 'Development of landing page',
            department: 'IT',
            status: 'In-progress',
        },
        {
            id: '4',
            assignedTo: { name: 'Mary Smith', email: 'mary@madisonjay.com' },
            startDate: 'Jul 1, 2025',
            dueDate: 'Jul 10, 2025',
            taskTitle: 'Team meting setup',
            department: 'Sales',
            status: 'Overdue',
        },
        {
            id: '5',
            assignedTo: { name: 'Isreal Inene', email: 'isreal@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 30, 2025',
            taskTitle: 'Development of landing page',
            department: 'IT',
            status: 'In-progress',
        },
        {
            id: '6',
            assignedTo: { name: 'Esther John', email: 'esther@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 5, 2025',
            taskTitle: 'Staff training',
            department: 'HR',
            status: 'Completed',
        },
        {
            id: '7',
            assignedTo: { name: 'Victor Bakare', email: 'victor@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 5, 2025',
            taskTitle: 'Staff training',
            department: 'HR',
            status: 'Overdue',
        },
        {
            id: '8',
            assignedTo: { name: 'Gabriel Timothy', email: 'gabriel@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 5, 2025',
            taskTitle: 'Staff training',
            department: 'HR',
            status: 'Completed',
        },
        {
            id: '9',
            assignedTo: { name: 'Gabriel Timothy', email: 'gabriel@madisonjay.com' },
            startDate: 'Jul 5, 2025',
            dueDate: 'Aug 5, 2025',
            taskTitle: 'Staff training',
            department: 'HR',
            status: 'Completed',
        },
        {
            id: '10',
            assignedTo: { name: 'Sophia Lee', email: 'sophia@madisonjay.com' },
            startDate: 'Jul 10, 2025',
            dueDate: 'Aug 20, 2025',
            taskTitle: 'Marketing Campaign Setup',
            department: 'Marketing',
            status: 'In-progress',
        },
        {
            id: '11',
            assignedTo: { name: 'Daniel Kim', email: 'daniel@madisonjay.com' },
            startDate: 'Jul 1, 2025',
            dueDate: 'Jul 15, 2025',
            taskTitle: 'Bug Fixing Sprint',
            department: 'IT',
            status: 'Completed',
        },
        {
            id: '12',
            assignedTo: { name: 'Olivia Chen', email: 'olivia@madisonjay.com' },
            startDate: 'Jun 25, 2025',
            dueDate: 'Jul 5, 2025',
            taskTitle: 'Client Onboarding',
            department: 'Sales',
            status: 'Overdue',
        },
        {
            id: '13',
            assignedTo: { name: 'Michael Brown', email: 'michael@madisonjay.com' },
            startDate: 'Aug 1, 2025',
            dueDate: 'Sep 1, 2025',
            taskTitle: 'New Feature Research',
            department: 'R&D',
            status: 'In-progress',
        },
        {
            id: '14',
            assignedTo: { name: 'Emily White', email: 'emily@madisonjay.com' },
            startDate: 'Jul 8, 2025',
            dueDate: 'Jul 25, 2025',
            taskTitle: 'Content Creation',
            department: 'Marketing',
            status: 'Completed',
        },
        {
            id: '15',
            assignedTo: { name: 'Chris Green', email: 'chris@madisonjay.com' },
            startDate: 'Jul 12, 2025',
            dueDate: 'Aug 12, 2025',
            taskTitle: 'System Maintenance',
            department: 'IT',
            status: 'Completed',
        },
    ]);


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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAddTask = (newTask) => {
        setAllTasks((prevTasks) => [newTask, ...prevTasks]);
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsViewTaskModalOpen(true);
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

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Task management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="flex flex-wrap gap-5 items-center justify-between mb-14">
                <TaskCard title="All task" no={allTasks.length} /> {/* Update counts dynamically */}
                <TaskCard title="Pending" no={allTasks.filter(t => t.status === 'Pending').length} />
                <TaskCard title="In progress" no={allTasks.filter(t => t.status === 'In-progress').length} />
                <TaskCard title="Completed" no={allTasks.filter(t => t.status === 'Completed').length} />
                <TaskCard title="Overdue" no={allTasks.filter(t => t.status === 'Overdue').length} />
            </div>

            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Task list</h1>
                <div className="flex items-center space-x-4">
                    {renderSearchBar('Search...', searchTerm, handleSearchChange)}
                    <button
                        onClick={() => setIsAddTaskModalOpen(true)}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                    >
                        Add new task
                    </button>
                </div>
            </div>

            <TaskTable tasks={allTasks} searchTerm={searchTerm} onViewTask={handleViewTask} />

            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onAddTask={handleAddTask}
            />

            <ViewTaskModal
                isOpen={isViewTaskModalOpen}
                onClose={() => setIsViewTaskModalOpen(false)}
                task={selectedTask}
            />
        </div>
    );
}
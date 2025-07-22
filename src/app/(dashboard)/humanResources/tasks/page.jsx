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
                second: '2-digit',
                hour12: true
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const tasks = await apiService.getTasks(router);
            setAllTasks(tasks);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
            setError(err.message || "Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [router]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedTask(null);
    };

    const handleAddTask = async (newTaskData) => {
        try {
            const createdTask = await apiService.addTask(newTaskData, router);
            setAllTasks(prevTasks => [...prevTasks, createdTask]);
            toast.success("Task added successfully!");
        } catch (error) {
            console.error("Failed to add task:", error);
            toast.error("Failed to add task. Try again");
        }
    };

    const handleUpdateTask = async (updatedTask) => {
        try {
            const response = await apiService.updateTask(updatedTask.id, updatedTask, router);
            setAllTasks(prevTasks => prevTasks.map(task =>
                task.id === updatedTask.id ? response : task
            ));
            toast.success("Task updated successfully!");
        } catch (err) {
            console.error("Failed to update task:", err);
            toast.error("Failed to update task. Try again");
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await apiService.deleteTask(taskId, router);
            setAllTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
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
                <TaskCard title="All task" no={allTasks.length} />
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

            <TaskTable
                tasks={allTasks}
                searchTerm={searchTerm}
                onViewTask={handleViewTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                loading={loading}
                error={error}
            />

            <AddTaskModal
                isOpen={isAddTaskModalOpen}
                onClose={() => setIsAddTaskModalOpen(false)}
                onTaskAdded={handleAddTask}
            />

            <ViewTaskModal
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                task={selectedTask}
            />
        </div>
    );
}
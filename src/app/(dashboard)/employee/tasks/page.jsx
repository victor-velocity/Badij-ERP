"use client";

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/employee/TaskCard";
import TasksTable from "@/components/employee/task/TaskTable";
import { faTasks, faCheckCircle, faSpinner, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

// Skeleton Loading Components
const SkeletonTaskCard = () => (
  <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
  </div>
);

const SkeletonSearchBar = () => (
  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg animate-pulse">
    <div className="h-6 bg-gray-200 rounded"></div>
  </div>
);

export default function TaskPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [allTasks, setAllTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [_isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const first_name = typeof window !== 'undefined' ? localStorage.getItem('first_name') : '';

    const [taskData, setTaskData] = useState({
        assigned: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
    });

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

    useEffect(() => {
        const fetchAndProcessTasks = async () => {
            try {
                setLoading(true);
                const tasks = (await apiService.getTasks(router)) || []; 
                setAllTasks(tasks);
                setError(null);
            } catch (error) {
                console.error("Error fetching tasks:", error);
                setError("Failed to fetch tasks.");
                setAllTasks([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchAndProcessTasks();
    }, [router]);

    useEffect(() => {
        let assignedCount = 0;
        let completedCount = 0;
        let inProgressCount = 0;
        let pendingCount = 0;

        assignedCount = allTasks.length;

        allTasks.forEach(task => {
            switch (task.status) {
                case "Completed":
                    completedCount++;
                    break;
                case "In-progress":
                    inProgressCount++;
                    break;
                case "Pending":
                    pendingCount++;
                    break;
                default:
                    break;
            }
        });

        setTaskData({
            assigned: assignedCount,
            completed: completedCount,
            inProgress: inProgressCount,
            pending: pendingCount,
        });

    }, [allTasks]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleViewTask = (taskId) => {
        console.log(`Viewing task with ID: ${taskId}`);
    };

    const handleUpdateTask = (taskId) => {
        console.log(`Updating task with ID: ${taskId}`);
    };

    const renderSearchBar = (placeholder, value, onChange) => {
        return (
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-transparent"
                disabled={loading}
            />
        );
    };

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>My Tasks</h1>
                    {loading ? (
                        <div className="animate-pulse mt-2">
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                        </div>
                    ) : (
                        <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                    )}
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonTaskCard key={index} />
                    ))
                ) : (
                    <>
                        <TaskCard title="Task Assigned" value={taskData.assigned} icon={faTasks} iconColor="text-blue-500" />
                        <TaskCard title="Task Completed" value={taskData.completed} icon={faCheckCircle} iconColor="text-green-500" />
                        <TaskCard title="Task In-progress" value={taskData.inProgress} icon={faSpinner} iconColor="text-orange-500" />
                        <TaskCard title="Task Pending" value={taskData.pending} icon={faHourglassHalf} iconColor="text-purple-500" />
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mt-10 mb-4">
                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                ) : (
                    <h1 className="text-2xl font-semibold text-gray-900">Task list</h1>
                )}
                <div className="flex items-center space-x-4 w-full md:w-auto">
                    {loading ? (
                        <SkeletonSearchBar />
                    ) : (
                        renderSearchBar('Search...', searchTerm, handleSearchChange)
                    )}
                </div>
            </div>

            <TasksTable
                tasks={allTasks}
                searchTerm={searchTerm}
                onViewTask={handleViewTask}
                onUpdateTask={handleUpdateTask}
                loading={loading}
                error={error}
            />
        </div>
    );
}
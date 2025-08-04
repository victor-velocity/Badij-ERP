"use client"

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import TaskCard from "@/components/employee/TaskCard";
import { faTasks, faCheckCircle, faSpinner, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';

export default function TaskPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [allTasks, setAllTasks] = useState([]);

    const first_name = localStorage.getItem('first_name');

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
                const tasks = await apiService.getTasks(router);
                setAllTasks(tasks);
            } catch (error) {
                console.error("Error fetching tasks:", error);
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

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>My Tasks</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <TaskCard title="Task Assigned" value={taskData.assigned} icon={faTasks} iconColor="text-blue-500" />
                <TaskCard title="Task Completed" value={taskData.completed} icon={faCheckCircle} iconColor="text-green-500" />
                <TaskCard title="Task In-progress" value={taskData.inProgress} icon={faSpinner} iconColor="text-orange-500" />
                <TaskCard title="Task Pending" value={taskData.pending} icon={faHourglassHalf} iconColor="text-purple-500" />
            </div>
        </div>
    );
}
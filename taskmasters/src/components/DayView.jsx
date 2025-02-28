import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import config from '../config';

export default function DayView() {
  const navigate = useNavigate();
  // Add dummy tasks for testing
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Morning Meeting",
      category: "Work",
      startTime: new Date().setHours(9, 0, 0),
      endTime: new Date().setHours(10, 0, 0),
    },
    {
      id: 2,
      title: "Gym Session",
      category: "Fitness",
      startTime: new Date().setHours(14, 0, 0),
      endTime: new Date().setHours(15, 0, 0),
    },
    {
      id: 3,
      title: "Project Planning",
      category: "Work",
      startTime: new Date().setHours(11, 0, 0),
      endTime: new Date().setHours(12, 0, 0),
    },
  ]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Comment out or remove the useEffect that fetches tasks for now
  /*
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/tasks?date=${selectedDate.toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, [selectedDate]);
  */

  // Generate time slots for the day
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 12 ? `${i || 12}:00 AM` : `${i - 12 || 12}:00 PM`;
    return hour;
  });

  const formatDate = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[selectedDate.getMonth()]} ${selectedDate.getDate()} ${selectedDate.getFullYear()}`;
  };

  const handleAddTask = () => {
    navigate('/create-task');
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Helper function to get tasks for a specific time slot
  const getTasksForTimeSlot = (timeSlot) => {
    return tasks.filter(task => {
      const taskTime = new Date(task.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return taskTime === timeSlot;
    });
  };

  // Function to determine task background color based on category
  const getTaskColor = (category) => {
    const colors = {
      'Work': 'bg-[#f48b8b]',
      'To-Do': 'bg-[#e9d593]',
      'Fitness': 'bg-[#ccec9b]',
      // Add more category colors as needed
      'default': 'bg-gray-200'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className="w-48 bg-[#d3d3d3] p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8">TaskMasters</h1>
        <nav className="flex flex-col space-y-4">
          <a href="/dashboard" className="hover:text-[#9706e9]">Dashboard</a>
          <a href="/calendar" className="hover:text-[#9706e9]">Calendar</a>
          <a href="/avatar" className="hover:text-[#9706e9]">Avatar Customization</a>
          <a href="/achievements" className="hover:text-[#9706e9]">Achievements</a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">{formatDate()}</h1>
          <button 
            onClick={handleAddTask}
            className="bg-[#9706e9] text-white px-6 py-3 rounded hover:bg-[#8005cc]"
          >
            Add Task
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex mb-8">
          <button className="bg-[#9706e9] text-white px-4 py-2 rounded-l font-semibold">Day</button>
          <button className="bg-[#9706e9]/70 text-white px-4 py-2 border-l border-r border-purple-800 hover:bg-[#9706e9]">Week</button>
          <button className="bg-[#9706e9]/70 text-white px-4 py-2 rounded-r hover:bg-[#9706e9]">Month</button>
        </div>

        {/* Schedule Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Today's Schedule</h2>
          <div className="flex items-center space-x-4">
            <button onClick={handlePreviousDay} className="p-1 hover:text-[#9706e9]">
              <ChevronLeft size={24} />
            </button>
            <button onClick={handleNextDay} className="p-1 hover:text-[#9706e9]">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Category Header */}
        <div className="flex justify-end mb-2">
          <div className="w-24 text-right">
            <span className="font-medium">Category</span>
          </div>
        </div>

        {/* Schedule Items */}
        <div className="space-y-6">
          {timeSlots.map((timeSlot, index) => {
            const tasksForSlot = getTasksForTimeSlot(timeSlot);
            return (
              <div key={index} className="flex items-start">
                <div className="w-20 text-right pr-4 pt-2 text-sm">
                  <span>{timeSlot}</span>
                  <div className="border-t border-gray-300 mt-2"></div>
                </div>
                <div className="flex-1">
                  {tasksForSlot.map((task, taskIndex) => (
                    <div 
                      key={taskIndex}
                      className={`${getTaskColor(task.category)} rounded p-4 flex justify-between mb-2`}
                    >
                      <div>{task.title}</div>
                      <div className="w-24 text-right">{task.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
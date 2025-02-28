import React, { useState, useEffect } from 'react';
import CreateTaskForm from './CreateTaskModal';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, User, Trophy, LogOut, PlusCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import config from '../config';

export default function DayView() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`${config.apiUrl}/tasks.php?date=${dateStr}&userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        const formattedTasks = data.map(task => {
          const [hours, minutes] = task.formatted_time.split(':');
          const minutesSinceMidnight = parseInt(hours) * 60 + parseInt(minutes);
          
          return {
            id: task.task_id,
            title: task.task_Title,
            category: task.task_tags,
            priority: task.task_priority,
            duration: parseInt(task.task_duration),
            startMinute: minutesSinceMidnight,
            endMinute: minutesSinceMidnight + parseInt(task.task_duration)
          };
        });
        setTasks(formattedTasks);
      } else {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDate]);

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
    setIsModalOpen(true);
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

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getTaskColor = (priority) => {
    const colors = {
      'high': 'bg-red-300',
      'medium': 'bg-yellow-200',
      'low': 'bg-green-300',
      'default': 'bg-gray-200'
    };
    return colors[priority] || colors.default;
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours * 60 + minutes) / 1440 * 100; 
  };


  const shouldShowCurrentTime = () => {
    const today = new Date();
    return selectedDate.getDate() === today.getDate() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getFullYear() === today.getFullYear();
  };

  return (
    <React.Fragment>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className="min-h-screen bg-white shadow-lg flex flex-col w-64 transition-all duration-300">
          {/* Logo Section */}
          <div className="p-6 bg-[#9706e9] text-white">
            <h1 className="text-2xl font-bold tracking-wider">TaskMasters</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <a 
                href="#/dashboard" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              >
                <LayoutDashboard size={20} />
                <span className="text-lg">Dashboard</span>
              </a>
              <a 
                href="#/calendar" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              >
                <Calendar size={20} />
                <span className="text-lg">Calendar</span>
              </a>
              <a 
                href="#/avatar" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              >
                <User size={20} />
                <span className="text-lg">Avatar</span>
              </a>
              <a 
                href="#/achievements" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              >
                <Trophy size={20} />
                <span className="text-lg">Achievements</span>
              </a>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <a 
              href="#/login" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all duration-200"
            >
              <LogOut size={20} />
              <span className="text-lg">Logout</span>
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          {/* Header with Date Navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">{formatDate()}</h1>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePreviousDay} 
                  className="p-2 hover:text-[#9706e9] transition-colors duration-200 rounded-full hover:bg-purple-50"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={handleNextDay} 
                  className="p-2 hover:text-[#9706e9] transition-colors duration-200 rounded-full hover:bg-purple-50"
                >
                  <ChevronRight size={24} />
                </button>
                <button 
                  onClick={handleToday}
                  className="px-4 py-2 text-sm bg-[#9706e9] text-white rounded-lg hover:bg-[#8005cc] transition-all duration-200 shadow-sm ml-2"
                >
                  Today
                </button>
              </div>
            </div>
            <button 
              onClick={handleAddTask}
              className="bg-[#9706e9] text-white px-6 py-3 rounded-lg hover:bg-[#8005cc] flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <PlusCircle size={20} />
              <span>Add Task</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex mb-8">
            <button className="bg-[#9706e9] text-white px-4 py-2 rounded-l font-semibold">Day</button>
            <button className="bg-[#9706e9]/70 text-white px-4 py-2 border-l border-r border-purple-800 hover:bg-[#9706e9]">Week</button>
            <button className="bg-[#9706e9]/70 text-white px-4 py-2 rounded-r hover:bg-[#9706e9]">Month</button>
          </div>

          {/* Schedule Grid */}
          <div className="relative">
            {/* Time slots */}
            <div className="absolute left-0 top-0 w-20 h-full">
              {timeSlots.map((time, index) => (
                <div key={index} className="h-24 flex items-start justify-end pr-4">
                  <span className="text-sm text-gray-500">{time}</span>
                </div>
              ))}
            </div>

            {/* Grid lines */}
            <div className="ml-20 relative border-l border-gray-200">
              {timeSlots.map((_, index) => (
                <div key={index} className="h-24 border-b border-gray-200" />
              ))}

              {/* Current time indicator */}
              {shouldShowCurrentTime() && (
                <div 
                  className="absolute left-0 w-full border-t-2 border-red-500 z-10"
                  style={{ 
                    top: `${getCurrentTimePosition()}%`,
                    transform: 'translateY(-50%)'
                  }}
                >
                  <div className="absolute -left-2 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}

              {/* Tasks */}
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`${getTaskColor(task.priority)} absolute left-0 right-4 rounded-lg p-4 flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer`}
                  style={{
                    top: `${(task.startMinute / 1440) * 100}%`,
                    height: `${(task.duration / 1440) * 100}%`,
                    minHeight: '2rem'
                  }}
                >
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="text-right text-gray-600 text-sm bg-white/30 px-2 py-1 rounded-full truncate mt-1">{task.category}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <CreateTaskForm 
          onClose={() => {
            setIsModalOpen(false);
            fetchTasks();
          }} 
        />
      )}
    </React.Fragment>
  );
}

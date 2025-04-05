import React, { useState, useEffect } from 'react';
import CreateTaskForm from './CreateTaskModal';
import TaskDetailView from './TaskDetailsModal';
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, User, Trophy, LogOut, PlusCircle, Menu, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import config from '../config';

export default function DayView() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);

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

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await fetch(`${config.apiUrl}/tasks.php?date=${dateStr}&userId=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        const formattedTasks = data.map(task => {
          // Parse time, handling both 12-hour and 24-hour formats
          const formattedTime = task.formatted_time || "00:00:00";
          
          // Check if time is in 12-hour format (contains AM/PM)
          let hours, minutes, minutesSinceMidnight;
          
          if (formattedTime.includes('AM') || formattedTime.includes('PM')) {
            // Parse 12-hour format (e.g., "1:00 PM")
            const [time, period] = formattedTime.split(' ');
            [hours, minutes] = time.split(':').map(Number);
            
            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
          } else {
            // Parse 24-hour format (e.g., "13:00")
            [hours, minutes] = formattedTime.split(':').map(Number);
          }
          
          minutesSinceMidnight = hours * 60 + minutes;
          
          return {
            id: task.task_id,
            title: task.task_Title,
            category: task.task_tags,
            priority: task.task_priority,
            duration: parseInt(task.task_duration),
            startMinute: minutesSinceMidnight,
            endMinute: minutesSinceMidnight + parseInt(task.task_duration),
            dateStr: task.task_startDate || dateStr
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
      <div className="flex flex-col md:flex-row h-screen w-full">
        {/* Sidebar */}
        <div className={`bg-white shadow-lg flex flex-col ${isNavbarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'} transition-all duration-300 min-h-[80px] md:min-h-screen`}>
          {/* Logo Section */}
          <div className="p-4 md:p-6 bg-[#9706e9] text-white flex justify-between items-center">
            {!isNavbarCollapsed && <h1 className="text-xl md:text-2xl font-bold tracking-wider">TaskMasters</h1>}
            <button 
              onClick={() => setIsNavbarCollapsed(!isNavbarCollapsed)} 
              className="text-white hover:bg-purple-800 p-1 rounded-md transition-all duration-200"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`${isNavbarCollapsed ? 'hidden md:flex md:flex-col md:items-center' : 'block'} flex-1 p-4`}>
            <div className="flex flex-col md:space-y-2">
              <a 
                href="#/dashboard" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
                title="Dashboard"
              >
                <LayoutDashboard size={20} />
                {!isNavbarCollapsed && <span className="text-lg">Dashboard</span>}
              </a>
              <a 
                href="#/calendar" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
                title="Calendar"
              >
                <Calendar size={20} />
                {!isNavbarCollapsed && <span className="text-lg">Calendar</span>}
              </a>
              <a 
                href="#/avatar-customization" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
                title="Avatar Customization"
              >
                <User size={20} />
                {!isNavbarCollapsed && <span className="text-lg">Avatar Customization</span>}
              </a>
              <a 
                href="#/achievements" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
                title="Achievements"
              >
                <Trophy size={20} />
                {!isNavbarCollapsed && <span className="text-lg">Achievements</span>}
              </a>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <a 
              href="#/login" 
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Logout</span>}
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 p-4 md:p-8 overflow-y-auto">
          {/* Header with Date Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 space-y-4 md:space-y-0">
            <div className="flex items-center gap-2 md:gap-4">
              <h1 className="text-2xl md:text-4xl font-bold">{formatDate()}</h1>
              <div className="flex items-center gap-1 md:gap-2">
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
              className="bg-[#9706e9] text-white px-4 py-2 md:px-6 md:py-3 rounded-lg hover:bg-[#8005cc] flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <PlusCircle size={18} />
              <span>Add Task</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex mb-4 md:mb-8">
            <button
              className="bg-[#9706e9] text-white px-4 py-2 rounded-l font-semibold"
            >
              Day
            </button>
            <button
              onClick={() => navigate('/week-view')}
              className="bg-[#9706e9]/70 text-white px-4 py-2 border-l border-r border-purple-800 hover:bg-[#9706e9]"
            >
              Week
            </button>

            <button
              onClick={() => navigate('/month-view')}

            <button 
              onClick={() => navigate('/month-view')} 

              className="bg-[#9706e9]/70 text-white px-4 py-2 rounded-r hover:bg-[#9706e9]"
            >
              Month
            </button>
          </div>

          {/* Schedule Grid */}
          <div className="relative overflow-x-auto">
            {/* Time slots */}
            <div className="absolute left-0 top-0 w-16 md:w-20 h-full">
              {timeSlots.map((time, index) => (
                <div key={index} className="h-20 md:h-24 flex items-start justify-end pr-2 md:pr-4">
                  <span className="text-xs md:text-sm text-gray-500">{time}</span>
                </div>
              ))}
            </div>

            {/* Grid lines */}
            <div className="ml-16 md:ml-20 relative border-l border-gray-200 min-w-[600px] md:min-w-0">
              {timeSlots.map((_, index) => (
                <div key={index} className="h-20 md:h-24 border-b border-gray-200" />
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
                  className={`${getTaskColor(task.priority)} absolute left-0 right-4 rounded-lg p-2 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden`}
                  style={{
                    top: `${(task.startMinute / 1440) * 100}%`,
                    height: `${(task.duration / 1440) * 100}%`,
                    minHeight: '2.5rem'
                  }}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  {/* For short tasks (30 min or less), show a more compact layout */}
                  {task.duration <= 30 ? (
                    <div className="flex justify-between items-center h-full">
                      <div className="font-medium text-sm truncate flex-1">{task.title || "Untitled Task"}</div>
                      {task.category && (
                        <div className="text-right text-gray-600 text-xs bg-white/30 px-1 py-0.5 rounded-full ml-1 whitespace-nowrap">
                          {task.category}
                        </div>
                      )}
                    </div>
                  ) : (
                    // For longer tasks, keep the stacked layout but with better spacing
                    <div className="flex flex-col h-full">
                      <div className="font-medium truncate">{task.title || "Untitled Task"}</div>
                      {task.category && (
                        <div className="text-right text-gray-600 text-sm bg-white/30 px-2 py-1 rounded-full truncate mt-1">
                          {task.category}
                        </div>
                      )}
                    </div>
                  )}
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
      {selectedTaskId && (
        <TaskDetailView 
          taskId={selectedTaskId} 
          selectedDate={(() => {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })()}
          onClose={() => setSelectedTaskId(null)} 
          onTaskUpdated={fetchTasks} 
        />
      )}
    </React.Fragment>
  );
}

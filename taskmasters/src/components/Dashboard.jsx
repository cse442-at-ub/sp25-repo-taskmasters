
"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  LogOut,
  PlusCircle,
  Menu,
  HelpCircle,
  X,
} from "lucide-react";
import CreateTaskForm from "./CreateTaskModal";
import TaskDetailView from "./TaskDetailsModal";
import config from "../config";
import { get, post } from "../utils/api";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [userLevel, setUserLevel] = useState({ level: 1, totalPoints: 0, pointsForNextLevel: 100, progress: 0 });
  const [achievements, setAchievements] = useState({ total: 0, totalPossible: 5, unlocked: [] });
  const [username, setUsername] = useState("User");
  const [isLoading, setIsLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [pointsModalOpen, setPointsModalOpen] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  // State for current date
  const [currentDate, setCurrentDate] = useState(new Date());

  // Import avatar images
  const avatarImages = {
    'Level1Avatar.png': require('../assets/Level1Avatar.png'),
    'Level2Avatar.png': require('../assets/Level2Avatar.png'),
    'Level3Avatar.png': require('../assets/Level3Avatar.png'),
    'Level4Avatar.png': require('../assets/Level4Avatar.png'),
    'Level5Avatar.png': require('../assets/Level5Avatar.png'),
    'Level6Avatar.png': require('../assets/Level6Avatar.png'),
    'Level7Avatar.png': require('../assets/Level7Avatar.png'),
    'Level8Avatar.png': require('../assets/Level8Avatar.png'),
    'Level9Avatar.png': require('../assets/Level9Avatar.png'),
    'Level10Avatar.png': require('../assets/Level10Avatar.png'),
  };

  // Helper function to get avatar image
  const getAvatarImage = (filename) => {
    if (!filename) return null;
    // Extract just the filename if it's a path
    const baseName = filename.split('/').pop();
    return avatarImages[baseName] || null;
  };

  // Fetch user avatar
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.id) {
          const response = await get(`avatar.php?userId=${userData.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('Avatar data from API:', data);
            if (data && data.currentAvatar && data.currentAvatar.image_url) {
              // Get the avatar image using the helper function
              const avatarImg = getAvatarImage(data.currentAvatar.image_url);
              console.log('Setting avatar image:', avatarImg);
              setUserAvatar(avatarImg);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error);
      }
    };

    fetchUserAvatar();
    
    // Add event listener to refresh avatar when window gets focus
    // This ensures the avatar updates when returning from avatar customization page
    const handleFocus = () => {
      console.log('Window focused, refreshing avatar');
      fetchUserAvatar();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Get user data from localStorage
  useEffect(() => {
    try {
      const userDataString = localStorage.getItem('user');
      if (!userDataString) {
        console.warn('No user data found in localStorage');
        return; // Let ProtectedRoute handle the redirect
      }
      
      const userData = JSON.parse(userDataString);
      console.log('User data from localStorage:', userData);
      
      if (userData && userData.id) {
        console.log('User ID found:', userData.id);
        setUsername(userData.username || "User");
        
        // Add a small delay before fetching data to prevent rapid API calls during page transitions
        const timer = setTimeout(() => {
          fetchDashboardData(userData.id);
        }, 100);
        
        return () => clearTimeout(timer);
      } else {
        console.warn('User ID not found in user data');
        // Don't redirect here, let ProtectedRoute handle it
      }
    } catch (error) {
      console.error('Error processing user data:', error);
      // Don't redirect or clear data here, let ProtectedRoute handle it
    }
  }, []);

  // Function to fetch tasks for the dashboard with retry logic
  const fetchDashboardData = async (userId, retryCount = 0) => {
    setIsLoading(true);
    try {
      // Get today's date, ensuring we're using the local date
      const now = new Date();
      const today = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
      
      console.log(`Current date and time: ${now}`);
      console.log(`Formatted today's date: ${today}`);
      console.log(`Fetching tasks for userId: ${userId}, date: ${today}`);
      
      // First fetch dashboard data for user level and achievements
      console.log(`Fetching dashboard data for userId: ${userId}, date: ${today}`);
      
      // Add retry logic for API calls
      let dashboardResponse;
      try {
        dashboardResponse = await get('dashboard.php', { userId, date: today });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Retry up to 3 times with increasing delay
        if (retryCount < 3) {
          console.log(`Retrying dashboard data fetch (attempt ${retryCount + 1})`);
          setTimeout(() => {
            fetchDashboardData(userId, retryCount + 1);
          }, 500 * (retryCount + 1));
          return;
        } else {
          throw error;
        }
      }
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('Dashboard data:', dashboardData);
        
        // Update user level and achievements
        if (dashboardData.level) {
          setUserLevel(dashboardData.level);
          console.log('Updated user level:', dashboardData.level);
        }
        
        if (dashboardData.achievements) {
          setAchievements(dashboardData.achievements);
          console.log('Updated achievements:', dashboardData.achievements);
        }
        
        // Process tasks from dashboard data
        const dashboardTasks = dashboardData.tasks || [];
        console.log('Tasks from dashboard.php:', dashboardTasks);
        
        // Also fetch tasks directly from tasks.php as a backup to ensure we get all tasks
        console.log(`Also fetching tasks from tasks.php for date: ${today} and userId: ${userId}`);
        const tasksResponse = await get('tasks.php', { date: today, userId });
        
        let tasksData = [];
        if (tasksResponse.ok) {
          const tasksFromApi = await tasksResponse.json();
          console.log('Tasks from tasks.php:', tasksFromApi);
          
          // Combine tasks from both sources, prioritizing dashboard tasks
          if (Array.isArray(tasksFromApi) && tasksFromApi.length > 0) {
            // Use tasks from tasks.php if dashboard tasks are empty
            tasksData = dashboardTasks.length > 0 ? dashboardTasks : tasksFromApi;
          } else {
            tasksData = dashboardTasks;
          }
        } else {
          // If tasks.php fails, use dashboard tasks
          tasksData = dashboardTasks;
        }
        
        console.log('Combined tasks data:', tasksData);
        
        // Process tasks if we got them
        if (Array.isArray(tasksData) && tasksData.length > 0) {
          console.log(`Found ${tasksData.length} tasks for today`);
          
          const allTasks = [];
          const completedTasks = [];
          const scheduleList = [];
          
          // Process all tasks without date filtering
          tasksData.forEach(task => {
            console.log(`Processing task: ${task.task_Title}, ID: ${task.task_id}, Date: ${task.task_startDate}`);
            
            try {
              // Convert 24-hour time to 12-hour format
              let formattedTime = '00:00';
              if (task.formatted_time) {
                const [hours, minutes] = task.formatted_time.split(':');
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12; // Convert 0 to 12
                formattedTime = `${hour12}:${minutes} ${ampm}`;
              } else if (task.Task_time) {
                formattedTime = new Date(task.Task_time).toLocaleTimeString([], { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                });
              }
              
              // Format task for our component
              const formattedTask = {
                id: task.task_id,
                title: task.task_Title,
                description: task.task_description,
                category: task.task_tags || "Uncategorized",
                priority: task.task_priority,
                completed: task.completed === 1, // Set completed based on data from backend
                time: formattedTime,
                date: task.task_startDate
              };
              
              console.log('Formatted task:', formattedTask);
              
              // Separate completed and incomplete tasks
              if (formattedTask.completed) {
                completedTasks.push(formattedTask);
              } else {
                allTasks.push(formattedTask);
              }
              
              // Add to schedule items
              scheduleList.push({
                time: formattedTask.time,
                activity: formattedTask.title,
                date: formattedTask.date
              });
            } catch (error) {
              console.error('Error processing task:', error, task);
            }
          });
          
          console.log(`Total tasks processed: ${allTasks.length}`);
          
          // Sort tasks by time (earliest first)
          allTasks.sort((a, b) => {
            // Convert time strings to minutes for comparison
            const getMinutes = (timeStr) => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            };
            
            const aMinutes = getMinutes(a.time);
            const bMinutes = getMinutes(b.time);
            
            return aMinutes - bMinutes;
          });
          
          // Sort schedule items by time (earliest first)
          scheduleList.sort((a, b) => {
            // Convert time strings to minutes for comparison
            const getMinutes = (timeStr) => {
              const [hours, minutes] = timeStr.split(':').map(Number);
              return hours * 60 + minutes;
            };
            
            const aMinutes = getMinutes(a.time);
            const bMinutes = getMinutes(b.time);
            
            return aMinutes - bMinutes;
          });
          
          setTasks(allTasks);
          setCompletedTasks(completedTasks);
          setScheduleItems(scheduleList);
        } else {
          console.log('No tasks found for today');
          setTasks([]);
          setScheduleItems([]);
        }
      } else {
        const errorText = await dashboardResponse.text();
        console.error('Dashboard API error:', errorText);
        throw new Error(`Failed to fetch dashboard data: ${errorText}`);
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle task completion
  const handleTaskCompletion = async (taskId, completed) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        throw new Error('User not authenticated');
      }
      
      console.log(`Marking task ${taskId} as ${completed ? 'completed' : 'not completed'}`);
      
      // Find the task that is being completed
      const taskToComplete = tasks.find(task => task.id === taskId);
      if (!taskToComplete) {
        throw new Error('Task not found');
      }
      
      // Use the secure API utility for POST requests
      const response = await post('dashboard.php', {
        action: 'completeTask',
        taskId: taskId,
        userId: userData.id,
        completed: completed
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Task completion error:', errorText);
        throw new Error(`Failed to update task completion status: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Task completion result:', result);
      
      if (result.success) {
        if (completed) {
          // Create a copy of the task with completed status
          const completedTaskCopy = { ...taskToComplete, completed: true };
          
          // Add to completed tasks
          setCompletedTasks(prevCompletedTasks => [...prevCompletedTasks, completedTaskCopy]);
          
          // Remove from active tasks
          setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
          
          console.log(`Task ${taskId} moved to completed tasks`);
          
          // Show points modal if points were awarded
          if (result.points && result.points > 0) {
            setEarnedPoints(result.points);
            setPointsModalOpen(true);
          }
        } else {
          // If the task couldn't be uncompleted, show the message
          alert(result.message);
        }
        
        // Update user level and achievements if provided in the response
        if (result.level) {
          setUserLevel(result.level);
        }
        
        if (result.achievements) {
          setAchievements(result.achievements);
        }
      } else {
        // If the operation wasn't successful, show the error message
        alert(result.message || 'Failed to update task completion status');
      }
      
    } catch (error) {
      console.error('Error updating task completion:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Function to add a new task
  const addTask = (task) => {
    setTasks([...tasks, task]);

    // If the task has a time, add it to schedule items
    if (task.time) {
      setScheduleItems([
        ...scheduleItems,
        {
          time: task.time,
          activity: task.title,
        },
      ]);
    }
    
    // Refresh dashboard data after adding a task
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && userData.id) {
      fetchDashboardData(userData.id);
    }
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed);
  };

  // Handle opening the task creation modal
  const handleAddTask = () => {
    setIsModalOpen(true);
  };

  // Add handler for task click
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg flex flex-col ${
          isNavbarCollapsed ? "w-full md:w-16" : "w-full md:w-64"
        } transition-all duration-300 min-h-[80px] md:min-h-screen`}
      >
        {/* Logo Section */}
        <div className="p-4 md:p-6 bg-[#9706e9] text-white flex justify-between items-center">
          {!isNavbarCollapsed && (
            <h1 className="text-xl md:text-2xl font-bold tracking-wider">
              TaskMasters
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className="text-white hover:bg-purple-800 p-1 rounded-md transition-all duration-200"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`${
            isNavbarCollapsed
              ? "hidden md:flex md:flex-col md:items-center"
              : "block"
          } flex-1 p-4`}
        >
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
              {!isNavbarCollapsed && (
                <span className="text-lg">Avatar Customization</span>
              )}
            </a>
            <a
              href="#/achievements"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200 relative group"
              title="Achievements"
            >
              <div className="relative">
                <Trophy size={20} className="group-hover:animate-pulse" />
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {achievements.total}
                </span>
              </div>
              {!isNavbarCollapsed && (
                <span className="text-lg">Achievements</span>
              )}
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
      <div className="flex-1 p-6 bg-white overflow-y-auto">
        {/* Header with date display */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Hello, {username}!</h1>
            <h2 className="text-lg text-gray-600 font-medium">
              {(() => {
                const months = [
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December",
                ];
                return `${months[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
              })()}
            </h2>
          </div>
          <div className="mt-3 md:mt-0">
            <button 
              onClick={handleAddTask}
              className="bg-[#9706e9] text-white px-4 py-2 rounded-lg hover:bg-[#8005cc] flex items-center gap-2 transition-all duration-200 shadow-md"
            >
              <PlusCircle size={18} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Level & Achievements Card */}
          <div className="bg-[#e5cef2] rounded p-6 flex flex-col items-center">
            <div className="flex items-center justify-center w-full mb-4">
              <h2 className="text-lg font-medium">Your Level & Achievements</h2>
              <button 
                onClick={() => setIsHelpModalOpen(true)}
                className="ml-2 text-[#9706e9] hover:text-[#8005cc] transition-colors duration-200"
                title="Learn how to earn points"
              >
                <HelpCircle size={22} />
              </button>
            </div>

            <div className="w-full text-center mb-2">Level: {userLevel.level}</div>

            <div className="w-full h-2 bg-[#d3d3d3] rounded-full mb-6">
              <div 
                className="h-full bg-[#9706e9] rounded-full" 
                style={{ width: `${userLevel.progress}%` }}
              ></div>
            </div>

            <a
              href="#/achievements"
              className="mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-[#9706e9] text-white rounded-lg hover:bg-[#8005cc] transition-all duration-200 shadow-md no-underline"
            >
              <Trophy size={18} />
              <span className="no-underline">View Achievements ({achievements.total})</span>
            </a>

            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#9706e9] to-[#e5cef2] shadow-md">
              {/* User avatar from avatar customization */}
              {userAvatar ? (
                <img 
                  src={userAvatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-medium mb-4">Today's Full Schedule</h2>
            {scheduleItems.length > 0 ? (
              <div className="space-y-2 text-sm">
                {scheduleItems.map((item, index) => (
                  <div key={index}>
                    {item.time} - {item.activity}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic">
                No schedule items yet. Add tasks to see them here.
              </div>
            )}
          </div>
        </div>

        {/* Task Checklist */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#9706e9]">Task Checklist</h2>
            <button
              className="bg-[#9706e9] text-white p-3 rounded-full hover:bg-[#8005cc] transition-all duration-200 shadow-md"
              onClick={handleAddTask}
            >
              <PlusCircle size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9706e9]"></div>
            </div>
          ) : tasks.length > 0 ? (
            <>
              {/* Group tasks by category and render each category */}
              {Object.entries(
                tasks.reduce((acc, task) => {
                  const category = task.category;
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(task);
                  return acc;
                }, {})
              ).map(([category, categoryTasks]) => (
                <div key={category} className="mb-8">
                  <h3 className="font-medium text-lg mb-3 text-gray-700 border-b pb-2">{category}</h3>
                  <div className="space-y-3">
                    {categoryTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        <div className="flex items-center p-4">
                          {/* Task details section - clickable to view details */}
                          <div 
                            className="flex-grow cursor-pointer"
                            onClick={() => handleTaskClick(task.id)}
                          >
                            <div className="flex items-center">
                              <span className="text-gray-800 font-medium">{task.title}</span>
                              <span className="text-gray-500 text-sm ml-2">({task.time})</span>
                            </div>
                          </div>
                          
                          {/* Priority badge */}
                          <div className="mx-3">
                            {task.priority === 'high' && (
                              <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">High</span>
                            )}
                            {task.priority === 'medium' && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">Medium</span>
                            )}
                            {task.priority === 'low' && (
                              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">Low</span>
                            )}
                          </div>
                          
                          {/* Complete button */}
                          <button
                            onClick={() => {
                              if (!task.completed) {
                                setTaskToComplete(task);
                                setConfirmationModalOpen(true);
                              } else {
                                alert("Tasks cannot be uncompleted once they are marked as complete.");
                              }
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                              task.completed
                                ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                : 'bg-[#f0e6f8] text-[#9706e9] hover:bg-[#9706e9] hover:text-white cursor-pointer'
                            }`}
                            disabled={task.completed}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500 mb-3">No tasks yet</div>
              <button
                onClick={handleAddTask}
                className="inline-flex items-center px-4 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] transition-all duration-200"
              >
                <PlusCircle size={18} className="mr-2" />
                Add your first task
              </button>
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-green-600">Completed Tasks</h2>
            <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
              {completedTasks.length} completed
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : completedTasks.length > 0 ? (
            <>
              {/* Group completed tasks by category */}
              {Object.entries(
                completedTasks.reduce((acc, task) => {
                  const category = task.category;
                  if (!acc[category]) {
                    acc[category] = [];
                  }
                  acc[category].push(task);
                  return acc;
                }, {})
              ).map(([category, categoryTasks]) => (
                <div key={category} className="mb-8">
                  <h3 className="font-medium text-lg mb-3 text-gray-700 border-b pb-2">{category}</h3>
                  <div className="space-y-3">
                    {categoryTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 border border-gray-100 rounded-lg overflow-hidden opacity-80"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <div className="flex items-center p-4 cursor-pointer">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center">
                              <span className="text-gray-500 font-medium line-through">{task.title}</span>
                              <span className="text-gray-400 text-sm ml-2">({task.time})</span>
                            </div>
                          </div>
                          <div>
                            {task.priority === 'high' && (
                              <span className="bg-red-50 text-red-400 text-xs px-3 py-1 rounded-full">High</span>
                            )}
                            {task.priority === 'medium' && (
                              <span className="bg-yellow-50 text-yellow-400 text-xs px-3 py-1 rounded-full">Medium</span>
                            )}
                            {task.priority === 'low' && (
                              <span className="bg-green-50 text-green-400 text-xs px-3 py-1 rounded-full">Low</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-500">
                No completed tasks yet. Complete a task to see it here.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <CreateTaskForm
          onClose={() => {
            setIsModalOpen(false);
            // Refresh dashboard data to show newly added tasks immediately
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.id) {
              fetchDashboardData(userData.id);
            }
          }}
          onAddTask={addTask}
        />
      )}

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailView
          taskId={selectedTaskId}
          selectedDate={(() => {
            // Find the task with the matching ID
            const task = [...tasks, ...completedTasks].find(t => t.id === selectedTaskId);
            // Use the task's date if available, otherwise use current date
            return task && task.date ? task.date : new Date().toISOString().split("T")[0];
          })()}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => {
            // Refresh dashboard data to show updated tasks
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.id) {
              fetchDashboardData(userData.id);
            }
          }}
        />
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#9706e9]">How to Earn Points</h2>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Task Completion Points</h3>
                <ul className="list-disc pl-5 mt-2">
                  <li><span className="font-medium text-red-600">High Priority</span>: 30 points</li>
                  <li><span className="font-medium text-yellow-600">Medium Priority</span>: 20 points</li>
                  <li><span className="font-medium text-green-600">Low Priority</span>: 10 points</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Leveling Up</h3>
                <p>You gain one level for every 100 points earned:</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Level 1: 0-99 points</li>
                  <li>Level 2: 100-199 points</li>
                  <li>Level 3: 200-299 points</li>
                  <li>And so on...</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Achievements</h3>
                <p>Each achievement awards 50 bonus points!</p>
                <ul className="list-disc pl-5 mt-2">
                  <li><span className="font-medium">Consistent Student</span>: Complete 2 School category tasks in one day</li>
                  <li><span className="font-medium">Dedicated Worker</span>: Complete 2 Work category tasks in one day</li>
                  <li><span className="font-medium">Fitness Guru</span>: Complete a Personal category task</li>
                  <li><span className="font-medium">Daily Task Master</span>: Complete at least 3 tasks in one day</li>
                  <li><span className="font-medium">Productivity Streak</span>: Complete all tasks in one day</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">Tips</h3>
                <ul className="list-disc pl-5 mt-2">
                  <li>Focus on completing high priority tasks for more points</li>
                  <li>Try to complete all tasks in a day to earn the Productivity Streak achievement</li>
                  <li>Balance your tasks across different categories to unlock more achievements</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="mt-6 w-full bg-[#9706e9] text-white py-2 rounded-lg hover:bg-[#8005cc] transition-all duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Points Award Modal */}
      {pointsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="flex justify-end">
              <button 
                onClick={() => setPointsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="py-6">
              <Trophy className="w-16 h-16 text-[#9706e9] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#9706e9] mb-2">Congratulations!</h2>
              <p className="text-lg mb-4">You earned <span className="font-bold text-[#9706e9]">{earnedPoints} points</span>!</p>
              <p className="text-gray-600">Keep up the good work to level up and unlock achievements!</p>
            </div>
            
            <button
              onClick={() => setPointsModalOpen(false)}
              className="w-full bg-[#9706e9] text-white py-2 rounded-lg hover:bg-[#8005cc] transition-all duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Task Completion Confirmation Modal */}
      {confirmationModalOpen && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#9706e9]">Confirm Task Completion</h2>
              <button 
                onClick={() => {
                  setConfirmationModalOpen(false);
                  setTaskToComplete(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="mb-6">
              Have you completed the task "{taskToComplete.title}"?
            </p>
            
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setConfirmationModalOpen(false);
                  setTaskToComplete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Mark task as completed
                    await handleTaskCompletion(taskToComplete.id, true);
                    
                    // Refresh dashboard data to ensure persistence
                    const userData = JSON.parse(localStorage.getItem('user'));
                    if (userData && userData.id) {
                      await fetchDashboardData(userData.id);
                    }
                    
                    // Close modal
                    setConfirmationModalOpen(false);
                    setTaskToComplete(null);
                  } catch (error) {
                    console.error('Error completing task:', error);
                  }
                }}
                className="px-4 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] transition-all duration-200"
              >
                Yes, Complete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

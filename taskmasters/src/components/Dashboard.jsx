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
  const [taskToComplete, setTaskToComplete] = useState(null);

  // Get user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log('User data from localStorage:', userData);
    
    if (userData && userData.id) {
      console.log('User ID found:', userData.id);
      setUsername(userData.username || "User");
      fetchDashboardData(userData.id);
    } else {
      console.warn('No user data or user ID found in localStorage');
      // Redirect to login if no user data
      window.location.href = "#/login";
    }
  }, []);

  // Function to fetch tasks for the dashboard
  const fetchDashboardData = async (userId) => {
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
      
      // Directly fetch tasks from tasks.php
      console.log(`API URL: ${config.apiUrl}/tasks.php?date=${today}&userId=${userId}`);
      const tasksResponse = await fetch(`${config.apiUrl}/tasks.php?date=${today}&userId=${userId}`);
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('Tasks from tasks.php:', tasksData);
        
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
        const errorText = await tasksResponse.text();
        console.error('Tasks API error:', errorText);
        throw new Error(`Failed to fetch tasks: ${errorText}`);
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
      
      const response = await fetch(`${config.apiUrl}/dashboard.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'completeTask',
          taskId: taskId,
          userId: userData.id,
          completed: completed
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Task completion error:', errorText);
        throw new Error(`Failed to update task completion status: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Task completion result:', result);
      
      if (completed) {
        // Create a copy of the task with completed status
        const completedTaskCopy = { ...taskToComplete, completed: true };
        
        // Add to completed tasks
        setCompletedTasks(prevCompletedTasks => [...prevCompletedTasks, completedTaskCopy]);
        
        // Remove from active tasks
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        
        console.log(`Task ${taskId} moved to completed tasks`);
      }
      
      // Update user level and achievements if provided in the response
      if (result.level) {
        setUserLevel(result.level);
      }
      
      if (result.achievements) {
        setAchievements(result.achievements);
      }
      
      // Show points notification if points were awarded
      if (completed && result.points) {
        // You could add a toast notification here
        console.log(`Earned ${result.points} points!`);
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
              href="#/avatar"
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
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              title="Achievements"
            >
              <Trophy size={20} />
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
        <h1 className="text-2xl font-bold mb-6">Hello, {username}!</h1>

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
              className="mb-4 text-[#9706e9] hover:text-[#8005cc] cursor-pointer transition-colors duration-200"
            >
              Total Achievements: {achievements.total}
            </a>

            <div className="w-20 h-20 rounded-full overflow-hidden">
              <img
                src="https://via.placeholder.com/80"
                alt="User avatar"
                className="w-full h-full object-cover"
              />
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
        <div className="bg-[#d3d3d3] rounded p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Task Checklist</h2>
            <button
              className="bg-[#9706e9] text-white p-2 rounded-full hover:bg-[#8005cc] transition-all duration-200"
              onClick={handleAddTask}
            >
              <PlusCircle size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
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
                <div key={category} className="mb-6">
                  <h3 className="font-medium mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors duration-200"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <input
                          type="checkbox"
                          id={`task-${task.id}`}
                          checked={task.completed}
                          disabled={task.completed}
                          className={`rounded border-gray-300 ${task.completed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} text-[#9706e9] focus:ring-[#9706e9]`}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!task.completed) { // Only allow completing tasks, not uncompleting
                              // Open confirmation modal instead of completing immediately
                              setTaskToComplete(task);
                              setConfirmationModalOpen(true);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`text-sm flex-grow ${task.completed ? 'line-through text-gray-500' : ''}`}
                        >
                          {task.title}
                        </label>
                        {task.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">High</span>
                        )}
                        {task.priority === 'medium' && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Medium</span>
                        )}
                        {task.priority === 'low' && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Low</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-gray-500 text-sm italic">
              No tasks yet. Click the plus button to add a task.
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        <div className="bg-[#e5f2e5] rounded p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Completed Tasks</h2>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading tasks...</div>
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
                <div key={category} className="mb-6">
                  <h3 className="font-medium mb-2">{category}</h3>
                  <div className="space-y-2">
                    {categoryTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors duration-200"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <input
                          type="checkbox"
                          id={`completed-task-${task.id}`}
                          checked={true}
                          disabled={true}
                          className="rounded border-gray-300 opacity-60 cursor-not-allowed text-green-600 focus:ring-green-600"
                        />
                        <label
                          htmlFor={`completed-task-${task.id}`}
                          className="text-sm flex-grow line-through text-gray-500"
                        >
                          {task.title}
                        </label>
                        {task.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded opacity-60">High</span>
                        )}
                        {task.priority === 'medium' && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded opacity-60">Medium</span>
                        )}
                        {task.priority === 'low' && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded opacity-60">Low</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-gray-500 text-sm italic">
              No completed tasks yet. Complete a task to see it here.
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
          selectedDate={new Date().toISOString().split("T")[0]}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updatedTask) => {
            setTasks(
              tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              )
            );
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
                    console.log("Completing task:", taskToComplete);
                    
                    // Create a copy of the task with completed status
                    const completedTaskCopy = { ...taskToComplete, completed: true };
                    
                    // Add to completed tasks immediately (optimistic update)
                    setCompletedTasks(prevCompletedTasks => [...prevCompletedTasks, completedTaskCopy]);
                    
                    // Remove from active tasks immediately (optimistic update)
                    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToComplete.id));
                    
                    // Mark task as completed in the backend
                    await handleTaskCompletion(taskToComplete.id, true);
                    
                    console.log("Task completed and moved to completed tasks section");
                    
                    // Close modal
                    setConfirmationModalOpen(false);
                    setTaskToComplete(null);
                  } catch (error) {
                    console.error('Error completing task:', error);
                    
                    // If there was an error, refresh the dashboard data to ensure consistency
                    const userData = JSON.parse(localStorage.getItem('user'));
                    if (userData && userData.id) {
                      await fetchDashboardData(userData.id);
                    }
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

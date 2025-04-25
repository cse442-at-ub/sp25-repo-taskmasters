"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";

// Custom styles for select dropdown to match production
const selectStyles = `
  .time-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: white;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    padding-right: 2.5rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #374151;
    width: 100%;
    cursor: pointer;
  }
  
  .time-select:focus {
    outline: none;
    border-color: #9706e9;
    box-shadow: 0 0 0 2px rgba(151, 6, 233, 0.1);
  }
  
  /* Firefox-specific styling */
  @-moz-document url-prefix() {
    .time-select {
      text-indent: 0.01px;
      text-overflow: '';
      padding-right: 0.75rem;
    }
    
    .time-select-container .time-select-icon {
      pointer-events: none;
    }
  }

  .time-display {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e8e8e8;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #374151;
    background-color: white;
    cursor: pointer;
  }
  
  .time-display:focus {
    outline: none;
    border-color: #9706e9;
    box-shadow: 0 0 0 2px rgba(151, 6, 233, 0.1);
  }
  
  .time-field {
    position: relative;
  }
  
  .time-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #8000ff;
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  .time-column::-webkit-scrollbar {
    display: none;
  }
  
  /* Custom time picker styles to match theme */
  .time-option {
    padding: 8px 8px;
    cursor: pointer;
    text-align: center;
    font-size: 14px;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .time-option:hover {
    background-color: #f3e8ff;
  }
  
  .time-option.selected {
    background-color: #8000ff;
    color: white;
    font-weight: 500;
  }
`;

export default function TaskDetailView({ taskId, selectedDate, onClose, onTaskUpdated }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const editModeRef = useRef(false); // Use a ref to track edit mode
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [formData, setFormData] = useState({
    taskName: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    priority: "",
    recurring: 0,
    recurringDays: ""
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigate = useNavigate();

  // Initial data fetch - but don't fetch if we're in edit mode
  useEffect(() => {
    if (taskId && !editModeRef.current) {
      fetchTaskDetails();
    }
  }, [taskId, selectedDate]);

  // This effect ensures edit mode stays active
  useEffect(() => {
    if (editModeRef.current && !isEditing) {
      // Force edit mode to stay active
      setTimeout(() => {
        setIsEditing(true);
      }, 0);
    }
  }, [isEditing]);
  
  // Check localStorage as a backup mechanism
  useEffect(() => {
    const editModeFlag = localStorage.getItem('taskEditMode_' + taskId);
    if (editModeFlag === 'true' && !isEditing) {
      editModeRef.current = true;
      setIsEditing(true);
    }
    
    return () => {
      // Clean up when component unmounts
      localStorage.removeItem('taskEditMode_' + taskId);
    };
  }, [taskId, isEditing]);

  const fetchTaskDetails = async () => {
    try {
      // Don't set loading to true if we're in edit mode
      if (!editModeRef.current) {
        setLoading(true);
      }
      
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      // Fetch all tasks for the selected date - use URL constructor to ensure userId is properly included
      const url = new URL(`${config.apiUrl}/tasks.php`);
      url.searchParams.append('date', selectedDate);
      url.searchParams.append('userId', user.id);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      const tasks = await response.json();

      if (response.ok) {
        // Find the specific task by ID
        const taskData = tasks.find(task => task.task_id === taskId);
        
        if (taskData) {
          setTask(taskData);
          
          // Check if task is completed
          setIsCompleted(taskData.completed === "1");
          
          // Extract time from the formatted_time field, handling both 12-hour and 24-hour formats
          const formattedTime = taskData.formatted_time || "00:00:00";
          
          // Check if time is in 12-hour format (contains AM/PM)
          let hours, minutes, startMinutes;
          
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
            
            startMinutes = hours * 60 + minutes;
          } else {
            // Parse 24-hour format (e.g., "13:00")
            [hours, minutes] = formattedTime.split(':').map(Number);
            startMinutes = hours * 60 + minutes;
          }
          
          // Format for input fields (needs to be in 24-hour format)
          const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          
          // Calculate end time based on duration
          const endMinutes = startMinutes + parseInt(taskData.task_duration);
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
          
          // Only update form data if not in edit mode
          if (!editModeRef.current) {
            // Check if task is recurring
            const isTaskRecurring = taskData.Task_recurring === "1";
            setIsRecurring(isTaskRecurring);
            
            // Parse recurring days if available
            let recurringDays = [];
            if (isTaskRecurring && taskData.recurringDays) {
              recurringDays = taskData.recurringDays.split(',');
              setSelectedDays(recurringDays);
            }
            
            setFormData({
              taskName: taskData.task_Title || "Untitled Task",
              category: taskData.task_tags || "",
              description: taskData.task_description || "",
              startDate: taskData.task_startDate,
              endDate: taskData.task_dueDate,
              startTime: startTime,
              endTime: endTime,
              priority: taskData.task_priority || "medium",
              recurring: isTaskRecurring ? 1 : 0,
              recurringDays: taskData.recurringDays || ""
            });
          }
        } else {
          throw new Error("Task not found");
        }
      } else {
        setError(tasks.message || "Failed to fetch task details");
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      setError(error.message || "Failed to fetch task details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleRecurring = () => {
    setIsRecurring(!isRecurring);
    setFormData(prev => ({
      ...prev,
      recurring: !isRecurring ? 1 : 0,
      recurringDays: !isRecurring ? selectedDays.join(',') : ""
    }));
  };

  const toggleDay = (day) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(newSelectedDays);
    setFormData(prev => ({
      ...prev,
      recurringDays: newSelectedDays.join(',')
    }));
  };

  const handleEdit = (e) => {
    // Prevent any state updates during this operation
    if (e) e.stopPropagation();
    
    // Set a flag in localStorage as a backup mechanism
    localStorage.setItem('taskEditMode_' + taskId, 'true');
    
    // Set both the state and the ref with a slight delay to avoid race conditions
    setTimeout(() => {
      editModeRef.current = true;
      setIsEditing(true);
      console.log("Edit mode activated");
      
      // Force a re-render after a short delay
      setTimeout(() => {
        const formCopy = {...formData};
        setFormData(formCopy);
      }, 50);
    }, 10);
  };

  const handleCancel = () => {
    if (isEditing) {
      // Reset edit mode
      editModeRef.current = false;
      
      // Clear the localStorage flag
      localStorage.removeItem('taskEditMode_' + taskId);
      
      // Reset form data to original task values
      const formattedTime = task.formatted_time || "00:00:00";
      
      // Check if time is in 12-hour format (contains AM/PM)
      let hours, minutes, startMinutes;
      
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
        
        startMinutes = hours * 60 + minutes;
      } else {
        // Parse 24-hour format (e.g., "13:00")
        [hours, minutes] = formattedTime.split(':').map(Number);
        startMinutes = hours * 60 + minutes;
      }
      
      // Format for input fields (needs to be in 24-hour format)
      const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Calculate end time based on duration
      const endMinutes = startMinutes + parseInt(task.task_duration);
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      setFormData({
        taskName: task.task_Title || "Untitled Task",
        category: task.task_tags || "",
        description: task.task_description || "",
        startDate: task.task_startDate,
        endDate: task.task_dueDate,
        startTime: startTime,
        endTime: endTime,
        priority: task.task_priority || "medium",
      });
      setIsEditing(false);
    } else {
      // Also clear the localStorage flag when closing
      localStorage.removeItem('taskEditMode_' + taskId);
      onClose();
    }
  };

  const handleDelete = async (deleteAllRecurring = false) => {
    const confirmMessage = deleteAllRecurring 
      ? "Are you sure you want to delete all instances of this recurring task?" 
      : "Are you sure you want to delete this task?";
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      // Send DELETE request with taskId as URL parameter - use URL constructor to ensure parameters are properly included
      const url = new URL(`${config.apiUrl}/tasks.php`);
      url.searchParams.append('task_id', taskId);
      url.searchParams.append('userId', user.id);
      
      if (deleteAllRecurring) {
        url.searchParams.append('deleteRecurring', 'true');
      }
      
      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (onTaskUpdated) onTaskUpdated();
        onClose();
      } else {
        setError(data.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setError(error.message || "Failed to delete task");
    }
  };

  const handleCompleteTask = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      // Send PUT request to mark task as completed - use direct fetch to ensure proper handling
      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          action: 'complete',
          taskId: taskId,
          userId: user.id
        }),
      });

      // Check if response is empty before trying to parse JSON
      const responseText = await response.text();
      let data = { message: "Task completed successfully" };
      
      if (responseText && responseText.trim() !== '') {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          // Use default success message if parsing fails
        }
      }

      if (response.ok) {
        // Update the completed state
        setIsCompleted(true);
        
        // Check if any achievements were unlocked
        if (data.achievements && data.achievements.unlockedAchievements && data.achievements.unlockedAchievements.length > 0) {
          // Show achievement notification
          const achievementNames = data.achievements.unlockedAchievements
            .map(a => a.name)
            .join(', ');
          
          alert(`Task completed! You unlocked ${data.achievements.unlockedAchievements.length} achievement(s): ${achievementNames}`);
        } else {
          alert("Task completed successfully!");
        }
        
        // Update the task in the parent component
        if (onTaskUpdated) onTaskUpdated();
        
        // Close the modal after a short delay to show the completed status
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(data.message || "Failed to complete task");
      }
    } catch (error) {
      console.error("Error completing task:", error);
      setError(error.message || "Failed to complete task");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      const startTime = new Date(`2000/01/01 ${formData.startTime}`);
      const endTime = new Date(`2000/01/01 ${formData.endTime}`);
      const duration = Math.round((endTime - startTime) / (1000 * 60));

      // Use direct fetch to ensure proper handling
      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          taskId: taskId,
          userId: user.id,
          duration: duration,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset edit mode
        editModeRef.current = false;
        localStorage.removeItem('taskEditMode_' + taskId);
        setIsEditing(false);
        
        // Fetch the updated task
        await fetchTaskDetails();
        
        if (onTaskUpdated) onTaskUpdated();
      } else {
        setError(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setError(error.message || "Failed to update task");
    }
  };

  // Don't show loading screen if we're in edit mode
  if (loading && !isEditing && !editModeRef.current) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">Loading task details...</div>
        </div>
      </div>
    );
  }
  
  // Separate rendering for edit mode and view mode
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-center">{isEditing ? "Edit Task" : "Task Details"}</h1>
          {isCompleted && !isEditing && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Completed
            </div>
          )}
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              placeholder="Enter task name"
              value={formData.taskName}
              onChange={handleInputChange}
              readOnly={!isEditing}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
              }`}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              id="category"
              name="category"
              placeholder="Enter category"
              value={formData.category}
              onChange={handleInputChange}
              readOnly={!isEditing}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
              }`}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              readOnly={!isEditing}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md appearance-none ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
                style={{ 
                  WebkitAppearance: "none", 
                  MozAppearance: "textfield"
                }}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md appearance-none ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
                style={{ 
                  WebkitAppearance: "none", 
                  MozAppearance: "textfield"
                }}
              />
            </div>
          </div>

          {/* Recurring Task Section */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={isEditing ? toggleRecurring : undefined}
                  disabled={!isEditing}
                  className={`w-4 h-4 text-[#9706e9] border-gray-300 rounded focus:ring-[#9706e9] ${
                    !isEditing ? "cursor-not-allowed" : ""
                  }`}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Recurring Task</span>
              </label>
            </div>
            
            {isRecurring && (
              <div className={`mt-2 p-4 ${isEditing ? 'bg-purple-50' : 'bg-gray-50'} rounded-md`}>
                <p className="text-sm text-gray-700 mb-2">
                  {isEditing ? "Select days of the week:" : "Recurring on:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={isEditing ? () => toggleDay(day) : undefined}
                      disabled={!isEditing}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                        selectedDays.includes(day)
                          ? isEditing ? 'bg-[#9706e9] text-white' : 'bg-purple-300 text-white'
                          : isEditing ? 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100' : 'bg-gray-200 text-gray-500'
                      } ${!isEditing ? "cursor-default" : ""}`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-2">
                    Tasks will be created for each selected day between the start and end dates.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md appearance-none ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
                style={{ 
                  WebkitAppearance: "none", 
                  MozAppearance: "textfield"
                }}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                readOnly={!isEditing}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md appearance-none ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
                style={{ 
                  WebkitAppearance: "none", 
                  MozAppearance: "textfield"
                }}
              />
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Priority</p>
            <div className="flex gap-6">
              {["low", "medium", "high"].map((level) => (
                <div key={level} className="flex items-center">
                  <input
                    id={`priority-${level}`}
                    type="radio"
                    name="priority"
                    value={level}
                    checked={formData.priority === level}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-4 h-4 text-[#9706e9] border-gray-300 focus:ring-[#9706e9] ${
                      !isEditing ? "cursor-not-allowed" : ""
                    }`}
                  />
                  <label 
                    htmlFor={`priority-${level}`} 
                    className="ml-2 text-sm text-gray-700"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-start">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCompleteTask}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Complete Task
                </button>
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-6 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Delete
                </button>
                {isRecurring && (
                  <button
                    type="button"
                    onClick={() => handleDelete(true)}
                    className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Delete All Recurring
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

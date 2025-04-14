"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import config from '../config'
import { post } from '../utils/api'

export default function CreateTaskForm({ onClose }) {
  const [error, setError] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [taskDuration, setTaskDuration] = useState(60); // Default 60 minutes
  const [displacementNotice, setDisplacementNotice] = useState(null);
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
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const toggleRecurring = () => {
    setIsRecurring(!isRecurring);
    setFormData(prev => ({
      ...prev,
      recurring: !isRecurring ? 1 : 0,
      recurringDays: !isRecurring ? selectedDays.join(',') : ""
    }));
  }

  const toggleDay = (day) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(newSelectedDays);
    setFormData(prev => ({
      ...prev,
      recurringDays: newSelectedDays.join(',')
    }));
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Function to find free time slots in the calendar
  const findFreeTimeSlot = async (date, duration, priority) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      // Format date for API request
      const dateStr = date.toISOString().split('T')[0];
      
      // Fetch tasks for the selected date
      const response = await fetch(`${config.apiUrl}/tasks.php?date=${dateStr}&userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const tasks = await response.json();
      
      // Convert tasks to time slots with priority information
      const taskSlots = tasks.map(task => {
        let startMinute = 0;
        if (task.formatted_time) {
          const [hours, minutes] = task.formatted_time.split(':');
          startMinute = parseInt(hours) * 60 + parseInt(minutes);
        } else if (task.Task_time) {
          const timeObj = new Date(task.Task_time);
          startMinute = timeObj.getHours() * 60 + timeObj.getMinutes();
        }
        
        const taskDuration = parseInt(task.task_duration) || 60;
        const endMinute = startMinute + taskDuration;
        
        return { 
          id: task.task_id,
          title: task.task_Title || 'Untitled Task',
          start: startMinute, 
          end: endMinute,
          priority: task.task_priority || 'medium',
          duration: taskDuration
        };
      });
      
      // Define working hours (9AM to 5PM)
      const dayStart = 9 * 60; // 9AM in minutes
      const dayEnd = 17 * 60; // 5PM in minutes
      
      // Define priority levels (for comparison)
      const priorityValue = {
        'high': 3,
        'medium': 2,
        'low': 1
      };
      
      const currentPriorityValue = priorityValue[priority] || 2; // Default to medium if not specified
      
      // Sort tasks by start time 
      taskSlots.sort((a, b) => a.start - b.start);
      
      // Function to check if a time slot is available
      const isTimeSlotAvailable = (startMinute, taskDuration) => {
        const endMinute = startMinute + taskDuration;
        
        // Check if the slot is within working hours
        if (startMinute < dayStart || endMinute > dayEnd) {
          return false;
        }
        
        // Check for any overlap with existing tasks
        for (const task of taskSlots) {
          if ((startMinute >= task.start && startMinute < task.end) ||
              (endMinute > task.start && endMinute <= task.end) ||
              (startMinute <= task.start && endMinute >= task.end)) {
            return false;
          }
        }
        return true;
      };
      
      // Function to find the next available slot
      const findNextAvailableSlot = (startFrom, duration) => {
        let currentTime = startFrom;
        
        while (currentTime + duration <= dayEnd) {
          if (isTimeSlotAvailable(currentTime, duration)) {
            return currentTime;
          }
          currentTime += 30; // Move forward by 30-minute intervals
        }
        return null;
      };
      
      // For low priority tasks: find the latest available slot
      if (priority === 'low') {
        // Start from the end of the day and work backwards
        let availableStart = dayEnd - duration;
        
        while (availableStart >= dayStart) {
          if (isTimeSlotAvailable(availableStart, duration)) {
            const hours = Math.floor(availableStart / 60);
            const minutes = availableStart % 60;
            const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            const endMinute = availableStart + duration;
            const endHours = Math.floor(endMinute / 60);
            const endMinutes = endMinute % 60;
            const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
            
            return { startTime: startTimeStr, endTime: endTimeStr };
          }
          availableStart -= 30;
        }
        return null;
      }
      
      // For medium priority tasks: find the earliest available slot
      if (priority === 'medium') {
        const availableStart = findNextAvailableSlot(dayStart, duration);
        
        if (availableStart !== null) {
          const hours = Math.floor(availableStart / 60);
          const minutes = availableStart % 60;
          const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          const endMinute = availableStart + duration;
          const endHours = Math.floor(endMinute / 60);
          const endMinutes = endMinute % 60;
          const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
          
          return { startTime: startTimeStr, endTime: endTimeStr };
        }
        return null;
      }
      
      // For high priority tasks: find the earliest available slot
      if (priority === 'high') {
        const availableStart = findNextAvailableSlot(dayStart, duration);
        
        if (availableStart !== null) {
          const hours = Math.floor(availableStart / 60);
          const minutes = availableStart % 60;
          const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          
          const endMinute = availableStart + duration;
          const endHours = Math.floor(endMinute / 60);
          const endMinutes = endMinute % 60;
          const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
          
          return { startTime: startTimeStr, endTime: endTimeStr };
        }
        return null;
      }
      
      // Fallback case: try to find any available slot
      const availableStart = findNextAvailableSlot(dayStart, duration);
      
      if (availableStart !== null) {
        const hours = Math.floor(availableStart / 60);
        const minutes = availableStart % 60;
        const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        const endMinute = availableStart + duration;
        const endHours = Math.floor(endMinute / 60);
        const endMinutes = endMinute % 60;
        const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
        
        return { startTime: startTimeStr, endTime: endTimeStr };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding free time slot:', error);
      return null;
    }
  };

  // Handle opening the duration selection modal
  const handleAutoApplyClick = (e) => {
    e.preventDefault();
    
    // Check if start date is provided
    if (!formData.startDate) {
      setError('Please select a start date before using Auto Apply');
      return;
    }
    
    setIsDurationModalOpen(true);
  };

  // Handle duration selection and proceed with auto apply
  const handleDurationSelect = async () => {
    setIsDurationModalOpen(false);
    setIsLoading(true);
    setDisplacementNotice(null); // Clear any previous notifications
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      // Validate priority is set before auto-applying
      if (!formData.priority) {
        setError('Please select a priority level before using Auto Apply');
        setIsLoading(false);
        return;
      }

      const date = new Date(formData.startDate);
      const freeSlot = await findFreeTimeSlot(date, taskDuration, formData.priority);
      
      if (!freeSlot) {
        setError('No suitable time slots found for this task with the selected priority. Please try a different priority or set the time manually.');
        setIsLoading(false);
        return;
      }
      
      // Create a new task object with the found time slot
      const updatedFormData = { 
        ...formData,
        startTime: freeSlot.startTime,
        endTime: freeSlot.endTime 
      };
      
      // If end date is not provided, use start date
      if (!updatedFormData.endDate && updatedFormData.startDate) {
        updatedFormData.endDate = updatedFormData.startDate;
      }

      const startTime = new Date(`2000/01/01 ${freeSlot.startTime}`);
      const endTime = new Date(`2000/01/01 ${freeSlot.endTime}`);
      const duration = Math.round((endTime - startTime) / (1000 * 60));

      // Show in-app notification instead of alert for displaced tasks
      if (freeSlot.displacedTask) {
        setDisplacementNotice({
          message: `The auto-scheduling has displaced a lower priority task: "${freeSlot.displacedTask.title}"`,
          type: 'warning'
        });
      } else if (freeSlot.displacedTasks && freeSlot.displacedTasks.length > 0) {
        setDisplacementNotice({
          message: `The auto-scheduling has displaced ${freeSlot.displacedTasks.length} lower priority tasks.`,
          type: 'warning'
        });
      }

      // For recurring tasks, create a task for each selected day
      if (isRecurring && selectedDays.length > 0) {
        // Create a task for each selected day
        const createRecurringTasks = async () => {
          const startDate = new Date(updatedFormData.startDate);
          const endDate = new Date(updatedFormData.endDate);
          
          // Create a task for the initial date using the secure API utility
          const initialResponse = await post('tasks.php', {
            ...updatedFormData,
            userId: user.id,
            duration: duration,
            recurring: 1,
            recurringDays: selectedDays.join(',')
          });

          if (!initialResponse.ok) {
            throw new Error('Failed to create initial task');
          }

          // Calculate the date range for recurring tasks
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          
          // Create tasks for each selected day within the date range
          // Start from i=0 to include the initial date in the loop
          for (let i = 0; i <= daysDiff; i++) {
            // Create a new date object for the current date in the loop
            const currentDate = new Date(startDate);
            // Add i days to the start date to get the current date
            currentDate.setDate(currentDate.getDate() + i);
            
            // Check if the current day of the week is in the selected days
            const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            if (selectedDays.includes(daysOfWeek[currentDayOfWeek])) {
              // Use the secure API utility for recurring tasks
              await post('tasks.php', {
                ...updatedFormData,
                userId: user.id,
                duration: duration,
                startDate: currentDate.toISOString().split('T')[0],
                recurring: 1,
                recurringDays: selectedDays.join(',')
              });
            }
          }
        };

        await createRecurringTasks();
        onClose();
        return;
      }
      
      // For a single non-recurring task
      const response = await post('tasks.php', {
        ...updatedFormData,
        userId: user.id,
        duration: duration,
        recurring: 0
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Error applying auto-scheduling:', error);
      setError(error.message || 'Failed to auto-schedule task');
      setIsLoading(false);
    }
  };

  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDisplacementNotice(null);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      // Check if required fields are filled
      if (!formData.taskName.trim()) {
        setError('Task name is required');
        return;
      }
      
      if (!formData.startDate) {
        setError('Start date is required');
        return;
      }
      
      if (!formData.priority) {
        setError('Please select a priority level');
        return;
      }
      
      // If no end date is provided, use start date
      if (!formData.endDate) {
        setFormData(prev => ({...prev, endDate: formData.startDate}));
      }
      
      // Check if start time and end time are both provided, or neither
      const hasStartTime = !!formData.startTime;
      const hasEndTime = !!formData.endTime;
      
      if ((hasStartTime && !hasEndTime) || (!hasStartTime && hasEndTime)) {
        setError('Both start time and end time must be provided, or use Auto Apply');
        return;
      }

      // Calculate duration if times are manually set
      let duration = 0;
      if (hasStartTime && hasEndTime) {
        const startTime = new Date(`2000/01/01 ${formData.startTime}`);
        const endTime = new Date(`2000/01/01 ${formData.endTime}`);
        duration = Math.round((endTime - startTime) / (1000 * 60));
        
        if (duration <= 0) {
          setError('End time must be after start time');
          return;
        }
        
        // For manually set times, check for conflicts with existing tasks
        setIsLoading(true);
        
        try {
          const date = new Date(formData.startDate);
          const dateStr = date.toISOString().split('T')[0];
          
          // Fetch tasks for the selected date
          const response = await fetch(`${config.apiUrl}/tasks.php?date=${dateStr}&userId=${user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch tasks');
          }
          
          const tasks = await response.json();
          
          // Convert the selected time to minutes
          const [startHours, startMinutes] = formData.startTime.split(':');
          const selectedStartMinute = parseInt(startHours) * 60 + parseInt(startMinutes);
          const selectedEndMinute = selectedStartMinute + duration;
          
          // Check for conflicts
          let hasConflict = false;
          let conflictingTask = null;
          
          for (const task of tasks) {
            let taskStartMinute = 0;
            if (task.formatted_time) {
              const [hours, minutes] = task.formatted_time.split(':');
              taskStartMinute = parseInt(hours) * 60 + parseInt(minutes);
            } else if (task.Task_time) {
              const timeObj = new Date(task.Task_time);
              taskStartMinute = timeObj.getHours() * 60 + timeObj.getMinutes();
            }
            
            const taskDuration = parseInt(task.task_duration) || 60;
            const taskEndMinute = taskStartMinute + taskDuration;
            
            // Check for overlap
            if ((selectedStartMinute >= taskStartMinute && selectedStartMinute < taskEndMinute) ||
                (selectedEndMinute > taskStartMinute && selectedEndMinute <= taskEndMinute) ||
                (selectedStartMinute <= taskStartMinute && selectedEndMinute >= taskEndMinute)) {
              hasConflict = true;
              conflictingTask = task;
              break;
            }
          }
          
          if (hasConflict) {
            setIsLoading(false);
            setError('The selected time conflicts with an existing task. Please choose a different time or use Auto Apply.');
            return;
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error checking for conflicts:', error);
          setIsLoading(false);
          // Continue anyway if we can't check for conflicts
        }
      } else {
        // If no times are provided, trigger auto-apply
        handleAutoApplyClick(e);
        return;
      }

      // For recurring tasks, create a task for each selected day
      if (isRecurring && selectedDays.length > 0) {
        // Create a task for each selected day
        setIsLoading(true);
        const createRecurringTasks = async () => {
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate || formData.startDate);
          
          // Create a task for the initial date
          const initialResponse = await post('tasks.php', {
            ...formData,
            userId: user.id,
            duration: duration,
            recurring: 1,
            recurringDays: selectedDays.join(',')
          });

          if (!initialResponse.ok) {
            throw new Error('Failed to create initial task');
          }

          // Calculate the date range for recurring tasks
          const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          
          // Create tasks for each selected day within the date range
          for (let i = 1; i <= daysDiff; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Check if the current day of the week is in the selected days
            const currentDayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
            if (selectedDays.includes(daysOfWeek[currentDayOfWeek])) {
              await post('tasks.php', {
                ...formData,
                userId: user.id,
                duration: duration,
                startDate: currentDate.toISOString().split('T')[0],
                recurring: 1,
                recurringDays: selectedDays.join(',')
              });
            }
          }
        };

        await createRecurringTasks();
        setIsLoading(false);
        onClose();
        return;
      }

      // For non-recurring tasks, create a single task
      setIsLoading(true);
      const response = await post('tasks.php', {
        ...formData,
        userId: user.id,
        duration: duration,
        recurring: 0
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
      setIsLoading(false);
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto relative">
        <h1 className="text-2xl font-semibold text-center mb-6">Create New Task</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        {displacementNotice && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4 flex justify-between items-center">
            <span>{displacementNotice.message}</span>
            <button 
              className="text-yellow-600 hover:text-yellow-800"
              onClick={() => setDisplacementNotice(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[#9706e9] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-700">Auto-scheduling your task...</p>
            </div>
          </div>
        )}

        {/* Duration Selection Modal */}
        {isDurationModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-center mb-4">Select Task Duration</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How long should this task be?
                </label>
                
                <div className="flex flex-col space-y-4">
                  {/* Duration slider */}
                  <div className="w-full">
                    <input
                      type="range"
                      min="15"
                      max="240"
                      step="15"
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9706e9]"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>15m</span>
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                    </div>
                  </div>
                  
                  {/* Duration display */}
                  <div className="text-center text-2xl font-bold text-[#9706e9]">
                    {taskDuration < 60 
                      ? `${taskDuration} minutes` 
                      : taskDuration % 60 === 0 
                        ? `${taskDuration / 60} hour${taskDuration > 60 ? 's' : ''}` 
                        : `${Math.floor(taskDuration / 60)}h ${taskDuration % 60}m`
                    }
                  </div>
                  
                  {/* Quick selection buttons */}
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {[30, 45, 60, 90, 120].map(duration => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setTaskDuration(duration)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          taskDuration === duration 
                            ? 'bg-[#9706e9] text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {duration < 60 
                          ? `${duration}m` 
                          : duration % 60 === 0 
                            ? `${duration / 60}h` 
                            : `${Math.floor(duration / 60)}h ${duration % 60}m`
                        }
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDurationModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDurationSelect}
                  className="px-4 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
              value={formData.taskName}
              onChange={handleInputChange}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
              value={formData.category}
              onChange={handleInputChange}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
              value={formData.description}
              onChange={handleInputChange}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                value={formData.startDate}
                onChange={handleInputChange}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                value={formData.endDate}
                onChange={handleInputChange}
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
                  onChange={toggleRecurring}
                  className="w-4 h-4 text-[#9706e9] border-gray-300 rounded focus:ring-[#9706e9]"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Recurring Task</span>
              </label>
            </div>
            
            {isRecurring && (
              <div className="mt-2 p-4 bg-purple-50 rounded-md">
                <p className="text-sm text-gray-700 mb-2">Select days of the week:</p>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-200 ${
                        selectedDays.includes(day)
                          ? 'bg-[#9706e9] text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tasks will be created for each selected day between the start and end dates.
                </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                value={formData.startTime}
                onChange={handleInputChange}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                value={formData.endTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">Priority</p>
            <div className="flex gap-6">
              {["low", "medium", "high"].map((level) => (
                <label key={level} className="flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    value={level}
                    checked={formData.priority === level}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#9706e9] border-gray-300 focus:ring-[#9706e9]"
                  />
                  <span className="ml-2 text-sm text-gray-700">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-start">
            <button
              type="button"
              onClick={handleAutoApplyClick}
              disabled={isLoading || formData.startTime !== ""}
              className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200 ${
                formData.startTime !== "" 
                  ? "bg-gray-400 text-white cursor-not-allowed" 
                  : "bg-[#9706e9] text-white hover:bg-[#8005cc]"
              }`}
            >
              {isLoading ? 'Loading...' : 'Auto Apply'}
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.startTime === ""}
              className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200 ${
                formData.startTime === "" 
                  ? "bg-gray-400 text-white cursor-not-allowed" 
                  : "bg-[#9706e9] text-white hover:bg-[#8005cc]"
              }`}
            >
              {isLoading ? 'Loading...' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 border border-[#9706e9] text-[#9706e9] rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
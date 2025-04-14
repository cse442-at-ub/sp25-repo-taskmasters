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
    
    // Special handling for endTime to ensure it's not earlier than startTime
    if (name === 'endTime' && value && formData.startTime) {
      const startTimeObj = new Date(`2000/01/01 ${formData.startTime}`);
      const endTimeObj = new Date(`2000/01/01 ${value}`);
      
      if (endTimeObj <= startTimeObj) {
        setError('End time must be later than start time');
        return;
      }
    }
    
    // Special handling for startTime to ensure it's not later than endTime
    if (name === 'startTime' && value && formData.endTime) {
      const startTimeObj = new Date(`2000/01/01 ${value}`);
      const endTimeObj = new Date(`2000/01/01 ${formData.endTime}`);
      
      if (startTimeObj >= endTimeObj) {
        setError('Start time must be earlier than end time');
        return;
      }
    }
    
    // Clear error when changing either time if there was a previous error
    if ((name === 'startTime' || name === 'endTime') && 
        (error === 'End time must be later than start time' || 
         error === 'Start time must be earlier than end time')) {
      setError('');
    }
    
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

  const findFreeTimeSlot = async (date, duration) => {
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
      

      // Convert tasks to time slots (start and end minutes since midnight)
      const busySlots = tasks.map(task => {
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
        

        return { start: startMinute, end: endMinute };
      });
      
      // Sort busy slots by start time
      busySlots.sort((a, b) => a.start - b.start);
      
      // Define working hours (9am to 12am)
      const dayStart = 9 * 60; // 9am in minutes
      const dayEnd = 24 * 60; // 12am in minutes
      
      // Find free slots
      const freeSlots = [];
      let currentTime = dayStart;
      
      for (const slot of busySlots) {
        if (slot.start > currentTime) {
          freeSlots.push({ start: currentTime, end: slot.start });
        }
        currentTime = Math.max(currentTime, slot.end);
      }
      
      // Add the last free slot if there's time left in the day
      if (currentTime < dayEnd) {
        freeSlots.push({ start: currentTime, end: dayEnd });
      }
      
      // Filter out slots that are too small (less than the specified duration)
      const viableSlots = freeSlots.filter(slot => (slot.end - slot.start) >= duration);
      
      if (viableSlots.length === 0) {
        return null; // No suitable free slots found
      }
      
      // Find the middle of the largest free slot
      const largestSlot = viableSlots.reduce(
        (max, slot) => (slot.end - slot.start > max.end - max.start) ? slot : max, 
        viableSlots[0]
      );
      
      // Calculate the middle time
      const middleMinute = Math.floor(largestSlot.start + (largestSlot.end - largestSlot.start - duration) / 2);
      
      // Convert to hours and minutes
      const hours = Math.floor(middleMinute / 60);
      const minutes = middleMinute % 60;
      
      // Format as HH:MM
      const startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Calculate end time
      const endMinute = middleMinute + duration;
      const endHours = Math.floor(endMinute / 60);
      const endMinutes = endMinute % 60;
      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
      
      return { startTime: startTimeStr, endTime: endTimeStr };
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


  // This is a placeholder declaration to avoid duplicate function error
  // The actual implementation is below in the handleSubmit function

  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if start date is provided
    if (!formData.startDate) {
      setError('Please select a start date');
      return;
    }
    
    // If startTime and endTime are already set, directly submit the form
    // Otherwise, open the duration modal for auto-apply
    if (formData.startTime && formData.endTime) {
      setIsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('User not logged in');
        }
        
        // Calculate duration from start and end times
        const startTime = new Date(`2000/01/01 ${formData.startTime}`);
        const endTime = new Date(`2000/01/01 ${formData.endTime}`);
        const duration = Math.round((endTime - startTime) / (1000 * 60));
        
        // If end date is not provided, use start date
        if (!formData.endDate && formData.startDate) {
          formData.endDate = formData.startDate;
        }
        
        // For recurring tasks
        if (isRecurring && selectedDays.length > 0) {

          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate || formData.startDate);
          
          // Create a task for the initial date

          // Ensure taskName is not empty
          const taskData = {

            ...formData,
            userId: user.id,
            duration: duration,
            recurring: 1,
            recurringDays: selectedDays.join(','),
            taskName: formData.taskName || "Untitled Task" // Provide default name if empty
          };
          
          const initialResponse = await post('tasks.php', taskData);
          
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
                recurringDays: selectedDays.join(','),
                taskName: formData.taskName || "Untitled Task" // Provide default name if empty
              });
            }
          }

        } else {
          // For non-recurring tasks
          // Ensure taskName is not empty
          const taskData = {
            ...formData,
            userId: user.id,
            duration: duration,
            recurring: 0,
            taskName: formData.taskName || "Untitled Task" // Provide default name if empty
          };
          
          const response = await post('tasks.php', taskData);
          
          if (!response.ok) {
            throw new Error('Failed to create task');
          }
        }
        
        onClose();
      } catch (error) {
        console.error('Error creating task:', error);
        setError(error.message || 'Failed to create task');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Open duration modal for auto-apply
      setIsDurationModalOpen(true);
    }
  };

  // Handle duration selection and proceed with auto apply
  const handleDurationSelect = async () => {
    setIsDurationModalOpen(false);
    setIsLoading(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }
      
      // Calculate duration in minutes
      const startTimeObj = new Date(`2000/01/01 ${formData.startTime}`);
      const endTimeObj = new Date(`2000/01/01 ${formData.endTime}`);
      const duration = Math.round((endTimeObj - startTimeObj) / (1000 * 60));
      
      // If end date is not provided, use start date
      if (!formData.endDate && formData.startDate) {
        formData.endDate = formData.startDate;
      }
      
      // For recurring tasks, create a task for each selected day
      if (isRecurring && selectedDays.length > 0) {
        const createRecurringTasks = async () => {
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate || formData.startDate);
          
          // Create a task for the initial date
          // Ensure taskName is not empty
          const taskData = {
            ...formData,
            userId: user.id,
            duration: duration,
            recurring: 1,

            recurringDays: selectedDays.join(','),
            taskName: formData.taskName || "Untitled Task" // Provide default name if empty
          };
          
          const initialResponse = await post('tasks.php', taskData);


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
              // Ensure taskName is not empty for recurring tasks too
              await post('tasks.php', {
                ...formData,
                userId: user.id,
                duration: duration,
                startDate: currentDate.toISOString().split('T')[0],
                recurring: 1,
                recurringDays: selectedDays.join(','),
                taskName: formData.taskName || "Untitled Task" // Provide default name if empty
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
      // Ensure taskName is not empty
      const taskData = {
        ...updatedFormData,
        userId: user.id,
        duration: duration,
        recurring: 0,
        taskName: updatedFormData.taskName || "Untitled Task" // Provide default name if empty
      };
      
      const response = await post('tasks.php', taskData);

      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
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
              <div className="flex gap-2">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    setFormData(prev => ({
                      ...prev,
                      startDate: formattedDate
                    }));
                  }}
                  className="px-3 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] transition-all duration-200"
                >
                  Today
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    setFormData(prev => ({
                      ...prev,
                      endDate: formattedDate
                    }));
                  }}
                  className="px-3 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] transition-all duration-200"
                >
                  Today
                </button>
              </div>
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
    </div>
  )
}
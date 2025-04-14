"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import config from '../config'

export default function CreateTaskForm({ onClose }) {
  const [error, setError] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
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

  const navigate = useNavigate()
  const handleSubmit = async (e, autoApply = false) => {
    e.preventDefault();
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not logged in');
      }

      const startTime = new Date(`2000/01/01 ${formData.startTime}`);
      const endTime = new Date(`2000/01/01 ${formData.endTime}`);
      const duration = Math.round((endTime - startTime) / (1000 * 60));

      // If recurring is enabled but no days are selected, show an error
      if (isRecurring && selectedDays.length === 0) {
        setError('Please select at least one day for recurring tasks');
        return;
      }

      // For recurring tasks, create a task for each selected day
      if (isRecurring && selectedDays.length > 0) {
        // Create a task for each selected day
        const createRecurringTasks = async () => {
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          
          // Create a task for the initial date
          const initialResponse = await fetch(`${config.apiUrl}/tasks.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              userId: user.id,
              duration: duration,
              recurring: 1,
              recurringDays: selectedDays.join(',')
            }),
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
              await fetch(`${config.apiUrl}/tasks.php`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  ...formData,
                  userId: user.id,
                  duration: duration,
                  startDate: currentDate.toISOString().split('T')[0],
                  recurring: 1,
                  recurringDays: selectedDays.join(',')
                }),
              });
            }
          }
        };

        await createRecurringTasks();
        onClose();
        return;
      }

      // For non-recurring tasks, create a single task
      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
          duration: duration,
          recurring: 0
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose();
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <h1 className="text-2xl font-semibold text-center mb-6">Create New Task</h1>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
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
              onClick={(e) => handleSubmit(e, true)}
              className="px-6 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
            >
              Auto Apply
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleCancel}
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

"use client"

import React, { useState, useEffect } from "react"
import TaskDetailsModal from "./TaskDetailsModal"
import CreateTaskForm from "./CreateTaskModal"
import { ChevronLeft, ChevronRight, LayoutDashboard, Calendar, User, Trophy, LogOut, PlusCircle, Menu } from "lucide-react"
import config from "../config"
import { useNavigate } from "react-router-dom"

export default function MonthView() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState("Month")
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false)
  const navigate = useNavigate()
  
  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsNavbarCollapsed(!isNavbarCollapsed)
  }

  // Get the first day of the month
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  // Get the last day of the month
  const getLastDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  // Get days for the month view (including days from prev/next month to fill the grid)
  const getMonthDays = () => {
    const firstDay = getFirstDayOfMonth(selectedDate)
    const lastDay = getLastDayOfMonth(selectedDate)
    const daysInMonth = lastDay.getDate()

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (ensure we have complete weeks)
    const totalDays = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7

    // Generate array of all days to display
    const days = []

    // Add days from previous month
    const prevMonth = new Date(selectedDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevMonthLastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0).getDate()

    for (let i = prevMonthLastDay - daysFromPrevMonth + 1; i <= prevMonthLastDay; i++) {
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)
      days.push({ date, isCurrentMonth: false })
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i)
      days.push({ date, isCurrentMonth: true })
    }

    // Add days from next month
    const nextMonth = new Date(selectedDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const daysFromNextMonth = totalDays - days.length
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }

  const monthDays = getMonthDays()

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      if (!user) {
        throw new Error("User not logged in")
      }

      // Get start and end dates for the month view
      const firstDay = getFirstDayOfMonth(selectedDate)
      const lastDay = getLastDayOfMonth(selectedDate)

      // Add buffer days for prev/next month days shown in the grid
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - 7) // One week before first day

      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + 7) // One week after last day

      // Format dates properly accounting for timezone
      const startDateStr = startDate.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
      const endDateStr = endDate.toLocaleDateString('en-CA');

      // Fetch tasks for the entire month view
      const response = await fetch(
        `${config.apiUrl}/tasks.php?startDate=${startDateStr}&endDate=${endDateStr}&userId=${user.id}`,
      )
      const data = await response.json()

      if (response.ok) {
        const formattedTasks = data.map((task) => {
          // Parse time properly using 24-hour format
          const [hours, minutes] = task.formatted_time.split(":");
          const minutesSinceMidnight = parseInt(hours) * 60 + parseInt(minutes);
          
          // Parse the task date properly
          const [year, month, day] = task.task_date.split('-').map(Number);
          const taskDate = new Date(year, month - 1, day);

          return {
            id: task.task_id,
            title: task.task_Title,
            category: task.task_tags,
            priority: task.task_priority,
            duration: parseInt(task.task_duration),
            startMinute: minutesSinceMidnight,
            endMinute: minutesSinceMidnight + parseInt(task.task_duration),
            date: taskDate,
            description: task.task_description || "",
            time: task.formatted_time
          };
        })
        setTasks(formattedTasks)
      } else {
        throw new Error(data.message || "Failed to fetch tasks")
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError(error.message)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [selectedDate])

  const formatMonthYear = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  }

  const handleAddTask = () => {
    setIsModalOpen(true)
  }

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() - 1)
    setSelectedDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(selectedDate.getMonth() + 1)
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const getTaskColor = (priority) => {
    const colors = {
      high: "bg-red-300",
      medium: "bg-yellow-200",
      low: "bg-green-300",
      default: "bg-gray-200",
    }
    return colors[priority] || colors.default
  }

  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    return tasks.filter(
      (task) =>
        date.getDate() === task.date.getDate() &&
        date.getMonth() === task.date.getMonth() &&
        date.getFullYear() === task.date.getFullYear(),
    )
  }

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const handleTaskClick = (task) => {
    setSelectedTask({
      id: task.id,
      date: task.date.toLocaleDateString('en-CA')
    });
    setIsTaskDetailsModalOpen(true);
  }

  const handleEditTask = async (updatedTask) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      if (!user) {
        throw new Error("User not logged in")
      }

      // Format time for API
      const [hours, minutes] = updatedTask.time.split(':');
      const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;

      // Format the task data for the API
      const taskData = {
        task_id: updatedTask.id,
        user_id: user.id,
        task_Title: updatedTask.title,
        task_description: updatedTask.description,
        task_date: updatedTask.date.toISOString().split("T")[0],
        formatted_time: formattedTime,
        task_duration: updatedTask.duration,
        task_priority: updatedTask.priority,
        task_tags: updatedTask.category,
        task_recurring: updatedTask.recurring || 0,
        recurringDays: updatedTask.recurringDays || ""
      }

      // Send update request to API
      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(taskData),
      })

      const data = await response.json()

      if (response.ok) {
        setIsTaskDetailsModalOpen(false)
        fetchTasks()
      } else {
        throw new Error(data.message || "Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      setError(error.message)
    }
  }

  const handleDeleteTask = async (taskId, deleteRecurring = false) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      if (!user) {
        throw new Error("User not logged in")
      }

      // Send delete request to API
      const url = deleteRecurring 
        ? `${config.apiUrl}/tasks.php?task_id=${taskId}&deleteRecurring=true`
        : `${config.apiUrl}/tasks.php?task_id=${taskId}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      })

      const data = await response.json()

      if (response.ok) {
        setIsTaskDetailsModalOpen(false)
        fetchTasks()
      } else {
        throw new Error(data.message || "Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      setError(error.message)
    }
  }

  return (
    <React.Fragment>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <div className={`bg-white shadow-lg flex flex-col ${
          isNavbarCollapsed ? "w-full md:w-16" : "w-full md:w-64"
        } transition-all duration-300 min-h-[80px] md:min-h-screen`}>
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
          <nav className={`${
            isNavbarCollapsed
              ? "hidden md:flex md:flex-col md:items-center"
              : "block"
          } flex-1 p-4`}>
            <div className="flex flex-col md:space-y-2">
              <a
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
                title="Dashboard"
              >
                <LayoutDashboard size={20} />
                {!isNavbarCollapsed && <span className="text-lg">Dashboard</span>}
              </a>
              <a
                onClick={() => navigate('/calendar')}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200 cursor-pointer"
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
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          {/* Header with Date Navigation */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">{formatMonthYear()}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 hover:text-[#9706e9] transition-colors duration-200 rounded-full hover:bg-purple-50"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNextMonth}
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
            <button
              onClick={() => navigate('/calendar')}
              className="bg-[#9706e9]/70 text-white px-4 py-2 rounded-l font-semibold hover:bg-[#9706e9]"
            >
              Day
            </button>
            <button
              onClick={() => navigate('/week-view')}
              className="bg-[#9706e9]/70 text-white px-4 py-2 border-l border-r border-purple-800 font-semibold hover:bg-[#9706e9]"
            >
              Week
            </button>
            <button
              onClick={() => navigate('/month-view')}
              className="bg-[#9706e9] text-white px-4 py-2 rounded-r font-semibold"
            >
              Month
            </button>
          </div>

          {/* Month Calendar Grid */}
          <div className="bg-white rounded-lg shadow-md">
            {/* Days of the week header */}
            <div className="grid grid-cols-7 border-b sticky top-0 bg-white z-10">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <div key={index} className="p-4 text-center font-medium border-r">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {monthDays.map((dayObj, index) => {
                const { date, isCurrentMonth } = dayObj
                const tasksForDay = getTasksForDay(date)
                const isCurrentDay = isToday(date)

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b relative ${
                      !isCurrentMonth ? "bg-gray-100" : ""
                    } ${isCurrentDay ? "bg-purple-50" : ""}`}
                  >
                    <div
                      className={`text-right mb-2 ${!isCurrentMonth ? "text-gray-400" : ""} ${isCurrentDay ? "text-[#9706e9] font-bold" : ""}`}
                    >
                      {date.getDate()}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px]">
                      {tasksForDay.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={`${getTaskColor(task.priority)} p-2 rounded-md text-xs shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-xs text-gray-600 truncate">{task.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <CreateTaskForm
          onClose={() => {
            setIsModalOpen(false)
            fetchTasks()
          }}
        />
      )}

      {/* Task Details Modal */}
      {isTaskDetailsModalOpen && selectedTask && (
        <TaskDetailsModal
          taskId={selectedTask.id}
          selectedDate={selectedTask.date}
          onClose={() => setIsTaskDetailsModalOpen(false)}
          onTaskUpdated={() => {
            setIsTaskDetailsModalOpen(false);
            fetchTasks();
          }}
        />
      )}
    </React.Fragment>
  )
}

"use client";

import React, { useState, useEffect } from "react";
import CreateTaskForm from "./CreateTaskModal";

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  LogOut,
  PlusCircle,
} from "lucide-react";
import config from "../config";

export default function WeekView() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState("Week");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Get the start of the week (Sunday)
  const getStartOfWeek = (date) => {
    const newDate = new Date(date);
    const day = newDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    newDate.setDate(newDate.getDate() - day);
    return newDate;
  };

  // Get array of dates for the week
  const getWeekDates = () => {
    const startOfWeek = getStartOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      // Get start and end dates for the week
      const startOfWeek = getStartOfWeek(selectedDate);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startDateStr = startOfWeek.toISOString().split("T")[0];
      const endDateStr = endOfWeek.toISOString().split("T")[0];

      // Fetch tasks for the entire week
      const response = await fetch(
        `${config.apiUrl}/tasks.php?startDate=${startDateStr}&endDate=${endDateStr}&userId=${user.id}`
      );
      const data = await response.json();

      if (response.ok) {
        const formattedTasks = data.map((task) => {
          const [hours, minutes] = task.formatted_time.split(":");
          const minutesSinceMidnight =
            Number.parseInt(hours) * 60 + Number.parseInt(minutes);
          const taskDate = new Date(task.task_date);

          return {
            id: task.task_id,
            title: task.task_Title,
            category: task.task_tags,
            priority: task.task_priority,
            duration: Number.parseInt(task.task_duration),
            startMinute: minutesSinceMidnight,
            endMinute:
              minutesSinceMidnight + Number.parseInt(task.task_duration),
            date: taskDate,
          };
        });
        setTasks(formattedTasks);
      } else {
        throw new Error(data.message || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedDate]); //This line was already correct.  No changes needed based on the provided updates.

  // Create time slots for all 24 hours
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i < 12 ? `${i || 12}:00 AM` : `${i - 12 || 12}:00 PM`;
    return hour;
  });

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
    ];

    const startMonth = months[weekDates[0].getMonth()];
    const endMonth = months[weekDates[6].getMonth()];
    const startYear = weekDates[0].getFullYear();
    const endYear = weekDates[6].getFullYear();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
      return `${startMonth} - ${endMonth} ${startYear}`;
    } else {
      return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    }
  };

  const handleAddTask = () => {
    setIsModalOpen(true);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getTaskColor = (priority) => {
    const colors = {
      high: "bg-red-300",
      medium: "bg-yellow-200",
      low: "bg-green-300",
      default: "bg-gray-200",
    };
    return colors[priority] || colors.default;
  };

  // Get tasks for a specific day
  const getTasksForDay = (date) => {
    return tasks.filter(
      (task) =>
        date.getDate() === task.date.getDate() &&
        date.getMonth() === task.date.getMonth() &&
        date.getFullYear() === task.date.getFullYear()
    );
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Calculate current time position for the time indicator
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return ((hours * 60 + minutes) / 1440) * 100;
  };

  // Check if we should show the current time indicator for a specific day
  const shouldShowCurrentTimeForDay = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <React.Fragment>
      <div className="flex h-screen w-full">
        {/* Sidebar - Identical to DayView.jsx */}
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
              <h1 className="text-4xl font-bold">{formatMonthYear()}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousWeek}
                  className="p-2 hover:text-[#9706e9] transition-colors duration-200 rounded-full hover:bg-purple-50"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNextWeek}
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
              onClick={() => setViewMode("Day")}
              className={`px-4 py-2 rounded-l font-semibold ${
                viewMode === "Day"
                  ? "bg-[#9706e9] text-white"
                  : "bg-[#9706e9]/70 text-white hover:bg-[#9706e9]"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode("Week")}
              className={`px-4 py-2 border-l border-r border-purple-800 font-semibold ${
                viewMode === "Week"
                  ? "bg-[#9706e9] text-white"
                  : "bg-[#9706e9]/70 text-white hover:bg-[#9706e9]"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("Month")}
              className={`px-4 py-2 rounded-r font-semibold ${
                viewMode === "Month"
                  ? "bg-[#9706e9] text-white"
                  : "bg-[#9706e9]/70 text-white hover:bg-[#9706e9]"
              }`}
            >
              Month
            </button>
          </div>

          {/* Week Calendar Grid */}
          <div className="bg-white rounded-lg shadow-md">
            {/* Days of the week header */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
              <div className="p-4 border-r"></div>
              {weekDates.map((date, index) => {
                const dayNames = [
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ];
                const isCurrentDay = isToday(date);

                return (
                  <div
                    key={index}
                    className={`p-4 text-center border-r ${
                      isCurrentDay ? "bg-purple-50" : ""
                    }`}
                  >
                    <div className="font-medium">{dayNames[date.getDay()]}</div>
                    <div
                      className={`text-2xl ${
                        isCurrentDay ? "text-[#9706e9] font-bold" : ""
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time slots and events */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="grid grid-cols-8 border-b">
                {/* Time label */}
                <div className="p-4 border-r text-right text-sm text-gray-500 sticky left-0 bg-white">
                  {timeSlot}
                </div>

                {/* Day columns */}
                {weekDates.map((date, dayIndex) => {
                  const tasksForThisDay = getTasksForDay(date);
                  const tasksAtThisTime = tasksForThisDay.filter((task) => {
                    const timeHour = Number.parseInt(timeSlot.split(":")[0]);
                    const isPM = timeSlot.includes("PM");
                    const hour24 =
                      timeHour === 12 && !isPM
                        ? 0
                        : timeHour === 12 && isPM
                        ? 12
                        : isPM
                        ? timeHour + 12
                        : timeHour;
                    const timeMinutes = hour24 * 60;

                    return (
                      task.startMinute <= timeMinutes &&
                      task.endMinute > timeMinutes
                    );
                  });

                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r relative min-h-[80px] ${
                        isToday(date) ? "bg-purple-50" : ""
                      }`}
                    >
                      {/* Current time indicator */}
                      {shouldShowCurrentTimeForDay(date) &&
                        timeIndex === currentTime.getHours() && (
                          <div
                            className="absolute left-0 w-full border-t-2 border-red-500 z-10"
                            style={{
                              top: `${(currentTime.getMinutes() / 60) * 100}%`,
                            }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                        )}

                      {tasksAtThisTime.map((task, taskIndex) => (
                        <div
                          key={taskIndex}
                          className={`${getTaskColor(
                            task.priority
                          )} p-2 rounded-md mb-1 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                        >
                          <div className="font-medium text-sm truncate">
                            {task.title}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {task.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
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

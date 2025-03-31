"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  LogOut,
  PlusCircle,
  Menu,
} from "lucide-react";
import CreateTaskForm from "./CreateTaskModal";
import TaskDetailView from "./TaskDetailsModal";

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

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
        <h1 className="text-2xl font-bold mb-6">Hello, User!</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Level & Achievements Card */}
          <div className="bg-[#e5cef2] rounded p-6 flex flex-col items-center">
            <h2 className="text-lg font-medium mb-4">
              Your Level & Achievements
            </h2>

            <div className="w-full text-center mb-2">Level: 0</div>

            <div className="w-full h-2 bg-[#d3d3d3] rounded-full mb-6">
              <div className="h-full bg-[#9706e9] rounded-full w-[0%]"></div>
            </div>

            <a
              href="#/achievements"
              className="mb-4 text-[#9706e9] hover:text-[#8005cc] cursor-pointer transition-colors duration-200"
            >
              Total Achievements: 0
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
        <div className="bg-[#d3d3d3] rounded p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Task Checklist</h2>
            <button
              className="bg-[#9706e9] text-white p-2 rounded-full hover:bg-[#8005cc] transition-all duration-200"
              onClick={handleAddTask}
            >
              <PlusCircle size={20} />
            </button>
          </div>

          {tasks.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Assignments</h3>
                <div className="space-y-2">
                  {tasks
                    .filter((task) => task.category === "assignment")
                    .map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors duration-200"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <input
                          type="checkbox"
                          id={`task-${index}`}
                          className="rounded border-gray-300 text-[#9706e9] focus:ring-[#9706e9]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={`task-${index}`}
                          className="text-sm flex-grow"
                        >
                          {task.title}
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Chores</h3>
                <div className="space-y-2">
                  {tasks
                    .filter((task) => task.category === "chore")
                    .map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors duration-200"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <input
                          type="checkbox"
                          id={`chore-${index}`}
                          className="rounded border-gray-300 text-[#9706e9] focus:ring-[#9706e9]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          htmlFor={`chore-${index}`}
                          className="text-sm flex-grow"
                        >
                          {task.title}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm italic">
              No tasks yet. Click the plus button to add a task.
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      {isModalOpen && (
        <CreateTaskForm
          onClose={() => {
            setIsModalOpen(false);
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
    </div>
  );
}

export default Dashboard;

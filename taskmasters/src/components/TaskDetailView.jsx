"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function TaskDetailView({ taskId, onClose, onTaskUpdated }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    taskName: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    priority: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      const response = await fetch(`${config.apiUrl}/tasks.php?id=${taskId}&userId=${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTask(data);
        setFormData({
          taskName: data.taskName,
          category: data.category,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          priority: data.priority,
        });
      } else {
        setError(data.message || "Failed to fetch task details");
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (isEditing) {
      setFormData({
        taskName: task.taskName,
        category: task.category,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        startTime: task.startTime,
        endTime: task.endTime,
        priority: task.priority,
      });
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) {
        throw new Error("User not logged in");
      }

      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          taskId: taskId,
          userId: user.id,
        }),
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

      const response = await fetch(`${config.apiUrl}/tasks.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
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
        setTask({ ...task, ...formData });
        setIsEditing(false);
        if (onTaskUpdated) onTaskUpdated();
      } else {
        setError(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setError(error.message || "Failed to update task");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">Loading task details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        <h1 className="text-2xl font-semibold text-center mb-6">{isEditing ? "Edit Task" : "Task Details"}</h1>
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
              />
            </div>
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  isEditing ? "focus:outline-none focus:ring-2 focus:ring-[#9706e9]" : "bg-gray-50"
                }`}
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
                    disabled={!isEditing}
                    className={`w-4 h-4 text-[#9706e9] border-gray-300 focus:ring-[#9706e9] ${
                      !isEditing ? "cursor-not-allowed" : ""
                    }`}
                  />
                  <span className="ml-2 text-sm text-gray-700">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-start">
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
                  onClick={handleEdit}
                  className="px-6 py-2 bg-[#9706e9] text-white rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Delete
                </button>
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
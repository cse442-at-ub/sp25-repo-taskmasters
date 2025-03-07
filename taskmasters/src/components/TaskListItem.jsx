"use client";

import { useState } from "react";
import TaskDetailView from "./TaskDetailView";

export default function TaskListItem({ task, onTaskUpdated }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = () => {
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  const getPriorityStyle = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div
        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleViewDetails}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{task.taskName}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(task.priority)}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          <p className="line-clamp-2">{task.description}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">{task.category}</span>
          <span>
            {task.startDate} {task.startTime} - {task.endDate} {task.endTime}
          </span>
        </div>
      </div>

      {showDetails && <TaskDetailView taskId={task.id} onClose={handleCloseDetails} onTaskUpdated={onTaskUpdated} />}
    </>
  );
} 
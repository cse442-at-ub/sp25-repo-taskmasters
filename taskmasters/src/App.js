import React from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LandingPage from './components/LandingPage';
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
import DayView from "./components/DayView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import AvatarCustomization from "./components/AvatarCustomization";
import Achievements from "./components/Achievements";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <DayView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/week-view"
          element={
            <ProtectedRoute>
              <WeekView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/month-view"
          element={
            <ProtectedRoute>
              <MonthView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avatar-customization"
          element={
            <ProtectedRoute>
              <AvatarCustomization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-task"
          element={
            <ProtectedRoute>
              <div>Create Task Coming Soon</div>
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
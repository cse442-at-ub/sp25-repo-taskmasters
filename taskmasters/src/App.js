import React from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import Dashboard from './components/Dashboard';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import AvatarCustomization from './components/AvatarCustomization';
import Achievements from './components/Achievements';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <DayView />
          </ProtectedRoute>
        } />
        <Route path="/week-view" element={
          <ProtectedRoute>
            <WeekView />
          </ProtectedRoute>
        } />
        <Route path="/month-view" element={

          <ProtectedRoute>
            <MonthView />
          </ProtectedRoute>
        } />
        <Route path="/avatar-customization" element={
          <ProtectedRoute>
            <AvatarCustomization />
          </ProtectedRoute>
        } />
        <Route path="/achievements" element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        } />
        <Route path="/create-task" element={
          <ProtectedRoute>
            <div>Create Task Coming Soon</div>
          </ProtectedRoute>
        } />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

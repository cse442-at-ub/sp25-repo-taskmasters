import React from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DayView from './components/DayView';
import WeekView from './components/WeekView';
import './index.css';
import MonthView from './components/MonthView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DayView />} />
        <Route path="/calendar" element={<DayView />} />
        <Route path="/calendar-week" element={<WeekView />} />
        <Route path="/avatar" element={<div>Avatar Customization Coming Soon</div>} />
        <Route path="/achievements" element={<div>Achievements Coming Soon</div>} />
        <Route path="/create-task" element={<div>Create Task Coming Soon</div>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/calendar-month" element ={<MonthView/>}/>
      </Routes>
    </Router>
  );
}

export default App;
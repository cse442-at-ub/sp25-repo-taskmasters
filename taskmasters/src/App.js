import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import DayView from './components/DayView';
import RegisterPage from './components/RegisterPage';
import CreateTaskForm from './components/CreateTaskForm';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Change back to login as default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dayview" element={<DayView />} />
        <Route path="/create-task" element={<CreateTaskForm />} />
      </Routes>
    </Router>
  );
}

export default App;

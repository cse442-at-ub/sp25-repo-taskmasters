"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    // Note: This is a frontend-only implementation
    // The actual API call will be implemented later
    setTimeout(() => {
      setIsLoading(false);
      setSuccess('If an account exists with this email, you will receive a password reset link.');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#e5cef2] flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Purple circle background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9706e9] rounded-full -z-10" />

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-[#9706e9] p-3 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">TaskMasters</h1>
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-[#717171]">Enter your email to receive a reset link</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-500 text-center">{error}</div>}
            {success && <div className="text-green-500 text-center">{success}</div>}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !validateEmail(email)}
              className="w-full bg-[#9706e9] text-white py-2 px-4 rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending reset link..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#9706e9] hover:underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 
"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Settings } from "lucide-react";
import config from '../config';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage or context
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to dashboard or home page
                window.location.href = '#/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-[#e5cef2] flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl">
        {/* Purple circle background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#9706e9] rounded-full -z-10" />

        {/* Main content */}
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 grid md:grid-cols-2 gap-8">
          {/* Left side with illustration */}
          <div className="hidden md:flex items-center justify-center">
            <img
              src="https://via.placeholder.com/300"
              alt="Login illustration"
              className="w-[300px] h-[300px]"
            />
          </div>

          {/* Right side with form */}
          <div className="w-full max-w-md mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#9706e9] p-3 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Brand */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">TaskMasters</h1>
              <h2 className="text-4xl font-bold mb-2">Log In</h2>
              <p className="text-[#717171]">Get organized with TaskMasters</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <div className="text-red-500 text-center">{error}</div>}

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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={formData.remember}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#9706e9] focus:ring-[#9706e9] border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <a 
                  href="#/forgot-password" 
                  className="text-sm text-[#9706e9] hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#9706e9] text-white py-2 px-4 rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <a
                            href="#/register"
                  className="text-[#9706e9] hover:underline"
                >
                  Register here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right side illustration */}
        <div className="absolute right-0 top-0 -z-10">
          <img
            src="https://via.placeholder.com/200"
            alt="Decorative illustration"
            className="w-[200px] h-[200px]"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

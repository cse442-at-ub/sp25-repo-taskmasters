"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import config from '../config';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });

  // Password validation function
  const validatePassword = (password, confirmPassword) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirmPassword && password !== "" && confirmPassword !== "",
    };
  };

  // Update password checks whenever password or confirmPassword changes
  useEffect(() => {
    const checks = validatePassword(password, confirmPassword);
    setPasswordChecks(checks);
  }, [password, confirmPassword]);

  // Check if all password requirements are met
  const isPasswordValid = () => {
    return Object.values(passwordChecks).every((check) => check);
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Component to display password requirements
  const PasswordRequirement = ({ satisfied, text }) => (
    <div className="flex items-center gap-2">
      {satisfied ? (
        <CheckCircle className="text-green-500" size={16} />
      ) : (
        <XCircle className="text-red-500" size={16} />
      )}
      <span className={satisfied ? "text-green-500" : "text-red-500"}>
        {text}
      </span>
    </div>
  );

  const handleRequestReset = async (e) => {
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
    try {
      const response = await fetch(`${config.apiUrl}/request_password_reset.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('If an account exists with this email, you will receive a password reset link.');
        // Clear the email field after successful submission
        setEmail('');
      } else {
        setError(data.message || 'Failed to request password reset');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`An error occurred: ${err.message}`);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Password and confirm password are required');
      return;
    }

    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/reset_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <h2 className="text-2xl font-bold mb-2">
              {emailParam ? 'Reset Password' : 'Forgot Password'}
            </h2>
            <p className="text-[#717171]">
              {emailParam
                ? 'Enter your new password'
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={emailParam ? handleResetPassword : handleRequestReset}
            className="space-y-6"
          >
            {error && <div className="text-red-500 text-center">{error}</div>}
            {success && <div className="text-green-500 text-center">{success}</div>}

            {!emailParam ? (
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
            ) : (
              <>
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
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                
                {/* Password requirements */}
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Password Requirements:
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <PasswordRequirement
                      satisfied={passwordChecks.length}
                      text="At least 8 characters long"
                    />
                    <PasswordRequirement
                      satisfied={passwordChecks.uppercase}
                      text="Contains uppercase letter"
                    />
                    <PasswordRequirement
                      satisfied={passwordChecks.lowercase}
                      text="Contains lowercase letter"
                    />
                    <PasswordRequirement
                      satisfied={passwordChecks.number}
                      text="Contains number"
                    />
                    <PasswordRequirement
                      satisfied={passwordChecks.special}
                      text="Contains special character"
                    />
                    <PasswordRequirement
                      satisfied={passwordChecks.match}
                      text="Passwords match"
                    />
                  </div>
                </div>
              </>
            )}

          <button
            type="submit"
            disabled={isLoading || (!emailParam && (!email || !validateEmail(email))) || (emailParam && !isPasswordValid())}
            className="w-full bg-[#9706e9] text-white py-2 px-4 rounded-md hover:bg-[#8005cc] focus:outline-none focus:ring-2 focus:ring-[#9706e9] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isLoading
                ? emailParam
                  ? 'Resetting password...'
                  : 'Sending reset link...'
                : emailParam
                ? 'Reset Password'
                : 'Send Reset Link'}
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

"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Settings, CheckCircle, XCircle } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });

  const validatePassword = (password) => {
    setPasswordChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === formData.confirmPassword,
    });
  };

  useEffect(() => {
    validatePassword(formData.password);
  }, [formData.password]); //Removed formData.confirmPassword

  const isPasswordValid = () => {
    return Object.values(passwordChecks).every((check) => check);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isPasswordValid()) {
      newErrors.password = "Password does not meet requirements";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      // Add your registration logic here
      console.log("Registration data:", formData);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const PasswordRequirement = ({ satisfied, text }) => (
    <div className="d-flex align-items-center gap-2">
      {satisfied ? (
        <CheckCircle className="text-success" size={16} />
      ) : (
        <XCircle className="text-danger" size={16} />
      )}
      <span className={satisfied ? "text-success" : "text-danger"}>{text}</span>
    </div>
  );

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: "#e5cef2" }}
    >
      <div className="position-relative w-100" style={{ maxWidth: "500px" }}>
        {/* Purple circle background */}
        <div
          className="position-absolute start-0 top-50 translate-middle-y rounded-circle"
          style={{
            width: "400px",
            height: "400px",
            background: "#9706e9",
            zIndex: -1,
            display: "none",
          }}
        />

        {/* Main content */}
        <div className="bg-white rounded-4 shadow-lg p-4 p-md-5">
          <div className="w-100">
            {/* Logo */}
            <div className="d-flex justify-content-center mb-4">
              <div className="p-3 rounded-3" style={{ background: "#9706e9" }}>
                <Settings className="text-white" size={24} />
              </div>
            </div>

            {/* Brand */}
            <div className="text-center mb-4">
              <h1 className="fs-3 fw-bold mb-2">TaskMasters</h1>
              <h2 className="fs-2 fw-bold mb-2">Register</h2>
              <p className="text-secondary">Create your TaskMasters account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="needs-validation">
              <div className="mb-3">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  className={`form-control ${
                    errors.username ? "is-invalid" : ""
                  }`}
                />
                {errors.username && (
                  <div className="invalid-feedback">{errors.username}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-group">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`form-control ${
                      errors.confirmPassword ? "is-invalid" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-light p-3 rounded mb-3 border">
                <h3 className="fs-6 fw-medium text-secondary mb-2">
                  Password Requirements:
                </h3>
                <div className="small">
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
                  {formData.password && formData.confirmPassword && (
                    <PasswordRequirement
                      satisfied={formData.password === formData.confirmPassword}
                      text="Passwords match"
                    />
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="alert alert-danger text-center">
                  {errors.submit}
                </div>
              )}
              {success && (
                <div className="alert alert-success text-center">{success}</div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid()}
                className="btn w-100 text-white mb-3"
                style={{
                  backgroundColor: "#9706e9",
                  opacity: isLoading || !isPasswordValid() ? 0.5 : 1,
                }}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>

              <div className="text-center">
                <p className="text-secondary">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    style={{ color: "#9706e9", textDecoration: "none" }}
                  >
                    Log in
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
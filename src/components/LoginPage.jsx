"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Settings } from "lucide-react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import loginIllustration from "../assets/LoginIllustration.jpeg";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage or context
        localStorage.setItem("user", JSON.stringify(data.user));
        // Redirect to dashboard or home page
        window.location.href = "#/dashboard";
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center py-5"
      style={{ backgroundColor: "#e5cef2" }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8}>
            <div className="position-relative bg-white rounded-3 shadow p-4 p-md-5">
              <Row className="g-4">
                {/* Left side with illustration */}
                <Col
                  md={6}
                  className="d-none d-md-flex align-items-center justify-content-center"
                >
                  <img
                    src={loginIllustration}
                    alt="Login illustration"
                    className="img-fluid"
                    style={{ maxWidth: "300px", height: "auto" }}
                  />
                </Col>

                {/* Right side with form */}
                <Col xs={12} md={6}>
                  {/* Logo */}
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-block p-3 rounded-3"
                      style={{ backgroundColor: "#9706e9" }}
                    >
                      <Settings
                        className="text-white"
                        style={{ width: "24px", height: "24px" }}
                      />
                    </div>
                  </div>

                  {/* Brand */}
                  <div className="text-center mb-4">
                    <h1 className="h3 fw-bold mb-2">TaskMasters</h1>
                    <h2 className="h2 fw-bold mb-2">Log In</h2>
                    <p className="text-muted">Get organized with TaskMasters</p>
                  </div>

                  {/* Form */}
                  <Form onSubmit={handleSubmit} className="mt-4">
                    {error && (
                      <Alert variant="danger" className="text-center">
                        {error}
                      </Alert>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          isInvalid={!!errors.password}
                        />
                        <Button
                          variant="link"
                          onClick={() => setShowPassword(!showPassword)}
                          className="position-absolute end-0 top-50 translate-middle-y text-muted"
                          style={{ padding: "0.375rem" }}
                        >
                          {showPassword ? (
                            <EyeOff style={{ width: "16px", height: "16px" }} />
                          ) : (
                            <Eye style={{ width: "16px", height: "16px" }} />
                          )}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.password}
                        </Form.Control.Feedback>
                      </div>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Form.Check
                        type="checkbox"
                        id="remember"
                        name="remember"
                        checked={formData.remember}
                        onChange={handleChange}
                        label="Remember me"
                      />
                      <a
                        href="#/forgot-password"
                        className="text-decoration-none"
                        style={{ color: "#9706e9" }}
                      >
                        Forgot password?
                      </a>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-100 mb-3"
                      style={{
                        backgroundColor: "#9706e9",
                        borderColor: "#9706e9",
                      }}
                    >
                      {isLoading ? "Logging in..." : "Log in"}
                    </Button>

                    <div className="text-center">
                      <p className="text-muted">
                        Don't have an account?{" "}
                        <a
                          href="#/register"
                          className="text-decoration-none"
                          style={{ color: "#9706e9" }}
                        >
                          Register here
                        </a>
                      </p>
                    </div>
                  </Form>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from 'react';
import config from '../config';
import { CheckCircle, XCircle } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });

    const validatePassword = (password) => {
        setPasswordChecks({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        });
    };

    const isPasswordValid = () => {
        return Object.values(passwordChecks).every(check => check);
    };

    const isFormValid = () => {
        return (
            formData.username &&
            formData.email &&
            /\S+@\S+\.\S+/.test(formData.email) &&
            isPasswordValid() &&
            formData.password === formData.confirmPassword
        );
    };

    useEffect(() => {
        validatePassword(formData.password);
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (name === 'password') {
            validatePassword(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid()) {
            setError('Please fix all validation errors before submitting');
            return;
        }

        try {
            const response = await fetch(`${config.apiUrl}/register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: 'cors',
                credentials: 'omit',
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '#/login';
                }, 2000);
                setError('');
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            } else {
                setError(data.message || 'Registration failed');
                setSuccess('');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            setSuccess('');
        }
    };

    const PasswordRequirement = ({ satisfied, text }) => (
        <div className="flex items-center space-x-2">
            {satisfied ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
                <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={satisfied ? "text-green-600" : "text-red-600"}>
                {text}
            </span>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-center">{error}</div>}
                    {success && <div className="text-green-500 text-center">{success}</div>}
                    
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-md border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h3>
                        <div className="space-y-2 text-sm">
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

                    <div>
                        <button
                            type="submit"
                            disabled={!isFormValid()}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white 
                                ${isFormValid() 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                                    : 'bg-gray-400 cursor-not-allowed'}`}
                        >
                            Register
                        </button>
                    </div>
                </form>
                <div className="text-center mt-4">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <a
                            href="#/login"
                            className="text-[#9706e9] hover:underline"
                        >
                            Login here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

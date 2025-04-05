import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add a debounce mechanism to prevent rapid authentication checks
  const [authCheckTimeout, setAuthCheckTimeout] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user && user.id) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsAuthenticated(false);
          // Don't immediately remove user data on parse error
          // This prevents logout during quick page transitions
          // Instead, we'll only clear if it's consistently invalid
          if (authCheckTimeout) {
            clearTimeout(authCheckTimeout);
          }
          
          const timeout = setTimeout(() => {
            const retryUserData = localStorage.getItem('user');
            try {
              JSON.parse(retryUserData);
            } catch (e) {
              // Only remove if it's still invalid after delay
              localStorage.removeItem('user');
            }
          }, 2000);
          
          setAuthCheckTimeout(timeout);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
    
    // Clean up timeout on unmount
    return () => {
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, [authCheckTimeout]);

  if (isLoading) {
    // You could show a loading spinner here
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

/**
 * API utility functions for making secure requests
 */

import config from "../config";

/**
 * Make a secure API request with CSRF token
 *
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Fetch promise
 */
export const apiRequest = async (url, options = {}) => {
  // Get CSRF token from localStorage
  const csrfToken = localStorage.getItem("csrf_token");

  // Set default headers
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  // Add CSRF token if available
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "omit", // Changed from 'include' to 'omit' to match the existing login implementation
    mode: "cors",
  });

  // Handle unauthorized responses (e.g., expired session)
  if (response.status === 401) {
    // Add debounce mechanism to prevent immediate logout on quick page transitions
    // Only redirect to login if we consistently get 401 errors

    // Store the timestamp of the 401 error
    const currentTime = new Date().getTime();
    const lastUnauthorizedTime = localStorage.getItem("last_unauthorized_time");

    if (lastUnauthorizedTime) {
      // If we've had a 401 error recently (within 2 seconds), then logout
      if (currentTime - parseInt(lastUnauthorizedTime) > 2000) {
        // Clear user data and redirect to login
        localStorage.removeItem("user");
        localStorage.removeItem("csrf_token");
        localStorage.removeItem("last_unauthorized_time");
        window.location.href = "#/login";
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // First 401 error, store the timestamp
      localStorage.setItem("last_unauthorized_time", currentTime.toString());

      // Set a timeout to clear this timestamp if no further 401s occur
      setTimeout(() => {
        localStorage.removeItem("last_unauthorized_time");
      }, 5000);
    }

    // Still throw an error so the caller knows the request failed
    throw new Error("Unauthorized request");
  }

  return response;
};

/**
 * Make a GET request to the API
 *
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} params - URL parameters
 * @returns {Promise} - Response promise
 */
export const get = async (endpoint, params = {}) => {
  // Build URL with query parameters
  const url = new URL(`${config.apiUrl}/${endpoint}`);
  Object.keys(params).forEach((key) =>
    url.searchParams.append(key, params[key])
  );

  return apiRequest(url.toString(), { method: "GET" });
};

/**
 * Make a POST request to the API
 *
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @returns {Promise} - Response promise
 */
export const post = async (endpoint, data = {}) => {
  return apiRequest(`${config.apiUrl}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Make a PUT request to the API
 *
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @returns {Promise} - Response promise
 */
export const put = async (endpoint, data = {}) => {
  return apiRequest(`${config.apiUrl}/${endpoint}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Make a DELETE request to the API
 *
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data (optional)
 * @returns {Promise} - Response promise
 */
export const del = async (endpoint, data = null) => {
  const options = { method: "DELETE" };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return apiRequest(`${config.apiUrl}/${endpoint}`, options);
};

/**
 * Import events from an ICS file
 *
 * @param {Array} events - Array of parsed events from ICS file
 * @returns {Promise} - Response promise
 */
export const importICSEvents = async (events) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    throw new Error("User not logged in");
  }

  return post("ics-import.php", {
    userId: user.id,
    events,
  });
};

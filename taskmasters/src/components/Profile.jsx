"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  LogOut,
  Menu,
  ArrowLeft,
  UserCircle,
  Mail,
  Lock,
  Save,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import config from "../config";
import { get, post } from "../utils/api";
import avatarBackground from "../assets/AvatarBackground.png";

// Import avatar images
import level1Avatar from "../assets/Level1Avatar.png";
import level2Avatar from "../assets/Level2Avatar.png";
import level3Avatar from "../assets/Level3Avatar.png";
import level4Avatar from "../assets/Level4Avatar.png";
import level5Avatar from "../assets/Level5Avatar.png";
import level6Avatar from "../assets/Level6Avatar.png";
import level7Avatar from "../assets/Level7Avatar.png";
import level8Avatar from "../assets/Level8Avatar.png";
import level9Avatar from "../assets/Level9Avatar.png";
import level10Avatar from "../assets/Level10Avatar.png";
// Import TaskMaster avatar which serves as TaskApprentice (default) avatar
import taskMaster from "../assets/TaskMaster.png";

export default function Profile() {
  const navigate = useNavigate();
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    currentAvatar: null,
    level: 1,
    totalPoints: 0,
    purchasedAvatars: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updateData, setUpdateData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar mapping - matching the Dashboard.jsx approach
  const avatarImages = {
    "Level1Avatar.png": level1Avatar,
    "Level2Avatar.png": level2Avatar,
    "Level3Avatar.png": level3Avatar,
    "Level4Avatar.png": level4Avatar,
    "Level5Avatar.png": level5Avatar,
    "Level6Avatar.png": level6Avatar,
    "Level7Avatar.png": level7Avatar,
    "Level8Avatar.png": level8Avatar,
    "Level9Avatar.png": level9Avatar,
    "Level10Avatar.png": level10Avatar,
    "TaskMaster.png": taskMaster,
  };

  // Helper function to get avatar image - matches Dashboard.jsx approach
  const getAvatarImage = (filename) => {
    if (!filename) return null;
    // Extract just the filename if it's a path
    const baseName = filename.split("/").pop();
    return avatarImages[baseName] || taskMaster;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        // Get user data from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.id) {
          console.warn("No valid user data found in localStorage");
          navigate("/login");
          return;
        }

        console.log("User data from localStorage:", storedUser);
        setUserData((prevData) => ({
          ...prevData,
          username: storedUser.username || "",
          email: storedUser.email || "",
        }));

        setUpdateData((prevData) => ({
          ...prevData,
          email: storedUser.email || "",
        }));

        // Fetch user level and points from dashboard API
        try {
          const dashboardResponse = await get(
            `dashboard.php?userId=${storedUser.id}`
          );
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            console.log("Dashboard API Response:", dashboardData);

            if (dashboardData.level) {
              const level = dashboardData.level.level || 1;
              const points = dashboardData.level.totalPoints || 0;

              console.log("Setting user level from dashboard to:", level);
              console.log("Setting user points from dashboard to:", points);

              setUserData((prevData) => ({
                ...prevData,
                level: level,
                totalPoints: points,
              }));

              // Update localStorage with current level and points for better persistence
              const updatedUser = {
                ...storedUser,
                level: level,
                points: points,
              };
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          }
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }

        // Fetch user avatar
        try {
          const avatarResponse = await get(
            `avatar.php?userId=${storedUser.id}`
          );
          if (avatarResponse.ok) {
            const avatarData = await avatarResponse.json();
            console.log("Avatar API Response:", avatarData);

            if (
              avatarData.currentAvatar &&
              avatarData.currentAvatar.image_url
            ) {
              const avatarImg = getAvatarImage(
                avatarData.currentAvatar.image_url
              );
              console.log("Setting avatar from avatar API:", avatarImg);

              setUserData((prevData) => ({
                ...prevData,
                currentAvatar: avatarImg,
              }));
            }

            // Update points from avatar API if dashboard didn't provide them
            if (avatarData.totalPoints !== undefined) {
              setUserData((prevData) => {
                // Only update if we don't have points yet
                if (prevData.totalPoints === 0) {
                  console.log(
                    "Setting points from avatar API:",
                    avatarData.totalPoints
                  );
                  // Update localStorage as well
                  const updatedUser = {
                    ...storedUser,
                    points: avatarData.totalPoints,
                  };
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  return {
                    ...prevData,
                    totalPoints: avatarData.totalPoints,
                  };
                }
                return prevData;
              });
            }
          }
        } catch (error) {
          console.error("Error fetching avatar data:", error);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // Add event listener to refresh data when window gets focus
    // This ensures updates when returning from other pages
    const handleFocus = () => {
      console.log("Window focused, refreshing profile data");
      fetchUserData();
    };

    window.addEventListener("focus", handleFocus);

    // Clean up event listener
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [navigate]);

  useEffect(() => {
    // Validate password requirements every time the password fields change
    const validatePassword = (password, confirmPassword) => {
      return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        match:
          password === confirmPassword &&
          password !== "" &&
          confirmPassword !== "",
      };
    };

    const checks = validatePassword(
      updateData.newPassword,
      updateData.confirmPassword
    );
    setPasswordChecks(checks);
  }, [updateData.newPassword, updateData.confirmPassword]);

  // Check if all password requirements are met
  const isPasswordValid = () => {
    // If no new password is entered, we don't need to validate (user is only updating email)
    if (!updateData.newPassword) return true;

    return Object.values(passwordChecks).every((check) => check);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData({
      ...updateData,
      [name]: value,
    });

    // Add real-time email validation similar to RegisterPage
    if (name === "email") {
      if (!value) {
        setErrorMessage("Email is required");
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        setErrorMessage(
          "Please enter a valid email address (e.g., user@example.com)"
        );
      } else {
        setErrorMessage("");
      }
    }
  };

  const handleSaveChanges = async () => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      // Validate inputs
      if (!updateData.email) {
        setErrorMessage("Email is required");
        return;
      } else if (!/\S+@\S+\.\S+/.test(updateData.email)) {
        setErrorMessage(
          "Please enter a valid email address (e.g., user@example.com)"
        );
        return;
      }

      // Password validation only if user is trying to change password
      if (updateData.newPassword) {
        if (!updateData.currentPassword) {
          setErrorMessage("Current password is required to set a new password");
          return;
        }

        if (!isPasswordValid()) {
          setErrorMessage("Password does not meet the requirements");
          return;
        }
      }

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser || !storedUser.id) {
        setErrorMessage("User information not found. Please log in again.");
        return;
      }

      // Prepare data for API
      const updatePayload = {
        userId: storedUser.id,
        email: updateData.email,
      };

      // Only include password fields if user is updating password
      if (updateData.newPassword) {
        updatePayload.currentPassword = updateData.currentPassword;
        updatePayload.newPassword = updateData.newPassword;
      }

      // Call update profile API
      const response = await post("update_profile.php", updatePayload);

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          setSuccessMessage(result.message || "Profile updated successfully!");

          // Update local storage with new email
          const updatedUser = {
            ...storedUser,
            email: updateData.email,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          // Update the userData state
          setUserData({
            ...userData,
            email: updateData.email,
          });

          // Clear password fields
          setUpdateData({
            ...updateData,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          setIsEditing(false);
        } else {
          setErrorMessage(result.message || "Failed to update profile");
        }
      } else {
        setErrorMessage("Failed to connect to the server. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  // Component to display password requirements
  const PasswordRequirement = ({ satisfied, text }) => (
    <div className="flex items-center gap-2">
      {satisfied ? (
        <CheckCircle className="text-green-500" size={16} />
      ) : (
        <XCircle className="text-red-500" size={16} />
      )}
      <span className={satisfied ? "text-green-500" : "text-red-500 text-sm"}>
        {text}
      </span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9706e9]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg flex flex-col ${
          isNavbarCollapsed ? "w-full md:w-16" : "w-full md:w-64"
        } transition-all duration-300 min-h-[80px] md:min-h-screen`}
      >
        {/* Logo Section */}
        <div className="p-4 md:p-6 bg-[#9706e9] text-white flex justify-between items-center">
          {!isNavbarCollapsed && (
            <h1 className="text-xl md:text-2xl font-bold tracking-wider">
              TaskMasters
            </h1>
          )}
          <button
            onClick={() => setIsNavbarCollapsed(!isNavbarCollapsed)}
            className="text-white hover:bg-purple-800 p-1 rounded-md transition-all duration-200"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`${
            isNavbarCollapsed
              ? "hidden md:flex md:flex-col md:items-center"
              : "block"
          } flex-1 p-4`}
        >
          <div className="flex flex-col md:space-y-2">
            <a
              href="#/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              title="Dashboard"
            >
              <LayoutDashboard size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Dashboard</span>}
            </a>
            <a
              href="#/calendar"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              title="Calendar"
            >
              <Calendar size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Calendar</span>}
            </a>
            <a
              href="#/avatar-customization"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              title="Avatar Customization"
            >
              <User size={20} />
              {!isNavbarCollapsed && (
                <span className="text-lg">Avatar Customization</span>
              )}
            </a>
            <a
              href="#/achievements"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#9706e9] hover:text-white rounded-lg transition-all duration-200"
              title="Achievements"
            >
              <Trophy size={20} />
              {!isNavbarCollapsed && (
                <span className="text-lg">Achievements</span>
              )}
            </a>
            <a
              href="#/profile"
              className="flex items-center gap-3 px-4 py-3 bg-[#9706e9] text-white rounded-lg transition-all duration-200"
              title="Profile"
            >
              <UserCircle size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Profile</span>}
            </a>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t">
          <a
            href="#/login"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-100 hover:text-red-500 rounded-lg transition-all duration-200"
            title="Logout"
          >
            <LogOut size={20} />
            {!isNavbarCollapsed && <span className="text-lg">Logout</span>}
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 overflow-auto"
        style={{
          backgroundColor: "#000000",
          backgroundImage: `url(${avatarBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
        }}
      >
        {/* Header */}
        <div className="p-6 flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>

        {/* Profile Content */}
        <div className="max-w-2xl mx-auto bg-black bg-opacity-50 backdrop-blur-md rounded-xl shadow-lg p-6 md:p-8 m-4">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="w-32 h-32 rounded-full bg-[#9706e9] p-2 overflow-hidden border-4 border-[#9706e9] shadow-lg">
              {userData.currentAvatar ? (
                <img
                  src={userData.currentAvatar}
                  alt="User Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-purple-200 flex items-center justify-center">
                  <User size={48} className="text-[#9706e9]" />
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white">
                {userData.username}
              </h2>
              <p className="text-gray-300">{userData.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="px-3 py-1 bg-[#9706e9] text-white rounded-full text-sm font-semibold">
                  Level {userData.level}
                </div>
                <div className="px-3 py-1 bg-purple-900 text-white rounded-full text-sm font-semibold">
                  {userData.totalPoints} points
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-[#9706e9]">
              <h3 className="text-lg font-semibold text-white mb-2">
                Current Level
              </h3>
              <p className="text-3xl font-bold text-[#9706e9]">
                {userData.level}
              </p>
            </div>
            <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-[#9706e9]">
              <h3 className="text-lg font-semibold text-white mb-2">
                Total Points
              </h3>
              <p className="text-3xl font-bold text-[#9706e9]">
                {userData.totalPoints}
              </p>
            </div>
          </div>

          {/* Update Profile Section */}
          <div className="bg-black bg-opacity-50 p-4 rounded-lg border border-[#9706e9] mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Account Settings
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 bg-[#9706e9] text-white rounded-lg text-sm font-semibold hover:bg-purple-800 transition-all"
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-50 text-white rounded-lg">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-900 bg-opacity-50 text-white rounded-lg">
                {successMessage}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={updateData.email}
                      onChange={handleInputChange}
                      className="pl-10 w-full bg-black bg-opacity-50 border border-purple-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                      placeholder="Enter your email"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail
                        size={16}
                        className={`text-gray-400 transition-opacity duration-200 ${
                          updateData.email ? "opacity-0" : "opacity-50"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Current Password (required to change password)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={updateData.currentPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 w-full bg-black bg-opacity-50 border border-purple-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                      placeholder="Enter current password"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock
                        size={16}
                        className={`text-gray-400 transition-opacity duration-200 ${
                          updateData.currentPassword
                            ? "opacity-0"
                            : "opacity-50"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white z-10"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={updateData.newPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 w-full bg-black bg-opacity-50 border border-purple-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                      placeholder="Enter new password"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock
                        size={16}
                        className={`text-gray-400 transition-opacity duration-200 ${
                          updateData.newPassword ? "opacity-0" : "opacity-50"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white z-10"
                    >
                      {showNewPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={updateData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 w-full bg-black bg-opacity-50 border border-purple-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#9706e9]"
                      placeholder="Confirm new password"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock
                        size={16}
                        className={`text-gray-400 transition-opacity duration-200 ${
                          updateData.confirmPassword
                            ? "opacity-0"
                            : "opacity-50"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white z-10"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirements section - show only when user is typing a new password */}
                {updateData.newPassword && (
                  <div className="bg-black bg-opacity-50 p-3 rounded-lg border border-purple-700 mt-2">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      Password Requirements:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      <PasswordRequirement
                        satisfied={passwordChecks.length}
                        text="At least 8 characters"
                      />
                      <PasswordRequirement
                        satisfied={passwordChecks.uppercase}
                        text="Uppercase letter"
                      />
                      <PasswordRequirement
                        satisfied={passwordChecks.lowercase}
                        text="Lowercase letter"
                      />
                      <PasswordRequirement
                        satisfied={passwordChecks.number}
                        text="Number"
                      />
                      <PasswordRequirement
                        satisfied={passwordChecks.special}
                        text="Special character"
                      />
                      <PasswordRequirement
                        satisfied={passwordChecks.match}
                        text="Passwords match"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveChanges}
                  disabled={!isPasswordValid()}
                  className={`w-full flex items-center justify-center gap-2 bg-[#9706e9] text-white py-2 px-4 rounded-lg font-medium transition-all ${
                    !isPasswordValid() && updateData.newPassword
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-purple-800"
                  }`}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-[#9706e9]" />
                  <span className="text-white">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-[#9706e9]" />
                  <span className="text-white">••••••••</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

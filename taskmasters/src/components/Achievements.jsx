"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  LogOut,
  Menu,
  X,
  Check,
  Lock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import avatarBackground from "../assets/AvatarBackground.png";
import level1Avatar from "../assets/Level1Avatar.png";

// Import achievement images
import firstTaskImg from "../assets/FirstTask.png";
import taskStreakImg from "../assets/TaskStreak.png";
import earlyBirdImg from "../assets/EarlyBird.png";
import nightOwlImg from "../assets/NightOwl.png";
import taskMasterImg from "../assets/TaskMaster.png";
import perfectWeekImg from "../assets/PerfectWeek.png";
import bigSpenderImg from "../assets/BigSpender.png";
import timeManagerImg from "../assets/TimeManager.png";
import taskExplorerImg from "../assets/TaskExplorer.png";
import achievementHunterImg from "../assets/AchievementHunter.png";

export default function Achievements() {
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [previewAchievement, setPreviewAchievement] = useState(null);
  const [userPoints, setUserPoints] = useState(10000);
  const [currentAvatar, setCurrentAvatar] = useState({
    name: "Novice Explorer",
    image: level1Avatar,
  });
  const [achievementNotification, setAchievementNotification] = useState(null);

  // Achievement data with image references
  const achievements = [
    {
      id: 1,
      name: "First Task",
      description: "Complete your first task",
      points: 100,
      isUnlocked: false,
      unlockDate: null,
      image: firstTaskImg,
    },
    {
      id: 2,
      name: "Task Streak",
      description: "Complete tasks for 7 days in a row",
      points: 500,
      isUnlocked: false,
      unlockDate: null,
      image: taskStreakImg,
    },
    {
      id: 3,
      name: "Early Bird",
      description: "Complete 5 tasks before 9 AM",
      points: 300,
      isUnlocked: false,
      unlockDate: null,
      image: earlyBirdImg,
    },
    {
      id: 4,
      name: "Night Owl",
      description: "Complete 5 tasks after 10 PM",
      points: 300,
      isUnlocked: false,
      unlockDate: null,
      image: nightOwlImg,
    },
    {
      id: 5,
      name: "Task Master",
      description: "Complete 50 tasks in total",
      points: 1000,
      isUnlocked: false,
      unlockDate: null,
      image: taskMasterImg,
    },
    {
      id: 6,
      name: "Perfect Week",
      description: "Complete all tasks in a week",
      points: 800,
      isUnlocked: false,
      unlockDate: null,
      image: perfectWeekImg,
    },
    {
      id: 7,
      name: "Big Spender",
      description: "Buy 5 avatars",
      points: 400,
      isUnlocked: false,
      unlockDate: null,
      image: bigSpenderImg,
    },
    {
      id: 8,
      name: "Time Manager",
      description: "Complete 10 tasks on time",
      points: 600,
      isUnlocked: false,
      unlockDate: null,
      image: timeManagerImg,
    },
    {
      id: 9,
      name: "Task Explorer",
      description: "Create tasks in 5 different categories",
      points: 400,
      isUnlocked: false,
      unlockDate: null,
      image: taskExplorerImg,
    },
    {
      id: 10,
      name: "Achievement Hunter",
      description: "Unlock 5 achievements",
      points: 1000,
      isUnlocked: false,
      unlockDate: null,
      image: achievementHunterImg,
    },
  ];

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleAchievementClick = (achievement) => {
    setPreviewAchievement({
      ...achievement,
      fromSection: achievement.isUnlocked ? "unlocked" : "locked",
    });
  };

  const closePreview = () => {
    setPreviewAchievement(null);
  };

  // Function to simulate unlocking an achievement
  const unlockAchievement = (achievement) => {
    if (achievement.isUnlocked) {
      return; // Already unlocked
    }

    // Find the achievement in our array and update it
    const updatedAchievements = achievements.map((a) => {
      if (a.id === achievement.id) {
        return { ...a, isUnlocked: true };
      }
      return a;
    });

    // Update the achievements array
    // In a real app, this would update a state and/or make an API call
    // For this demo, we'll just log it
    console.log("Achievement unlocked:", achievement.name);

    // Award points to the user
    setUserPoints((prevPoints) => prevPoints + achievement.points);

    // Show notification
    setAchievementNotification({
      achievement: achievement,
      timestamp: new Date(),
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setAchievementNotification(null);
    }, 3000);

    // Close the preview
    closePreview();
  };

  // Function to navigate to previous achievement
  const navigateToPreviousAchievement = () => {
    if (!previewAchievement) return;

    // Determine which list we're navigating through
    const isUnlockedSection = previewAchievement.fromSection === "unlocked";
    const relevantAchievements = achievements.filter(
      (a) => a.isUnlocked === isUnlockedSection
    );

    if (relevantAchievements.length <= 1) return; // Nothing to navigate to

    // Find the current index
    const currentIndex = relevantAchievements.findIndex(
      (a) => a.id === previewAchievement.id
    );

    if (currentIndex === -1) return;

    // Calculate the previous index (with wrap-around)
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : relevantAchievements.length - 1;

    // Set the new preview achievement
    setPreviewAchievement({
      ...relevantAchievements[prevIndex],
      fromSection: isUnlockedSection ? "unlocked" : "locked",
    });
  };

  // Function to navigate to next achievement
  const navigateToNextAchievement = () => {
    if (!previewAchievement) return;

    // Determine which list we're navigating through
    const isUnlockedSection = previewAchievement.fromSection === "unlocked";
    const relevantAchievements = achievements.filter(
      (a) => a.isUnlocked === isUnlockedSection
    );

    if (relevantAchievements.length <= 1) return; // Nothing to navigate to

    // Find the current index
    const currentIndex = relevantAchievements.findIndex(
      (a) => a.id === previewAchievement.id
    );

    if (currentIndex === -1) return;

    // Calculate the next index (with wrap-around)
    const nextIndex =
      currentIndex < relevantAchievements.length - 1 ? currentIndex + 1 : 0;

    // Set the new preview achievement
    setPreviewAchievement({
      ...relevantAchievements[nextIndex],
      fromSection: isUnlockedSection ? "unlocked" : "locked",
    });
  };

  // Clean up notification when component unmounts
  useEffect(() => {
    return () => {
      setAchievementNotification(null);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Achievement Unlocked Notification */}
      {achievementNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-md bg-green-500 bg-opacity-90 border border-green-600">
            <div className="flex-shrink-0 bg-white bg-opacity-90 rounded-full p-1">
              <Trophy className="text-green-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">Achievement Unlocked!</p>
              <p className="text-white text-sm opacity-90">
                {achievementNotification.achievement.name} (+
                {achievementNotification.achievement.points} points)
              </p>
            </div>
          </div>
        </div>
      )}

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
              {!isNavbarCollapsed && <span className="text-lg">Avatar Customization</span>}
            </a>
            <a
              href="#/achievements"
              className="flex items-center gap-3 px-4 py-3 bg-[#9706e9] text-white rounded-lg transition-all duration-200"
              title="Achievements"
            >
              <Trophy size={20} />
              {!isNavbarCollapsed && (
                <span className="text-lg">Achievements</span>
              )}
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
        {/* Header with Current Avatar and Points */}
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#330033] p-2 overflow-hidden border-4 border-[#9706e9] shadow-lg shadow-purple-900/50">
              <img
                src={currentAvatar.image}
                alt={currentAvatar.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-5xl font-bold">Achievements</h1>
              <span className="text-sm text-gray-300">
                {currentAvatar.name}
              </span>
            </div>
          </div>
          <div className="px-4 py-2 rounded bg-black bg-opacity-40 border-2 border-[#9706e9] shadow-md shadow-purple-900/50">
            <span className="font-mono font-bold text-white">
              {userPoints}pts
            </span>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="px-6 grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pb-20">
          {/* Unlocked Achievements */}
          <div className="rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Unlocked Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {achievements
                .filter((achievement) => achievement.isUnlocked)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleAchievementClick(achievement)}
                  >
                    <div className="w-full h-36 relative">
                      <img
                        src={achievement.image}
                        alt={achievement.name}
                        className="w-full h-full object-cover rounded-md transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 py-1 text-center">
                        <span className="font-mono font-bold">
                          {achievement.points}pts
                        </span>
                      </div>
                      {/* Show unlock date badge */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs">
                        <span className="text-white">
                          {formatDate(achievement.unlockDate)}
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {achievement.name}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Locked Achievements */}
          <div className="rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Locked Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {achievements
                .filter((achievement) => !achievement.isUnlocked)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleAchievementClick(achievement)}
                  >
                    <div className="w-full h-36 relative">
                      <img
                        src={achievement.image}
                        alt={achievement.name}
                        className="w-full h-full object-cover rounded-md transition-transform duration-200 group-hover:scale-105 brightness-90"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gray-600 py-1 text-center z-20">
                        <span className="font-mono font-bold">
                          {achievement.points}pts
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="bg-black bg-opacity-40 p-2 rounded-full shadow-lg">
                          <Lock size={32} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 z-30">
                      <div className="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        {achievement.name}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Achievement Preview Modal */}
        {previewAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-black bg-opacity-90 rounded-lg shadow-xl border-2 border-[#9706e9] p-6 max-h-[90vh] overflow-y-auto text-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {previewAchievement.name}
                </h2>
                <button
                  className="text-white hover:text-[#9706e9] transition-colors duration-200"
                  onClick={closePreview}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex justify-center items-center my-6 relative">
                {/* Navigation Buttons */}
                <button
                  className="absolute left-0 bg-black bg-opacity-70 p-2 rounded-full border-2 border-[#9706e9] text-white hover:bg-[#9706e9] transition-all duration-200 z-10 transform -translate-x-1/2"
                  onClick={navigateToPreviousAchievement}
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="w-[60vh] h-[60vh] rounded-lg border-4 border-[#9706e9] shadow-xl flex items-center justify-center bg-[#330033] overflow-hidden">
                  <img
                    src={previewAchievement.image}
                    alt={previewAchievement.name}
                    className={`w-full h-full object-contain ${
                      !previewAchievement.isUnlocked ? "brightness-90" : ""
                    }`}
                  />
                  {!previewAchievement.isUnlocked && (
                    <div className="absolute flex items-center justify-center bg-black bg-opacity-50 p-3 rounded-full shadow-lg">
                      <Lock size={80} className="text-white" />
                    </div>
                  )}
                </div>

                <button
                  className="absolute right-0 bg-black bg-opacity-70 p-2 rounded-full border-2 border-[#9706e9] text-white hover:bg-[#9706e9] transition-all duration-200 z-10 transform translate-x-1/2"
                  onClick={navigateToNextAchievement}
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="mt-6 flex flex-col items-center gap-4">
                <p className="text-center text-lg">
                  {previewAchievement.description}
                </p>
                <div
                  className={`${
                    previewAchievement.isUnlocked
                      ? "bg-green-500"
                      : "bg-gray-600"
                  } text-white px-4 py-2 rounded-full font-bold inline-block`}
                >
                  {previewAchievement.isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <Check size={20} />
                      <span>
                        Unlocked on {formatDate(previewAchievement.unlockDate)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock size={20} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
                <span className="text-xl font-bold">
                  {previewAchievement.points} points
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

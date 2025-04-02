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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatarBackground from "../assets/AvatarBackground.png";
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

export default function AvatarCustomization() {
  const navigate = useNavigate();
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [purchaseNotification, setPurchaseNotification] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);
  const [changeNotification, setChangeNotification] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  // Track user points - normally this would come from a backend API
  const [userPoints, setUserPoints] = useState(10000);
  // Track purchased avatars
  const [purchasedAvatars, setPurchasedAvatars] = useState([]);

  const handleAvatarClick = (avatar) => {
    if (avatar.isCurrentAvatar) {
      // When clicking from current avatar section, mark it accordingly
      setPreviewAvatar({
        ...avatar,
        fromCurrentAvatarSection: true,
      });
    } else {
      setPreviewAvatar(avatar);
    }
  };

  const closePreview = () => {
    setPreviewAvatar(null);
  };

  const handlePurchase = (avatar) => {
    // Check if user has enough points
    if (userPoints < avatar.price) {
      // Show error notification
      setErrorNotification({
        message: "Not enough points to purchase this avatar!",
        details: `You need ${avatar.price - userPoints} more points.`,
        timestamp: new Date(),
      });

      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setErrorNotification(null);
      }, 3000);

      return;
    }

    // Purchase logic - deduct points
    setUserPoints((prevPoints) => prevPoints - avatar.price);

    // Add to purchased avatars
    setPurchasedAvatars((prev) => [...prev, avatar.id]);

    // Set as current avatar
    setCurrentAvatar(avatar);

    // Close the preview
    closePreview();

    // Show purchase notification
    setPurchaseNotification({
      avatar: avatar,
      timestamp: new Date(),
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setPurchaseNotification(null);
    }, 3000);
  };

  const handleSelectAvatar = (avatar) => {
    // Set as current avatar
    setCurrentAvatar(avatar);

    // Close the preview
    closePreview();

    // Show change notification
    setChangeNotification({
      avatar: avatar,
      timestamp: new Date(),
    });

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setChangeNotification(null);
    }, 3000);
  };

  // Function to navigate to previous avatar
  const navigateToPreviousAvatar = () => {
    // If we're viewing the current avatar or a purchased avatar in the current avatar context
    if (
      previewAvatar.isCurrentAvatar ||
      previewAvatar.fromCurrentAvatarSection
    ) {
      // Get list of ONLY purchased avatars
      const availableAvatars = avatars.filter((avatar) =>
        isAvatarPurchased(avatar.id)
      );

      if (availableAvatars.length === 0) {
        return; // No purchased avatars, nothing to navigate to
      }

      // Find the current avatar's index in our purchased list
      let currentIndex = -1;

      if (
        previewAvatar.fromCurrentAvatarSection ||
        previewAvatar.isCurrentAvatar
      ) {
        currentIndex = availableAvatars.findIndex((avatar) =>
          previewAvatar.id
            ? avatar.id === previewAvatar.id
            : currentAvatar && avatar.id === currentAvatar.id
        );
      }

      // If avatar isn't in the purchased list or no current avatar,
      // start from the first purchased avatar
      const startIndex = currentIndex >= 0 ? currentIndex : 0;

      // Go to previous purchased avatar or loop to the end
      const prevIndex =
        startIndex > 0 ? startIndex - 1 : availableAvatars.length - 1;
      const prevAvatar = availableAvatars[prevIndex];

      // Display the previous avatar with proper flag
      setPreviewAvatar({
        ...prevAvatar,
        isCurrentAvatar: false,
        fromCurrentAvatarSection: true, // Mark this as coming from current avatar section
      });

      return;
    }

    // Regular navigation for purchase section
    // Find current avatar index
    const currentIndex = avatars.findIndex(
      (avatar) => avatar.id === previewAvatar.id
    );

    // If found, show previous avatar or loop to the end
    if (currentIndex > 0) {
      setPreviewAvatar(avatars[currentIndex - 1]);
    } else {
      // If at the first avatar, loop to the last one
      setPreviewAvatar(avatars[avatars.length - 1]);
    }
  };

  // Function to navigate to next avatar
  const navigateToNextAvatar = () => {
    // If we're viewing the current avatar or a purchased avatar in the current avatar context
    if (
      previewAvatar.isCurrentAvatar ||
      previewAvatar.fromCurrentAvatarSection
    ) {
      // Get list of ONLY purchased avatars
      const availableAvatars = avatars.filter((avatar) =>
        isAvatarPurchased(avatar.id)
      );

      if (availableAvatars.length === 0) {
        return; // No purchased avatars, nothing to navigate to
      }

      // Find the current avatar's index in our purchased list
      let currentIndex = -1;

      if (
        previewAvatar.fromCurrentAvatarSection ||
        previewAvatar.isCurrentAvatar
      ) {
        currentIndex = availableAvatars.findIndex((avatar) =>
          previewAvatar.id
            ? avatar.id === previewAvatar.id
            : currentAvatar && avatar.id === currentAvatar.id
        );
      }

      // If avatar isn't in the purchased list or no current avatar,
      // start from the first purchased avatar
      const startIndex = currentIndex >= 0 ? currentIndex : 0;

      // Go to next purchased avatar or loop to the beginning
      const nextIndex =
        startIndex < availableAvatars.length - 1 ? startIndex + 1 : 0;
      const nextAvatar = availableAvatars[nextIndex];

      // Display the next avatar with proper flag
      setPreviewAvatar({
        ...nextAvatar,
        isCurrentAvatar: false,
        fromCurrentAvatarSection: true, // Mark this as coming from current avatar section
      });

      return;
    }

    // Regular navigation for purchase section
    // Find current avatar index
    const currentIndex = avatars.findIndex(
      (avatar) => avatar.id === previewAvatar.id
    );

    // If found, show next avatar or loop to the beginning
    if (currentIndex !== -1 && currentIndex < avatars.length - 1) {
      setPreviewAvatar(avatars[currentIndex + 1]);
    } else {
      // If at the first avatar, loop to the first one
      setPreviewAvatar(avatars[0]);
    }
  };

  // Clean up notification when component unmounts
  useEffect(() => {
    return () => {
      setPurchaseNotification(null);
      setErrorNotification(null);
      setChangeNotification(null);
    };
  }, []);

  // Avatar data with ascending point prices
  const avatars = [
    { id: 1, price: 100, name: "Novice Explorer", image: level1Avatar },
    { id: 2, price: 300, name: "Task Apprentice", image: level2Avatar },
    { id: 3, price: 500, name: "Productivity Adept", image: level3Avatar },
    { id: 4, price: 750, name: "Time Wizard", image: level4Avatar },
    { id: 5, price: 1000, name: "Focus Master", image: level5Avatar },
    { id: 6, price: 1500, name: "Project Sage", image: level6Avatar },
    { id: 7, price: 2500, name: "Efficiency Guru", image: level7Avatar },
    { id: 8, price: 3000, name: "Achievement Titan", image: level8Avatar },
    { id: 9, price: 4000, name: "Legendary Organizer", image: level9Avatar },
    { id: 10, price: 5000, name: "Ultimate Taskmaster", image: level10Avatar },
  ];

  // Function to check if user has enough points for an avatar
  const canPurchaseAvatar = (avatar) => {
    return userPoints >= avatar.price;
  };

  // Function to check if avatar is already purchased
  const isAvatarPurchased = (avatarId) => {
    return purchasedAvatars.includes(avatarId);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Purchase Success Notification */}
      {purchaseNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-md bg-green-500 bg-opacity-90 border border-green-600">
            <div className="flex-shrink-0 bg-white bg-opacity-90 rounded-full p-1">
              <Check className="text-green-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">
                Avatar successfully purchased!
              </p>
              <p className="text-white text-sm opacity-90">
                You've acquired {purchaseNotification.avatar.name} for{" "}
                {purchaseNotification.avatar.price} points.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Change Notification */}
      {changeNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-md bg-blue-500 bg-opacity-90 border border-blue-600">
            <div className="flex-shrink-0 bg-white bg-opacity-90 rounded-full p-1">
              <Check className="text-blue-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">
                Avatar successfully changed!
              </p>
              <p className="text-white text-sm opacity-90">
                You're now using {changeNotification.avatar.name}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
          <div className="flex items-center gap-3 p-4 rounded-lg shadow-lg backdrop-blur-md bg-red-500 bg-opacity-90 border border-red-600">
            <div className="flex-shrink-0 bg-white bg-opacity-90 rounded-full p-1">
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">
                {errorNotification.message}
              </p>
              <p className="text-white text-sm opacity-90">
                {errorNotification.details}
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
              href="#/avatar"
              className="flex items-center gap-3 px-4 py-3 bg-[#9706e9] text-white rounded-lg transition-all duration-200"
              title="Avatar"
            >
              <User size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Avatar</span>}
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
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-5xl font-bold">Avatars</h1>
          <div className="px-4 py-2 rounded bg-black bg-opacity-40 border-2 border-[#9706e9] shadow-md shadow-purple-900/50">
            <span className="font-mono font-bold text-white">
              {userPoints}pts
            </span>
          </div>
        </div>

        {/* Changed layout to better fit 10 avatars */}
        <div className="px-6 grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pb-20">
          {/* Current Avatar - Updated to show placeholder when no avatar selected */}
          <div className="rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Current avatar</h2>
            <div className="flex justify-center">
              <div
                className="w-64 h-64 rounded-full bg-[#330033] p-2 overflow-hidden border-4 border-[#9706e9] shadow-lg shadow-purple-900/50 cursor-pointer hover:border-white transition-all duration-200"
                onClick={() =>
                  handleAvatarClick({
                    name: currentAvatar
                      ? currentAvatar.name
                      : "No Avatar Selected",
                    image: currentAvatar ? currentAvatar.image : null,
                    isCurrentAvatar: true,
                  })
                }
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar.image}
                    alt={currentAvatar.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-800">
                    <User size={80} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center mt-4">
              <span className="bg-[#9706e9] text-white px-3 py-1 rounded-full text-sm font-bold">
                {currentAvatar ? currentAvatar.name : "No Avatar Selected"}
              </span>
            </div>
          </div>

          {/* Purchase Avatar */}
          <div className="rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Purchase avatar</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {avatars.map((avatar) => {
                const hasEnoughPoints = canPurchaseAvatar(avatar);
                const isOwned = currentAvatar && currentAvatar.id === avatar.id;
                const isPurchased = isAvatarPurchased(avatar.id);

                return (
                  <div
                    key={avatar.id}
                    className={`relative group ${isOwned ? "opacity-60" : ""}`}
                  >
                    {/* Avatar Image - Clicking anywhere on this opens preview */}
                    <div
                      className={`cursor-pointer w-full h-36 relative ${
                        !hasEnoughPoints && !isPurchased ? "opacity-60" : ""
                      }`}
                      onClick={() => handleAvatarClick(avatar)}
                    >
                      <img
                        src={avatar.image}
                        alt={`${avatar.name}`}
                        className="w-full h-full object-cover rounded-md transition-transform duration-200 group-hover:scale-105"
                      />
                      {/* Price Tag */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 ${
                          isPurchased
                            ? "bg-blue-500"
                            : hasEnoughPoints
                            ? "bg-[#9706e9]"
                            : "bg-gray-600"
                        } py-1 text-center`}
                      >
                        <span className="font-mono font-bold">
                          {isOwned
                            ? "Current"
                            : isPurchased
                            ? "Owned"
                            : `${avatar.price}pts`}
                        </span>
                      </div>
                    </div>

                    {/* Purchase/Select Button Overlay - Visual only */}
                    {!isOwned && (
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <div
                          className={`${
                            isPurchased
                              ? "bg-blue-500"
                              : hasEnoughPoints
                              ? "bg-[#9706e9]"
                              : "bg-gray-600"
                          } text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}
                        >
                          {isPurchased
                            ? "Select Avatar"
                            : hasEnoughPoints
                            ? `Purchase for ${avatar.price}pts`
                            : `Need ${avatar.price - userPoints} more pts`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div
          className="fixed bottom-0 left-0 right-0 p-4"
          style={{ marginLeft: isNavbarCollapsed ? "4rem" : "16rem" }}
        >
          <div className="relative h-10 bg-black bg-opacity-30 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-[#9706e9] rounded-l-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-bold text-white">Level 1</span>
            </div>
          </div>
        </div>

        {/* Avatar Preview Modal */}
        {previewAvatar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-black bg-opacity-90 rounded-lg shadow-xl border-2 border-[#9706e9] p-6 max-h-[90vh] overflow-y-auto text-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{previewAvatar.name}</h2>
                <button
                  className="text-white hover:text-[#9706e9] transition-colors duration-200"
                  onClick={closePreview}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex justify-center items-center my-6 relative">
                {/* Show navigation buttons for both current avatar section and purchase section */}
                {(previewAvatar.isCurrentAvatar &&
                  purchasedAvatars.length > 0) ||
                !previewAvatar.isCurrentAvatar ? (
                  <button
                    className="absolute left-0 bg-black bg-opacity-70 p-2 rounded-full border-2 border-[#9706e9] text-white hover:bg-[#9706e9] transition-all duration-200 z-10 transform -translate-x-1/2"
                    onClick={navigateToPreviousAvatar}
                  >
                    <ChevronLeft size={24} />
                  </button>
                ) : null}

                {previewAvatar.image ? (
                  <img
                    src={previewAvatar.image}
                    alt={previewAvatar.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg border-4 border-[#9706e9] shadow-xl"
                  />
                ) : (
                  <div className="w-[60vh] h-[60vh] rounded-lg border-4 border-[#9706e9] shadow-xl flex items-center justify-center bg-gray-800">
                    <User size={120} className="text-gray-400" />
                  </div>
                )}

                {/* Show navigation buttons for both current avatar section and purchase section */}
                {(previewAvatar.isCurrentAvatar &&
                  purchasedAvatars.length > 0) ||
                !previewAvatar.isCurrentAvatar ? (
                  <button
                    className="absolute right-0 bg-black bg-opacity-70 p-2 rounded-full border-2 border-[#9706e9] text-white hover:bg-[#9706e9] transition-all duration-200 z-10 transform translate-x-1/2"
                    onClick={navigateToNextAvatar}
                  >
                    <ChevronRight size={24} />
                  </button>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {previewAvatar.isCurrentAvatar && currentAvatar ? (
                  <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold inline-block">
                    Current Avatar
                  </span>
                ) : previewAvatar.isCurrentAvatar ? (
                  <span className="bg-gray-600 text-white px-4 py-2 rounded-full font-bold inline-block">
                    No Avatar Selected
                  </span>
                ) : (
                  <>
                    <span
                      className={`${
                        isAvatarPurchased(previewAvatar.id)
                          ? "bg-blue-500"
                          : canPurchaseAvatar(previewAvatar)
                          ? "bg-[#9706e9]"
                          : "bg-gray-600"
                      } text-white px-4 py-2 rounded-full font-bold inline-block`}
                    >
                      {isAvatarPurchased(previewAvatar.id)
                        ? "Owned Avatar"
                        : `${previewAvatar.price} pts`}
                    </span>

                    {/* Check if current avatar - can't repurchase */}
                    {currentAvatar && currentAvatar.id === previewAvatar.id ? (
                      <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold inline-block">
                        Current Avatar
                      </span>
                    ) : isAvatarPurchased(previewAvatar.id) ? (
                      <button
                        className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        onClick={() => handleSelectAvatar(previewAvatar)}
                      >
                        Select Avatar
                      </button>
                    ) : (
                      <button
                        className={`${
                          canPurchaseAvatar(previewAvatar)
                            ? "bg-gradient-to-r from-purple-700 to-[#9706e9] hover:from-purple-800 hover:to-purple-600 transform hover:scale-105"
                            : "bg-gray-600 cursor-not-allowed"
                        } text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all duration-300`}
                        onClick={() => handlePurchase(previewAvatar)}
                        disabled={!canPurchaseAvatar(previewAvatar)}
                      >
                        {canPurchaseAvatar(previewAvatar)
                          ? "Purchase Avatar"
                          : `Need ${previewAvatar.price - userPoints} more pts`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

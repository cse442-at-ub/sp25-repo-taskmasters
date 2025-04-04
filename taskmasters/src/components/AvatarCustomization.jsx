"use client";

import { useState, useEffect } from "react";
import { get, post } from "../utils/api";
import config from "../config";

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

  const getAvatarImage = (filename) => {
    switch (filename) {
      case 'Level1Avatar.png': return level1Avatar;
      case 'Level2Avatar.png': return level2Avatar;
      case 'Level3Avatar.png': return level3Avatar;
      case 'Level4Avatar.png': return level4Avatar;
      case 'Level5Avatar.png': return level5Avatar;
      case 'Level6Avatar.png': return level6Avatar;
      case 'Level7Avatar.png': return level7Avatar;
      case 'Level8Avatar.png': return level8Avatar;
      case 'Level9Avatar.png': return level9Avatar;
      case 'Level10Avatar.png': return level10Avatar;
      default: return level1Avatar; // Default fallback
    }
  };
  const navigate = useNavigate();
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [purchaseNotification, setPurchaseNotification] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);
  const [changeNotification, setChangeNotification] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [purchasedAvatars, setPurchasedAvatars] = useState([]);
  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch avatar data from backend when component mounts
  useEffect(() => {
    const fetchAvatarData = async () => {
      try {
        setIsLoading(true);
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
          console.error('User data not found');
          navigate('/login');
          return;
        }

        // First, try to get user points from dashboard API
        try {
          const dashboardResponse = await get('dashboard.php', { userId: userData.id });
          const dashboardData = await dashboardResponse.json();
          console.log('Dashboard data:', dashboardData);
          
          if (dashboardData && dashboardData.level && dashboardData.level.totalPoints !== undefined) {
            const points = parseInt(dashboardData.level.totalPoints);
            setUserPoints(points);
            console.log('Setting user points from dashboard to:', points);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
        
        // Then get avatar data
        const response = await get(`avatar.php?userId=${userData.id}`);
        const data = await response.json();
        
        console.log('Avatar data from backend:', data);
        
        if (data) {
          // Set current avatar if available
          if (data.currentAvatar) {
            // Get just the filename from the path
            const filename = data.currentAvatar.image_url.split('/').pop();
            // Use the direct import for the image
            setCurrentAvatar({
              id: data.currentAvatar.avatar_id,
              name: data.currentAvatar.name,
              image: getAvatarImage(filename),
              isCurrentAvatar: true
            });
          }
          
          // Set purchased avatars
          if (data.ownedAvatars) {
            const purchasedIds = data.ownedAvatars.map(avatar => parseInt(avatar.avatar_id));
            setPurchasedAvatars(purchasedIds);
          }
          
          // Set available avatars
          if (data.availableAvatars) {
            setAvailableAvatars(data.availableAvatars);
          }
          
          // Set user points from avatar API if available and not already set from dashboard
          console.log('User points from avatar API:', data.totalPoints);
          if (data.totalPoints !== undefined) {
            const points = parseInt(data.totalPoints);
            setUserPoints(points);
            console.log('Setting user points from avatar API to:', points);
          }
        }
      } catch (error) {
        console.error('Error fetching avatar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatarData();
  }, [navigate]);

  const handleAvatarClick = (avatar) => {
    setPreviewAvatar(avatar);
  };

  const closePreview = () => {
    setPreviewAvatar(null);
  };


  const handlePurchase = async (avatar) => {
    try {
      // Check if user has enough points
      if (userPoints < avatar.price) {
        setErrorNotification({
          message: "Not enough points to purchase this avatar!",
          details: `You need ${avatar.price - userPoints} more points.`,
          timestamp: new Date(),
        });

        setTimeout(() => {
          setErrorNotification(null);
        }, 3000);

        return;
      }

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        console.error('User data not found');
        navigate('/login');
        return;
      }

      // Call backend API to purchase avatar
      const response = await post('avatar.php', {
        action: 'purchaseAvatar',
        userId: userData.id,
        avatarId: avatar.id
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with new data from backend
        if (result.userData) {
          if (result.userData.totalPoints !== undefined) {
            setUserPoints(parseInt(result.userData.totalPoints));
          }
          
          if (result.userData.ownedAvatars) {
            const purchasedIds = result.userData.ownedAvatars.map(avatar => parseInt(avatar.avatar_id));
            setPurchasedAvatars(purchasedIds);
          }
          
          if (result.userData.currentAvatar) {
            // Get just the filename from the path
            const filename = result.userData.currentAvatar.image_url.split('/').pop();
            setCurrentAvatar({
              id: result.userData.currentAvatar.avatar_id,
              name: result.userData.currentAvatar.name,
              image: getAvatarImage(filename),
              isCurrentAvatar: true
            });
          }
        } else {
          setUserPoints((prevPoints) => prevPoints - avatar.price);
          setPurchasedAvatars((prev) => [...prev, avatar.id]);
          setCurrentAvatar(avatar);
        }

        closePreview();
        setPurchaseNotification({
          avatar: avatar,
          timestamp: new Date(),
        });

        setTimeout(() => {
          setPurchaseNotification(null);
        }, 3000);
      } else {
        setErrorNotification({
          message: result.message || "Failed to purchase avatar",
          details: "Please try again later.",
          timestamp: new Date(),
        });

        setTimeout(() => {
          setErrorNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error purchasing avatar:', error);
      
      setErrorNotification({
        message: "Error purchasing avatar",
        details: "Please try again later.",
        timestamp: new Date(),
      });

      setTimeout(() => {
        setErrorNotification(null);
      }, 3000);
    }
  };

  const handleSelectAvatar = async (avatar) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.id) {
        console.error('User data not found');
        navigate('/login');
        return;
      }

      // Call backend API to select avatar
      const response = await post('avatar.php', {
        action: 'selectAvatar',
        userId: userData.id,
        avatarId: avatar.id
      });

      const result = await response.json();

      if (result.success) {
          if (result.userData && result.userData.currentAvatar) {
            // Get just the filename from the path
            const filename = result.userData.currentAvatar.image_url.split('/').pop();
            setCurrentAvatar({
              id: result.userData.currentAvatar.avatar_id,
              name: result.userData.currentAvatar.name,
              image: getAvatarImage(filename),
              isCurrentAvatar: true
            });
        } else {
          setCurrentAvatar(avatar);
        }

        closePreview();
        setChangeNotification({
          avatar: avatar,
          timestamp: new Date(),
        });

        setTimeout(() => {
          setChangeNotification(null);
        }, 3000);
      } else {
        setErrorNotification({
          message: result.message || "Failed to select avatar",
          details: "Please try again later.",
          timestamp: new Date(),
        });

        setTimeout(() => {
          setErrorNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error selecting avatar:', error);
      
      setErrorNotification({
        message: "Error selecting avatar",
        details: "Please try again later.",
        timestamp: new Date(),
      });

      setTimeout(() => {
        setErrorNotification(null);
      }, 3000);
    }
  };

  // Map backend avatar data to frontend format
  const avatars = availableAvatars.map(avatar => {
    // Use the direct import for the image
    const imageUrl = avatar.image_url;
    // Remove any path prefixes to get just the filename
    const filename = imageUrl.split('/').pop();
    
    return {
      id: parseInt(avatar.avatar_id),
      price: avatar.cost,
      name: avatar.name,
      image: getAvatarImage(filename), // Use the helper function to get the imported image
      imageUrl: filename,
      isOwned: avatar.is_owned
    };
  });

  // Use backend avatars if available, otherwise use static avatars
  const displayAvatars = avatars.length > 0 ? avatars : [
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

    if (purchasedAvatars.includes(avatarId)) {
      return true;
    }
    
    const avatar = displayAvatars.find(a => a.id === avatarId);
    return avatar && avatar.isOwned;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-xl">Loading avatar data...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Notifications */}
      {purchaseNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <p className="font-bold">Avatar successfully purchased!</p>
            <p>You've acquired {purchaseNotification.avatar.name} for {purchaseNotification.avatar.price} points.</p>
          </div>
        </div>
      )}

      {changeNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg">
            <p className="font-bold">Avatar successfully changed!</p>
            <p>You're now using {changeNotification.avatar.name}.</p>
          </div>
        </div>
      )}


      {errorNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg">
            <p className="font-bold">{errorNotification.message}</p>
            <p>{errorNotification.details}</p>

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
              className="flex items-center gap-3 px-4 py-3 bg-[#9706e9] text-white rounded-lg transition-all duration-200"
              title="Avatar Customization"
            >
              <User size={20} />
              {!isNavbarCollapsed && <span className="text-lg">Avatar Customization</span>}
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

          <h1 className="text-5xl font-bold">Avatar Customization</h1>
          <div className="px-4 py-2 rounded bg-black bg-opacity-40 border-2 border-[#9706e9] shadow-md shadow-purple-900/50">
            <span className="font-mono font-bold text-white">
              {userPoints}pts
            </span>
          </div>
        </div>


        {/* Avatar Grid */}
        <div className="px-6 grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8 pb-20">
          {/* Current Avatar */}
          <div className="rounded-lg p-6 backdrop-blur-sm bg-black bg-opacity-30">
            <h2 className="text-2xl font-bold mb-6">Current avatar</h2>
            <div className="flex justify-center">
              <div
                className="w-64 h-64 rounded-full bg-[#330033] p-2 overflow-hidden border-4 border-[#9706e9] shadow-lg shadow-purple-900/50 cursor-pointer hover:border-white transition-all duration-200"

                onClick={() => currentAvatar && handleAvatarClick(currentAvatar)}
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


          {/* Available Avatars */}
          <div className="rounded-lg p-6 backdrop-blur-sm bg-black bg-opacity-30">
            <h2 className="text-2xl font-bold mb-6">Purchase avatar</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {displayAvatars.map((avatar) => {
                const hasEnoughPoints = canPurchaseAvatar(avatar);
                const isOwned = currentAvatar && currentAvatar.id === avatar.id;
                const isPurchased = isAvatarPurchased(avatar.id);

                return (
                  <div
                    key={avatar.id}

                    className={`relative ${isOwned ? "opacity-60" : ""}`}
                  >
                    <div
                      className={`cursor-pointer w-full h-32 relative ${
                        !hasEnoughPoints && !isPurchased ? "opacity-60" : ""
                      }`}
                      onClick={() => handleAvatarClick(avatar)}
                    >
                      <img
                        src={avatar.image}

                        alt={avatar.name}
                        className="w-full h-full object-cover rounded-md"
                      />
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

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Preview Modal */}
      {previewAvatar && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-lg w-full p-6 text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{previewAvatar.name}</h2>
              <button
                className="text-white hover:text-purple-500"
                onClick={closePreview}
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-center my-6">
              <img
                src={previewAvatar.image}
                alt={previewAvatar.name}
                className="max-w-full max-h-64 object-contain rounded-lg border-4 border-purple-700"
              />
            </div>

            <div className="mt-6 flex justify-between items-center">
              <span
                className={`${
                  isAvatarPurchased(previewAvatar.id)
                    ? "bg-blue-500"
                    : canPurchaseAvatar(previewAvatar)
                    ? "bg-purple-700"
                    : "bg-gray-600"
                } text-white px-4 py-2 rounded-full font-bold`}
              >
                {isAvatarPurchased(previewAvatar.id)
                  ? "Owned Avatar"
                  : `${previewAvatar.price} pts`}
              </span>

              {currentAvatar && currentAvatar.id === previewAvatar.id ? (
                <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold">
                  Current Avatar
                </span>
              ) : isAvatarPurchased(previewAvatar.id) ? (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold"
                  onClick={() => handleSelectAvatar(previewAvatar)}
                >
                  Select Avatar
                </button>
              ) : (
                <button
                  className={`${
                    canPurchaseAvatar(previewAvatar)
                      ? "bg-purple-700 hover:bg-purple-800"
                      : "bg-gray-600 cursor-not-allowed"
                  } text-white px-6 py-2 rounded-full font-bold`}
                  onClick={() => handlePurchase(previewAvatar)}
                  disabled={!canPurchaseAvatar(previewAvatar)}
                >
                  {canPurchaseAvatar(previewAvatar)
                    ? "Purchase Avatar"
                    : `Need ${previewAvatar.price - userPoints} more pts`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

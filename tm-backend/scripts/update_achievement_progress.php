<?php
/**
 * Achievement Progress Updater
 * 
 * This script updates achievement progress for all users based on their completed tasks.
 * It can be run as a scheduled task (cron job) to periodically update achievement progress.
 * 
 * Usage: php update_achievement_progress.php
 */

// Include database configuration
include_once '../config/database.php';

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to log messages
function logMessage($message) {
    echo date('Y-m-d H:i:s') . " - $message\n";
    error_log(date('Y-m-d H:i:s') . " - $message");
}

// Main function to update achievement progress
function updateAchievementProgress() {
    logMessage("Starting achievement progress update");
    
    try {
        // Connect to database
        $database = new Database();
        $db = $database->getConnection();
        
        // Ensure required tables exist
        ensureTablesExist($db);
        
        // Get all users
        $query = "SELECT user_id FROM users";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logMessage("Found " . count($users) . " users");
        
        // Process each user
        foreach ($users as $user) {
            $userId = $user['user_id'];
            logMessage("Processing user ID: $userId");
            
            // Update achievement progress for this user
            updateUserAchievements($db, $userId);
        }
        
        logMessage("Achievement progress update completed successfully");
        return true;
    } catch (Exception $e) {
        logMessage("Error updating achievement progress: " . $e->getMessage());
        return false;
    }
}

// Function to ensure all required tables exist
function ensureTablesExist($db) {
    // Ensure achievements table exists
    $query = "SHOW TABLES LIKE 'achievements'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $achievementsTableExists = $stmt->rowCount() > 0;
    
    if (!$achievementsTableExists) {
        logMessage("Creating achievements table");
        $query = "CREATE TABLE achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255) NOT NULL,
            icon VARCHAR(255) NOT NULL,
            points INT NOT NULL DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        $db->exec($query);
        
        // Insert default achievements
        $defaultAchievements = [
            ['name' => 'First Task', 'description' => 'Complete your first task', 'icon' => 'FirstTask.png', 'points' => 100],
            ['name' => 'Task Streak', 'description' => 'Complete tasks for 7 days in a row', 'icon' => 'TaskStreak.png', 'points' => 500],
            ['name' => 'Early Bird', 'description' => 'Complete 5 tasks before 9 AM', 'icon' => 'EarlyBird.png', 'points' => 300],
            ['name' => 'Night Owl', 'description' => 'Complete 5 tasks after 10 PM', 'icon' => 'NightOwl.png', 'points' => 300],
            ['name' => 'Task Master', 'description' => 'Complete 50 tasks in total', 'icon' => 'TaskMaster.png', 'points' => 1000],
            ['name' => 'Perfect Week', 'description' => 'Complete all tasks in a week', 'icon' => 'PerfectWeek.png', 'points' => 800],
            ['name' => 'Big Spender', 'description' => 'Buy 5 avatars', 'icon' => 'BigSpender.png', 'points' => 400],
            ['name' => 'Time Manager', 'description' => 'Complete 10 tasks on time', 'icon' => 'TimeManager.png', 'points' => 600],
            ['name' => 'Task Explorer', 'description' => 'Create tasks in 5 different categories', 'icon' => 'TaskExplorer.png', 'points' => 400],
            ['name' => 'Achievement Hunter', 'description' => 'Unlock 5 other achievements', 'icon' => 'AchievementHunter.png', 'points' => 1000],
            ['name' => 'Consistent Student', 'description' => 'Complete 5 school-related tasks', 'icon' => 'FirstTask.png', 'points' => 300],
            ['name' => 'Dedicated Worker', 'description' => 'Complete 3 Work tasks', 'icon' => 'TaskStreak.png', 'points' => 300],
            ['name' => 'Daily Task Master', 'description' => 'Complete 3+ tasks in one day', 'icon' => 'TaskMaster.png', 'points' => 300]
        ];
        
        foreach ($defaultAchievements as $achievement) {
            $query = "INSERT INTO achievements (name, description, icon, points) VALUES (:name, :description, :icon, :points)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':name', $achievement['name']);
            $stmt->bindParam(':description', $achievement['description']);
            $stmt->bindParam(':icon', $achievement['icon']);
            $stmt->bindParam(':points', $achievement['points']);
            $stmt->execute();
        }
        
        logMessage("Inserted " . count($defaultAchievements) . " default achievements");
    }
    
    // Ensure user_achievements table exists
    $query = "SHOW TABLES LIKE 'user_achievements'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $userAchievementsTableExists = $stmt->rowCount() > 0;
    
    if (!$userAchievementsTableExists) {
        logMessage("Creating user_achievements table");
        $query = "CREATE TABLE user_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            unlocked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
    }
    
    // Ensure achievement_progress table exists
    $query = "SHOW TABLES LIKE 'achievement_progress'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $achievementProgressTableExists = $stmt->rowCount() > 0;
    
    if (!$achievementProgressTableExists) {
        logMessage("Creating achievement_progress table");
        $query = "CREATE TABLE achievement_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            current_value INT NOT NULL DEFAULT 0,
            target_value INT NOT NULL DEFAULT 1,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
    }
    
    // Ensure achievement_notifications table exists
    $query = "SHOW TABLES LIKE 'achievement_notifications'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $achievementNotificationsTableExists = $stmt->rowCount() > 0;
    
    if (!$achievementNotificationsTableExists) {
        logMessage("Creating achievement_notifications table");
        $query = "CREATE TABLE achievement_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            notified BOOLEAN DEFAULT 0,
            notification_date TIMESTAMP NULL,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
    }
}

// Function to update achievement progress for a specific user
function updateUserAchievements($db, $userId) {
    try {
        // Get all achievements
        $query = "SELECT * FROM achievements";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $achievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logMessage("Processing " . count($achievements) . " achievements for user $userId");
        
        foreach ($achievements as $achievement) {
            // Check if user already has this achievement
            $query = "SELECT * FROM user_achievements WHERE user_id = :userId AND achievement_id = :achievementId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievement['id']);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                // User already has this achievement, skip
                continue;
            }
            
            // Get current progress
            $query = "SELECT * FROM achievement_progress WHERE user_id = :userId AND achievement_id = :achievementId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievement['id']);
            $stmt->execute();
            
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);
            $currentValue = 0;
            $targetValue = 1;
            
            if ($progress) {
                $currentValue = $progress['current_value'];
                $targetValue = $progress['target_value'];
            } else {
                // Create progress record with default values
                $targetValue = getDefaultTargetValue($achievement['name']);
                $currentValue = calculateCurrentValue($db, $userId, $achievement['name']);
                
                $query = "INSERT INTO achievement_progress (user_id, achievement_id, current_value, target_value) 
                         VALUES (:userId, :achievementId, :currentValue, :targetValue)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':achievementId', $achievement['id']);
                $stmt->bindParam(':currentValue', $currentValue);
                $stmt->bindParam(':targetValue', $targetValue);
                $stmt->execute();
                
                logMessage("Created progress record for achievement " . $achievement['name'] . " with value $currentValue/$targetValue");
            }
            
            // Update progress based on latest data
            $newValue = calculateCurrentValue($db, $userId, $achievement['name']);
            
            if ($newValue != $currentValue) {
                // Update progress
                $query = "UPDATE achievement_progress 
                         SET current_value = :newValue 
                         WHERE user_id = :userId AND achievement_id = :achievementId";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':achievementId', $achievement['id']);
                $stmt->bindParam(':newValue', $newValue);
                $stmt->execute();
                
                logMessage("Updated progress for achievement " . $achievement['name'] . " from $currentValue to $newValue/$targetValue");
                
                // Check if achievement is completed
                if ($newValue >= $targetValue) {
                    logMessage("Achievement " . $achievement['name'] . " completed, unlocking...");
                    
                    // Unlock the achievement
                    $query = "INSERT INTO user_achievements (user_id, achievement_id) 
                             VALUES (:userId, :achievementId)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':userId', $userId);
                    $stmt->bindParam(':achievementId', $achievement['id']);
                    $stmt->execute();
                    
                    // Award points for the achievement
                    $points = $achievement['points'];
                    updateUserPoints($db, $userId, $points);
                    
                    logMessage("Awarded $points points for achievement " . $achievement['name']);
                    
                    // Send email notification
                    sendAchievementEmail($db, $userId, $achievement['id']);
                    
                    // Check for Achievement Hunter achievement
                    checkAchievementHunter($db, $userId);
                }
            }
        }
        
        return true;
    } catch (Exception $e) {
        logMessage("Error updating achievements for user $userId: " . $e->getMessage());
        return false;
    }
}

// Function to get default target value for an achievement
function getDefaultTargetValue($achievementName) {
    switch ($achievementName) {
        case 'First Task':
            return 1;
        case 'Task Streak':
            return 7;
        case 'Early Bird':
            return 5;
        case 'Night Owl':
            return 5;
        case 'Task Master':
            return 50;
        case 'Perfect Week':
            return 1;
        case 'Big Spender':
            return 5;
        case 'Time Manager':
            return 10;
        case 'Task Explorer':
            return 5;
        case 'Achievement Hunter':
            return 5;
        case 'Consistent Student':
            return 5;
        case 'Dedicated Worker':
            return 3;
        case 'Daily Task Master':
            return 3;
        default:
            return 1;
    }
}

// Function to calculate current value for an achievement
function calculateCurrentValue($db, $userId, $achievementName) {
    switch ($achievementName) {
        case 'First Task':
            // Count completed tasks
            $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 1);
            
        case 'Task Streak':
            // This requires complex logic to check consecutive days
            // For now, we'll just count the number of days with completed tasks
            $query = "SELECT COUNT(DISTINCT DATE(completed_date)) as count 
                     FROM completed_tasks 
                     WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 7);
            
        case 'Early Bird':
            // Count tasks completed before 9 AM
            $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                     JOIN tasks t ON ct.task_id = t.task_id 
                     WHERE ct.user_id = :userId AND TIME(t.Task_time) < '09:00:00'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Night Owl':
            // Count tasks completed after 10 PM
            $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                     JOIN tasks t ON ct.task_id = t.task_id 
                     WHERE ct.user_id = :userId AND TIME(t.Task_time) >= '22:00:00'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Task Master':
            // Count total completed tasks
            $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 50);
            
        case 'Perfect Week':
            // This requires complex logic to check all tasks in a week
            // For now, we'll just check if all tasks for today are completed
            $today = date('Y-m-d');
            
            // Get total tasks for today
            $query = "SELECT COUNT(*) as total FROM tasks 
                     WHERE user_id = :userId AND task_startDate = :today";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':today', $today);
            $stmt->execute();
            $totalTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Get completed tasks for today
            $query = "SELECT COUNT(*) as completed FROM tasks 
                     WHERE user_id = :userId AND task_startDate = :today AND completed = 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':today', $today);
            $stmt->execute();
            $completedTasks = $stmt->fetch(PDO::FETCH_ASSOC)['completed'];
            
            return ($totalTasks > 0 && $completedTasks >= $totalTasks) ? 1 : 0;
            
        case 'Big Spender':
            // Count purchased avatars
            $query = "SELECT COUNT(*) as count FROM user_avatars WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Time Manager':
            // Count completed tasks (assuming all are on time)
            $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 10);
            
        case 'Task Explorer':
            // Count distinct task categories
            $query = "SELECT COUNT(DISTINCT task_tags) as count FROM tasks 
                     WHERE user_id = :userId AND task_tags != ''";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Achievement Hunter':
            // Count unlocked achievements
            $query = "SELECT COUNT(*) as count FROM user_achievements WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Consistent Student':
            // Count completed school tasks
            $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                     JOIN tasks t ON ct.task_id = t.task_id 
                     WHERE ct.user_id = :userId AND t.task_tags = 'School'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 5);
            
        case 'Dedicated Worker':
            // Count completed work tasks
            $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                     JOIN tasks t ON ct.task_id = t.task_id 
                     WHERE ct.user_id = :userId AND t.task_tags = 'Work'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 3);
            
        case 'Daily Task Master':
            // Count tasks completed today
            $today = date('Y-m-d');
            $query = "SELECT COUNT(*) as count FROM completed_tasks 
                     WHERE user_id = :userId AND DATE(completed_date) = :today";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':today', $today);
            $stmt->execute();
            return min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 3);
            
        default:
            return 0;
    }
}

// Function to update user points
function updateUserPoints($db, $userId, $pointsToAdd) {
    try {
        // Check if user exists in user_points table
        $query = "SELECT * FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Update existing user points
            $query = "UPDATE user_points SET total_points = total_points + :points WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':points', $pointsToAdd);
            $stmt->execute();
        } else {
            // Insert new user points record
            $query = "INSERT INTO user_points (user_id, total_points, level) VALUES (:userId, :points, 1)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':points', $pointsToAdd);
            $stmt->execute();
        }
        
        // Update level based on total points
        $query = "SELECT total_points FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalPoints = $result['total_points'];
        
        // Calculate level (1 level per 100 points)
        $level = floor($totalPoints / 100) + 1;
        
        // Update level
        $query = "UPDATE user_points SET level = :level WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':level', $level);
        $stmt->execute();
        
        logMessage("Updated user $userId points to $totalPoints and level to $level");
        
        return true;
    } catch (Exception $e) {
        logMessage("Error updating user points: " . $e->getMessage());
        return false;
    }
}

// Function to check and unlock Achievement Hunter achievement
function checkAchievementHunter($db, $userId) {
    try {
        // Count unlocked achievements
        $query = "SELECT COUNT(*) as count FROM user_achievements WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $achievementCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // If user has unlocked 5 or more achievements, unlock Achievement Hunter
        if ($achievementCount >= 5) {
            // Get Achievement Hunter achievement ID
            $query = "SELECT id FROM achievements WHERE name = 'Achievement Hunter'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $achievementHunter = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($achievementHunter) {
                $achievementHunterId = $achievementHunter['id'];
                
                // Check if user already has this achievement
                $query = "SELECT * FROM user_achievements 
                         WHERE user_id = :userId AND achievement_id = :achievementId";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':achievementId', $achievementHunterId);
                $stmt->execute();
                
                if ($stmt->rowCount() == 0) {
                    // Unlock Achievement Hunter
                    $query = "INSERT INTO user_achievements (user_id, achievement_id) 
                             VALUES (:userId, :achievementId)";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':userId', $userId);
                    $stmt->bindParam(':achievementId', $achievementHunterId);
                    $stmt->execute();
                    
                    // Award points
                    $query = "SELECT points FROM achievements WHERE id = :achievementId";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':achievementId', $achievementHunterId);
                    $stmt->execute();
                    $points = $stmt->fetch(PDO::FETCH_ASSOC)['points'];
                    
                    updateUserPoints($db, $userId, $points);
                    
                    logMessage("Unlocked Achievement Hunter achievement for user $userId");
                    
                    // Send email notification
                    sendAchievementEmail($db, $userId, $achievementHunterId);
                }
            }
        }
        
        return true;
    } catch (Exception $e) {
        logMessage("Error checking Achievement Hunter: " . $e->getMessage());
        return false;
    }
}

// Function to create achievement notification (replaces email sending)
function sendAchievementEmail($db, $userId, $achievementId) {
    try {
        logMessage("Creating achievement notification for user $userId, achievement $achievementId");
        
        // Ensure achievement_notifications table exists with read_status column
        $query = "SHOW TABLES LIKE 'achievement_notifications'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            logMessage("Creating achievement_notifications table");
            $query = "CREATE TABLE achievement_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                achievement_id INT NOT NULL,
                notified BOOLEAN DEFAULT 0,
                read_status BOOLEAN DEFAULT 0,
                notification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_achievement (user_id, achievement_id)
            )";
            $db->exec($query);
        } else {
            // Check if read_status column exists
            $query = "SHOW COLUMNS FROM achievement_notifications LIKE 'read_status'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $columnExists = $stmt->rowCount() > 0;
            
            if (!$columnExists) {
                // Add read_status column
                logMessage("Adding read_status column to achievement_notifications table");
                $query = "ALTER TABLE achievement_notifications ADD COLUMN read_status BOOLEAN DEFAULT 0";
                $db->exec($query);
            }
        }
        
        // Get achievement details for logging
        $query = "SELECT name FROM achievements WHERE id = :achievementId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':achievementId', $achievementId);
        $stmt->execute();
        $achievement = $stmt->fetch(PDO::FETCH_ASSOC);
        $achievementName = $achievement ? $achievement['name'] : 'Unknown Achievement';
        
        logMessage("Creating notification for achievement: $achievementName");
        
        // Check if notification already exists
        $query = "SELECT id FROM achievement_notifications 
                 WHERE user_id = :userId AND achievement_id = :achievementId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':achievementId', $achievementId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Create new notification
            logMessage("Creating new notification record");
            $query = "INSERT INTO achievement_notifications (user_id, achievement_id, notified, read_status) 
                     VALUES (:userId, :achievementId, 1, 0)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievementId);
            $stmt->execute();
            logMessage("New notification created successfully");
        } else {
            // Update existing notification
            logMessage("Updating existing notification record");
            $query = "UPDATE achievement_notifications 
                     SET notified = 1, read_status = 0, notification_date = CURRENT_TIMESTAMP 
                     WHERE user_id = :userId AND achievement_id = :achievementId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievementId);
            $stmt->execute();
            logMessage("Existing notification updated successfully");
        }
        
        return true;
    } catch (Exception $e) {
        logMessage("Error creating achievement notification: " . $e->getMessage());
        logMessage("Stack trace: " . $e->getTraceAsString());
        return false;
    }
}

// Run the main function
updateAchievementProgress();

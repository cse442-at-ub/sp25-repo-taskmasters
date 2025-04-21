<?php
/**
 * Setup Achievement System
 * 
 * This script sets up the achievement system by creating all necessary tables
 * and initializing them with default data.
 * 
 * Usage: php setup_achievement_system.php
 */

// Include database configuration
include_once '../config/database.php';

try {
    echo "Setting up achievement system...\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Create achievement_progress table
    echo "Creating achievement_progress table...\n";
    $query = "SHOW TABLES LIKE 'achievement_progress'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        $query = "CREATE TABLE achievement_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            current_value INT NOT NULL DEFAULT 0,
            target_value INT NOT NULL DEFAULT 1,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
        echo "Achievement progress table created successfully.\n";
    } else {
        echo "Achievement progress table already exists.\n";
    }
    
    // Create achievement_notifications table
    echo "Creating achievement_notifications table...\n";
    $query = "SHOW TABLES LIKE 'achievement_notifications'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        $query = "CREATE TABLE achievement_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            notified BOOLEAN DEFAULT 0,
            notification_date TIMESTAMP NULL,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
        echo "Achievement notifications table created successfully.\n";
        
        // Initialize with existing unlocked achievements
        $query = "INSERT INTO achievement_notifications (user_id, achievement_id, notified)
                 SELECT user_id, achievement_id, 1 FROM user_achievements";
        $db->exec($query);
        echo "Initialized achievement notifications with existing achievements.\n";
    } else {
        echo "Achievement notifications table already exists.\n";
    }
    
    // Create achievement_threshold_notifications table
    echo "Creating achievement_threshold_notifications table...\n";
    $query = "SHOW TABLES LIKE 'achievement_threshold_notifications'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        $query = "CREATE TABLE achievement_threshold_notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            threshold INT NOT NULL,
            current_percent INT NOT NULL,
            notified BOOLEAN DEFAULT 0,
            notification_date TIMESTAMP NULL,
            UNIQUE KEY unique_user_achievement_threshold (user_id, achievement_id, threshold)
        )";
        $db->exec($query);
        echo "Achievement threshold notifications table created successfully.\n";
    } else {
        echo "Achievement threshold notifications table already exists.\n";
    }
    
    // Initialize achievement progress for all users
    echo "Initializing achievement progress for all users...\n";
    
    // Get all users
    $query = "SELECT user_id FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($users) === 0) {
        echo "No users found.\n";
    } else {
        echo "Found " . count($users) . " users.\n";
        
        // Get all achievements
        $query = "SELECT id FROM achievements";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $achievements = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($achievements) === 0) {
            echo "No achievements found.\n";
        } else {
            echo "Found " . count($achievements) . " achievements.\n";
            
            // For each user and achievement, check if progress record exists
            foreach ($users as $userId) {
                echo "Initializing progress for user $userId...\n";
                
                foreach ($achievements as $achievementId) {
                    $query = "SELECT id FROM achievement_progress 
                             WHERE user_id = :userId AND achievement_id = :achievementId";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':userId', $userId);
                    $stmt->bindParam(':achievementId', $achievementId);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() === 0) {
                        // Get achievement details
                        $query = "SELECT name FROM achievements WHERE id = :achievementId";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':achievementId', $achievementId);
                        $stmt->execute();
                        $achievementName = $stmt->fetch(PDO::FETCH_COLUMN);
                        
                        // Check if achievement is already unlocked
                        $query = "SELECT id FROM user_achievements 
                                 WHERE user_id = :userId AND achievement_id = :achievementId";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':userId', $userId);
                        $stmt->bindParam(':achievementId', $achievementId);
                        $stmt->execute();
                        $isUnlocked = $stmt->rowCount() > 0;
                        
                        // Calculate default target value based on achievement type
                        $defaultTargetValue = 1;
                        $defaultCurrentValue = 0;
                        
                        switch ($achievementName) {
                            case 'First Task':
                                $defaultTargetValue = 1;
                                // Check if user has completed any tasks
                                $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], 1);
                                break;
                                
                            case 'Task Streak':
                                $defaultTargetValue = 7;
                                break;
                                
                            case 'Early Bird':
                                $defaultTargetValue = 5;
                                // Count tasks completed before 9 AM
                                $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                                         JOIN tasks t ON ct.task_id = t.task_id 
                                         WHERE ct.user_id = :userId AND TIME(t.Task_time) < '09:00:00'";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Night Owl':
                                $defaultTargetValue = 5;
                                // Count tasks completed after 10 PM
                                $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                                         JOIN tasks t ON ct.task_id = t.task_id 
                                         WHERE ct.user_id = :userId AND TIME(t.Task_time) >= '22:00:00'";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Task Master':
                                $defaultTargetValue = 50;
                                // Count total completed tasks
                                $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Perfect Week':
                                $defaultTargetValue = 1;
                                break;
                                
                            case 'Big Spender':
                                $defaultTargetValue = 5;
                                // Count purchased avatars
                                $query = "SELECT COUNT(*) as count FROM user_avatars WHERE user_id = :userId";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Time Manager':
                                $defaultTargetValue = 10;
                                // Count completed tasks (assuming all are on time)
                                $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Task Explorer':
                                $defaultTargetValue = 5;
                                // Count distinct task categories
                                $query = "SELECT COUNT(DISTINCT task_tags) as count FROM tasks 
                                         WHERE user_id = :userId AND task_tags != ''";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Achievement Hunter':
                                $defaultTargetValue = 5;
                                // Count unlocked achievements
                                $query = "SELECT COUNT(*) as count FROM user_achievements WHERE user_id = :userId";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Consistent Student':
                                $defaultTargetValue = 5;
                                // Count completed school tasks
                                $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                                         JOIN tasks t ON ct.task_id = t.task_id 
                                         WHERE ct.user_id = :userId AND t.task_tags = 'School'";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Dedicated Worker':
                                $defaultTargetValue = 3;
                                // Count completed work tasks
                                $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                                         JOIN tasks t ON ct.task_id = t.task_id 
                                         WHERE ct.user_id = :userId AND t.task_tags = 'Work'";
                                $stmt = $db->prepare($query);
                                $stmt->bindParam(':userId', $userId);
                                $stmt->execute();
                                $defaultCurrentValue = min($stmt->fetch(PDO::FETCH_ASSOC)['count'], $defaultTargetValue);
                                break;
                                
                            case 'Daily Task Master':
                                $defaultTargetValue = 3;
                                break;
                        }
                        
                        // If achievement is unlocked, set current value to target value
                        if ($isUnlocked) {
                            $defaultCurrentValue = $defaultTargetValue;
                        }
                        
                        // Create progress record
                        $query = "INSERT INTO achievement_progress (user_id, achievement_id, current_value, target_value) 
                                 VALUES (:userId, :achievementId, :currentValue, :targetValue)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':userId', $userId);
                        $stmt->bindParam(':achievementId', $achievementId);
                        $stmt->bindParam(':currentValue', $defaultCurrentValue);
                        $stmt->bindParam(':targetValue', $defaultTargetValue);
                        $stmt->execute();
                        
                        echo "  Created progress record for achievement '$achievementName' with current value $defaultCurrentValue/$defaultTargetValue\n";
                        
                        // Check if we need to create threshold notifications
                        if (!$isUnlocked) {
                            $progressPercent = $defaultTargetValue > 0 ? round(($defaultCurrentValue / $defaultTargetValue) * 100) : 0;
                            
                            // Check thresholds (50%, 75%)
                            $thresholds = [50, 75];
                            foreach ($thresholds as $threshold) {
                                if ($progressPercent >= $threshold) {
                                    // Create threshold notification
                                    $query = "SELECT id FROM achievement_threshold_notifications 
                                             WHERE user_id = :userId AND achievement_id = :achievementId AND threshold = :threshold";
                                    $stmt = $db->prepare($query);
                                    $stmt->bindParam(':userId', $userId);
                                    $stmt->bindParam(':achievementId', $achievementId);
                                    $stmt->bindParam(':threshold', $threshold);
                                    $stmt->execute();
                                    
                                    if ($stmt->rowCount() === 0) {
                                        $query = "INSERT INTO achievement_threshold_notifications 
                                                 (user_id, achievement_id, threshold, current_percent, notified) 
                                                 VALUES (:userId, :achievementId, :threshold, :currentPercent, 0)";
                                        $stmt = $db->prepare($query);
                                        $stmt->bindParam(':userId', $userId);
                                        $stmt->bindParam(':achievementId', $achievementId);
                                        $stmt->bindParam(':threshold', $threshold);
                                        $stmt->bindParam(':currentPercent', $progressPercent);
                                        $stmt->execute();
                                        
                                        echo "  Created threshold notification for achievement '$achievementName' at $threshold% ($progressPercent%)\n";
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    echo "Achievement system setup completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

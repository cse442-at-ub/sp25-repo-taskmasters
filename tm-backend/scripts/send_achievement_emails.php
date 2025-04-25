<?php
/**
 * Create Achievement Notifications
 * 
 * This script creates notifications for users who have:
 * 1. Unlocked achievements but haven't been notified yet
 * 2. Reached achievement thresholds (50%, 75%) but haven't been notified yet
 * 
 * It can be run as a cron job to periodically create achievement notifications.
 * 
 * Usage: php send_achievement_emails.php
 * 
 * Note: This script has been updated to create notifications instead of sending emails.
 */

/**
 * Ensure the achievement_threshold_notifications table exists
 */
function ensureThresholdNotificationsTableExists($db) {
    try {
        // Check if achievement_threshold_notifications table exists
        $query = "SHOW TABLES LIKE 'achievement_threshold_notifications'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            // Create achievement_threshold_notifications table
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
            echo "Created achievement_threshold_notifications table\n";
        }
        
        return true;
    } catch (Exception $e) {
        echo "Error ensuring achievement_threshold_notifications table exists: " . $e->getMessage() . "\n";
        return false;
    }
}

// Include database configuration
include_once '../config/database.php';
include_once '../utils/EmailSender.php';

try {
    echo "Sending achievement emails...\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if achievement_notifications table exists
    $query = "SHOW TABLES LIKE 'achievement_notifications'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "Creating achievement_notifications table...\n";
        
        // Create achievement_notifications table
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
    }
    
    // Ensure threshold notifications table exists
    ensureThresholdNotificationsTableExists($db);
    
    // Get users with unlocked achievements that haven't been notified
    $query = "SELECT an.id, an.user_id, an.achievement_id, a.name, a.description, a.points, a.icon, u.username, 
                    'complete' as notification_type, 100 as percent
             FROM achievement_notifications an
             JOIN achievements a ON an.achievement_id = a.id
             JOIN users u ON an.user_id = u.user_id
             WHERE an.notified = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $completeNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get users with threshold notifications that haven't been notified
    $query = "SELECT tn.id, tn.user_id, tn.achievement_id, a.name, a.description, a.points, a.icon, u.username,
                    'threshold' as notification_type, tn.threshold as percent
             FROM achievement_threshold_notifications tn
             JOIN achievements a ON tn.achievement_id = a.id
             JOIN users u ON tn.user_id = u.user_id
             WHERE tn.notified = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $thresholdNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine both types of notifications
    $notifications = array_merge($completeNotifications, $thresholdNotifications);
    
    if (count($notifications) === 0) {
        echo "No new achievement notifications to create.\n";
        exit;
    }
    
    echo "Found " . count($completeNotifications) . " complete achievement notifications to create.\n";
    echo "Found " . count($thresholdNotifications) . " threshold achievement notifications to create.\n";
    
    // Ensure achievement_notifications table exists with read_status column
    $query = "SHOW TABLES LIKE 'achievement_notifications'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo "Creating achievement_notifications table\n";
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
            echo "Adding read_status column to achievement_notifications table\n";
            $query = "ALTER TABLE achievement_notifications ADD COLUMN read_status BOOLEAN DEFAULT 0";
            $db->exec($query);
        }
    }
    
    // Process each notification
    foreach ($notifications as $notification) {
        $userId = $notification['user_id'];
        $achievementId = $notification['achievement_id'];
        $username = $notification['username'];
        $achievementName = $notification['name'];
        $notificationType = $notification['notification_type'];
        $notificationId = $notification['id'];
        
        echo "Creating $notificationType notification for user $username (ID: $userId), achievement: $achievementName\n";
        
        if ($notificationType === 'complete') {
            // Create or update notification in achievement_notifications table
            $query = "SELECT id FROM achievement_notifications 
                     WHERE user_id = :userId AND achievement_id = :achievementId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievementId);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                // Create new notification
                $query = "INSERT INTO achievement_notifications (user_id, achievement_id, notified, read_status) 
                         VALUES (:userId, :achievementId, 1, 0)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':achievementId', $achievementId);
                $stmt->execute();
                echo "Created new notification record\n";
            } else {
                // Update existing notification
                $query = "UPDATE achievement_notifications 
                         SET notified = 1, read_status = 0, notification_date = CURRENT_TIMESTAMP 
                         WHERE user_id = :userId AND achievement_id = :achievementId";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':achievementId', $achievementId);
                $stmt->execute();
                echo "Updated existing notification record\n";
            }
            
            // Mark as notified in the original table
            $query = "UPDATE achievement_notifications 
                     SET notified = 1, notification_date = NOW() 
                     WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $notificationId);
            $stmt->execute();
        } else {
            // Mark threshold notification as notified
            $query = "UPDATE achievement_threshold_notifications 
                     SET notified = 1, notification_date = NOW() 
                     WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $notificationId);
            $stmt->execute();
        }
    }
    
    echo "Achievement notification creation completed.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

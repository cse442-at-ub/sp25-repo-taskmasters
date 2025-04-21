<?php
/**
 * Send Achievement Emails
 * 
 * This script sends emails to users who have:
 * 1. Unlocked achievements but haven't been notified yet
 * 2. Reached achievement thresholds (50%, 75%) but haven't been notified yet
 * 
 * It can be run as a cron job to periodically send achievement notifications.
 * 
 * Usage: php send_achievement_emails.php
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
    $query = "SELECT an.id, an.user_id, an.achievement_id, a.name, a.description, a.points, a.icon, u.email, u.username, 
                    'complete' as notification_type, 100 as percent
             FROM achievement_notifications an
             JOIN achievements a ON an.achievement_id = a.id
             JOIN users u ON an.user_id = u.user_id
             WHERE an.notified = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $completeNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get users with threshold notifications that haven't been notified
    $query = "SELECT tn.id, tn.user_id, tn.achievement_id, a.name, a.description, a.points, a.icon, u.email, u.username,
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
        echo "No new achievement notifications to send.\n";
        exit;
    }
    
    echo "Found " . count($completeNotifications) . " complete achievement notifications to send.\n";
    echo "Found " . count($thresholdNotifications) . " threshold achievement notifications to send.\n";
    
    // Group notifications by user
    $userNotifications = [];
    foreach ($notifications as $notification) {
        $userId = $notification['user_id'];
        if (!isset($userNotifications[$userId])) {
            $userNotifications[$userId] = [
                'email' => $notification['email'],
                'username' => $notification['username'],
                'achievements' => []
            ];
        }
        $userNotifications[$userId]['achievements'][] = [
            'id' => $notification['achievement_id'],
            'name' => $notification['name'],
            'description' => $notification['description'],
            'points' => $notification['points'],
            'icon' => $notification['icon'],
            'notification_id' => $notification['id']
        ];
    }
    
    // Send emails to each user
    foreach ($userNotifications as $userId => $userData) {
        $email = $userData['email'];
        $username = $userData['username'];
        $achievements = $userData['achievements'];
        
        echo "Sending achievement notification email to $username ($email)...\n";
        
        // Group achievements by notification type
        $completeAchievements = [];
        $thresholdAchievements = [];
        
        foreach ($achievements as $achievement) {
            if ($achievement['notification_type'] === 'complete') {
                $completeAchievements[] = $achievement;
            } else {
                $thresholdAchievements[] = $achievement;
            }
        }
        
        // Build email content
        $subject = "TaskMasters: Achievement Update";
        
        $htmlBody = "
        <html>
        <head>
            <title>TaskMasters Achievement Notification</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9706e9; color: white; padding: 10px 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .achievement { margin-bottom: 20px; padding: 15px; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                .achievement-header { display: flex; align-items: center; margin-bottom: 10px; }
                .achievement-icon { width: 50px; height: 50px; margin-right: 15px; }
                .achievement-title { font-size: 18px; font-weight: bold; }
                .achievement-description { color: #666; }
                .achievement-points { color: #9706e9; font-weight: bold; }
                .achievement-progress { margin-top: 10px; background-color: #eee; height: 20px; border-radius: 10px; overflow: hidden; }
                .achievement-progress-bar { height: 100%; background-color: #9706e9; }
                .section-title { margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>TaskMasters</h1>
                </div>
                <div class='content'>
                    <h2>Achievement Update for $username</h2>";
        
        // Add completed achievements section if there are any
        if (count($completeAchievements) > 0) {
            $htmlBody .= "
                    <div class='section-title'>
                        <h3>🏆 Completed Achievements</h3>
                    </div>
                    <p>Congratulations! You've unlocked " . count($completeAchievements) . " new achievement" . (count($completeAchievements) > 1 ? "s" : "") . ":</p>";
            
            foreach ($completeAchievements as $achievement) {
                $htmlBody .= "
                    <div class='achievement'>
                        <div class='achievement-header'>
                            <img src='https://se-dev.cse.buffalo.edu/CSE442/2025-Spring/cse-442h/taskmasters/src/assets/" . $achievement['icon'] . "' alt='" . $achievement['name'] . "' class='achievement-icon'>
                            <div>
                                <div class='achievement-title'>" . $achievement['name'] . "</div>
                                <div class='achievement-points'>+" . $achievement['points'] . " points</div>
                            </div>
                        </div>
                        <div class='achievement-description'>" . $achievement['description'] . "</div>
                        <div class='achievement-progress'>
                            <div class='achievement-progress-bar' style='width: 100%'></div>
                        </div>
                    </div>";
            }
        }
        
        // Add threshold achievements section if there are any
        if (count($thresholdAchievements) > 0) {
            $htmlBody .= "
                    <div class='section-title'>
                        <h3>🚀 Achievement Progress</h3>
                    </div>
                    <p>You're making great progress on " . count($thresholdAchievements) . " achievement" . (count($thresholdAchievements) > 1 ? "s" : "") . ":</p>";
            
            foreach ($thresholdAchievements as $achievement) {
                $htmlBody .= "
                    <div class='achievement'>
                        <div class='achievement-header'>
                            <img src='https://se-dev.cse.buffalo.edu/CSE442/2025-Spring/cse-442h/taskmasters/src/assets/" . $achievement['icon'] . "' alt='" . $achievement['name'] . "' class='achievement-icon'>
                            <div>
                                <div class='achievement-title'>" . $achievement['name'] . " - " . $achievement['percent'] . "% Complete</div>
                                <div class='achievement-points'>+" . $achievement['points'] . " points when completed</div>
                            </div>
                        </div>
                        <div class='achievement-description'>" . $achievement['description'] . "</div>
                        <div class='achievement-progress'>
                            <div class='achievement-progress-bar' style='width: " . $achievement['percent'] . "%'></div>
                        </div>
                    </div>";
            }
        }
        
        $htmlBody .= "
                    <p>Keep up the good work!</p>
                    <p><a href='https://se-dev.cse.buffalo.edu/CSE442/2025-Spring/cse-442h/taskmasters/#/achievements'>View all your achievements</a></p>
                </div>
                <div class='footer'>
                    <p>TaskMasters - Organize your tasks efficiently</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Send the email
        $result = EmailSender::sendHtmlEmail($email, $subject, $htmlBody);
        
        if ($result) {
            echo "Email sent successfully to $email.\n";
            
            // Update notification status
            foreach ($achievements as $achievement) {
                $notificationId = $achievement['notification_id'];
                $notificationType = $achievement['notification_type'];
                
                if ($notificationType === 'complete') {
                    $query = "UPDATE achievement_notifications 
                             SET notified = 1, notification_date = NOW() 
                             WHERE id = :id";
                } else {
                    $query = "UPDATE achievement_threshold_notifications 
                             SET notified = 1, notification_date = NOW() 
                             WHERE id = :id";
                }
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $notificationId);
                $stmt->execute();
            }
        } else {
            echo "Failed to send email to $email.\n";
        }
    }
    
    echo "Achievement email sending completed.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

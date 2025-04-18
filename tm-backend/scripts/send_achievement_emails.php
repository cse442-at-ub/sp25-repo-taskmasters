<?php
/**
 * Send Achievement Emails
 * 
 * This script sends emails to users who have unlocked achievements but haven't been notified yet.
 * It can be run as a cron job to periodically send achievement notifications.
 * 
 * Usage: php send_achievement_emails.php
 */

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
    
    // Get users with unlocked achievements that haven't been notified
    $query = "SELECT an.id, an.user_id, an.achievement_id, a.name, a.description, a.points, a.icon, u.email, u.username
             FROM achievement_notifications an
             JOIN achievements a ON an.achievement_id = a.id
             JOIN users u ON an.user_id = u.user_id
             WHERE an.notified = 0";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($notifications) === 0) {
        echo "No new achievement notifications to send.\n";
        exit;
    }
    
    echo "Found " . count($notifications) . " achievement notifications to send.\n";
    
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
        
        // Build email content
        $subject = "TaskMasters: You've Unlocked " . count($achievements) . " Achievement" . (count($achievements) > 1 ? "s" : "");
        
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
                .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>TaskMasters</h1>
                </div>
                <div class='content'>
                    <h2>Congratulations, $username!</h2>
                    <p>You've unlocked " . count($achievements) . " new achievement" . (count($achievements) > 1 ? "s" : "") . ":</p>";
        
        foreach ($achievements as $achievement) {
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
                    </div>";
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
                $query = "UPDATE achievement_notifications 
                         SET notified = 1, notification_date = NOW() 
                         WHERE id = :id";
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

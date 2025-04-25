<?php
// Start session for CSRF protection
session_start();

// Set secure headers
header("Access-Control-Allow-Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
// Less restrictive CSP for development
header("Content-Security-Policy: default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:;");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';

// Function to sanitize input data
function sanitizeInput($data) {
    if (is_string($data)) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    return $data;
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Ensure achievement_notifications table exists
    ensureAchievementNotificationsTableExists($db);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = isset($_GET['userId']) ? sanitizeInput($_GET['userId']) : null;
        
        if (!$userId) {
            throw new Exception("User ID is required");
        }

        // Get unread achievement notifications
        $notifications = getUnreadAchievementNotifications($db, $userId);
        
        http_response_code(200);
        echo json_encode($notifications);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);

        if (!$data) {
            throw new Exception("No input received");
        }

        if (isset($data->action) && $data->action === 'markAsRead') {
            if (!isset($data->userId) || !isset($data->notificationId)) {
                throw new Exception("User ID and Notification ID are required");
            }

            $result = markNotificationAsRead($db, $data->userId, $data->notificationId);
            
            http_response_code(200);
            echo json_encode($result);
        } else {
            throw new Exception("Invalid action");
        }
    } else {
        throw new Exception("Method not allowed");
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Database error",
        "error" => $e->getMessage()
    ));
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Error",
        "error" => $e->getMessage()
    ));
}

function ensureAchievementNotificationsTableExists($db) {
    try {
        // Check if achievement_notifications table exists
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
                read_status BOOLEAN DEFAULT 0,
                notification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_achievement (user_id, achievement_id)
            )";
            $db->exec($query);
            
            // Initialize with existing unlocked achievements
            $query = "INSERT INTO achievement_notifications (user_id, achievement_id, notified, read_status)
                     SELECT user_id, achievement_id, 1, 1 FROM user_achievements";
            $db->exec($query);
        } else {
            // Check if read_status column exists
            $query = "SHOW COLUMNS FROM achievement_notifications LIKE 'read_status'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $columnExists = $stmt->rowCount() > 0;
            
            if (!$columnExists) {
                // Add read_status column
                $query = "ALTER TABLE achievement_notifications ADD COLUMN read_status BOOLEAN DEFAULT 0";
                $db->exec($query);
                
                // Set existing notifications as read
                $query = "UPDATE achievement_notifications SET read_status = 1 WHERE notified = 1";
                $db->exec($query);
            }
        }
        
        // Check if achievements table has points column
        $query = "SHOW COLUMNS FROM achievements LIKE 'points'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $pointsColumnExists = $stmt->rowCount() > 0;
        
        if (!$pointsColumnExists) {
            // Add points column to achievements table
            error_log("Adding points column to achievements table");
            $query = "ALTER TABLE achievements ADD COLUMN points INT NOT NULL DEFAULT 100";
            $db->exec($query);
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Error ensuring achievement_notifications table exists: " . $e->getMessage());
        throw $e;
    }
}

function getUnreadAchievementNotifications($db, $userId) {
    try {
        // Get unread achievement notifications
        $query = "SELECT an.id as notification_id, an.achievement_id, a.name, a.description, a.icon, 
                 COALESCE(a.points, 100) as points, an.notification_date
                 FROM achievement_notifications an
                 JOIN achievements a ON an.achievement_id = a.id
                 WHERE an.user_id = :userId AND an.notified = 1 AND an.read_status = 0
                 ORDER BY an.notification_date DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array(
            'notifications' => $notifications,
            'count' => count($notifications)
        );
    } catch (Exception $e) {
        error_log("Error getting unread achievement notifications: " . $e->getMessage());
        throw $e;
    }
}

function markNotificationAsRead($db, $userId, $notificationId) {
    try {
        // Mark notification as read
        $query = "UPDATE achievement_notifications 
                 SET read_status = 1 
                 WHERE id = :notificationId AND user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':notificationId', $notificationId);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            return array(
                'success' => true,
                'message' => 'Notification marked as read'
            );
        } else {
            return array(
                'success' => false,
                'message' => 'Notification not found or already read'
            );
        }
    } catch (Exception $e) {
        error_log("Error marking notification as read: " . $e->getMessage());
        throw $e;
    }
}
?>

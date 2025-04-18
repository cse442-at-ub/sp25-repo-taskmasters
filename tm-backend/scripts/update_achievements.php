<?php
/**
 * Update Achievements
 * 
 * This script updates achievement progress for all users and unlocks achievements
 * that meet the criteria. It can be run as a cron job to periodically update achievements.
 * 
 * Usage: php update_achievements.php
 */

// Include database configuration
include_once '../config/database.php';
include_once '../api/achievements.php';

try {
    echo "Updating achievements for all users...\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get all users
    $query = "SELECT user_id, username FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) === 0) {
        echo "No users found.\n";
        exit;
    }
    
    echo "Found " . count($users) . " users.\n";
    
    // Check achievements for each user
    foreach ($users as $user) {
        $userId = $user['user_id'];
        $username = $user['username'];
        
        echo "Checking achievements for user $username (ID: $userId)...\n";
        
        // Check all achievements for the user
        $result = checkAllAchievements($db, $userId);
        
        echo "Updated " . count($result['updatedProgress']) . " achievement progress records.\n";
        
        if (count($result['unlockedAchievements']) > 0) {
            echo "Unlocked " . count($result['unlockedAchievements']) . " achievements:\n";
            foreach ($result['unlockedAchievements'] as $achievement) {
                echo "- " . $achievement['name'] . " (" . $achievement['points'] . " points)\n";
                
                // Insert into achievement_notifications table if it exists
                $query = "SHOW TABLES LIKE 'achievement_notifications'";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $tableExists = $stmt->rowCount() > 0;
                
                if ($tableExists) {
                    // Check if notification already exists
                    $query = "SELECT id FROM achievement_notifications 
                             WHERE user_id = :userId AND achievement_id = :achievementId";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(':userId', $userId);
                    $stmt->bindParam(':achievementId', $achievement['id']);
                    $stmt->execute();
                    
                    if ($stmt->rowCount() === 0) {
                        // Insert new notification
                        $query = "INSERT INTO achievement_notifications (user_id, achievement_id, notified) 
                                 VALUES (:userId, :achievementId, 0)";
                        $stmt = $db->prepare($query);
                        $stmt->bindParam(':userId', $userId);
                        $stmt->bindParam(':achievementId', $achievement['id']);
                        $stmt->execute();
                        
                        echo "  Added notification for achievement " . $achievement['name'] . "\n";
                    }
                }
            }
        } else {
            echo "No new achievements unlocked.\n";
        }
        
        echo "\n";
    }
    
    echo "Achievement update completed.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

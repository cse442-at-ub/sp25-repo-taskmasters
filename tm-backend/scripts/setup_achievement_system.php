<?php
/**
 * Setup Achievement System
 * 
 * This script sets up the achievement system by:
 * 1. Creating the necessary tables
 * 2. Initializing the achievements
 * 3. Setting up the achievement notifications
 * 
 * Usage: php setup_achievement_system.php
 */

// Include database configuration
include_once '../config/database.php';
include_once '../api/achievements.php';

try {
    echo "Setting up achievement system...\n\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Step 1: Create the necessary tables
    echo "Step 1: Creating necessary tables...\n";
    
    // Create achievement_progress table
    include_once 'create_achievement_progress_table.php';
    
    // Step 2: Ensure achievements table exists and initialize achievements
    echo "\nStep 2: Initializing achievements...\n";
    ensureAchievementsTablesExist($db);
    
    // Step 3: Set up achievement notifications
    echo "\nStep 3: Setting up achievement notifications...\n";
    
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
    } else {
        echo "Achievement notifications table already exists.\n";
    }
    
    // Step 4: Update achievement progress for all users
    echo "\nStep 4: Updating achievement progress for all users...\n";
    
    // Get all users
    $query = "SELECT user_id, username FROM users";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) === 0) {
        echo "No users found.\n";
    } else {
        echo "Found " . count($users) . " users.\n";
        
        foreach ($users as $user) {
            $userId = $user['user_id'];
            $username = $user['username'];
            
            echo "Initializing achievement progress for user $username (ID: $userId)...\n";
            
            // Get user achievements data (this will initialize progress)
            getUserAchievementsData($db, $userId);
            
            // Check all achievements for the user
            $result = checkAllAchievements($db, $userId);
            
            echo "Updated " . count($result['updatedProgress']) . " achievement progress records.\n";
            if (count($result['unlockedAchievements']) > 0) {
                echo "Unlocked " . count($result['unlockedAchievements']) . " achievements.\n";
                foreach ($result['unlockedAchievements'] as $achievement) {
                    echo "- " . $achievement['name'] . " (" . $achievement['points'] . " points)\n";
                }
            }
        }
    }
    
    echo "\nAchievement system setup completed successfully!\n";
    echo "\nTo update achievements for all users, run: php update_achievements.php\n";
    echo "To send achievement emails, run: php send_achievement_emails.php\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

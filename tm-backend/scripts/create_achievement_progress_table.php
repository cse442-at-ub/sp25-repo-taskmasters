<?php
/**
 * Create Achievement Progress Table
 * 
 * This script creates the achievement_progress table in the database.
 * The table is used to track user progress towards achievements.
 * 
 * Usage: php create_achievement_progress_table.php
 */

// Include database configuration
include_once '../config/database.php';

try {
    echo "Creating achievement_progress table...\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if achievement_progress table exists
    $query = "SHOW TABLES LIKE 'achievement_progress'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "Achievement progress table already exists.\n";
        exit;
    }
    
    // Create achievement_progress table
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
    
    // Check if completed_tasks table exists
    $query = "SHOW TABLES LIKE 'completed_tasks'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $completedTasksTableExists = $stmt->rowCount() > 0;
    
    if (!$completedTasksTableExists) {
        echo "Creating completed_tasks table...\n";
        
        // Create completed_tasks table
        $query = "CREATE TABLE completed_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            task_id INT NOT NULL,
            completed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_task (user_id, task_id)
        )";
        
        $db->exec($query);
        
        echo "Completed tasks table created successfully.\n";
    } else {
        echo "Completed tasks table already exists.\n";
    }
    
    // Check if user_points table exists
    $query = "SHOW TABLES LIKE 'user_points'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $userPointsTableExists = $stmt->rowCount() > 0;
    
    if (!$userPointsTableExists) {
        echo "Creating user_points table...\n";
        
        // Create user_points table
        $query = "CREATE TABLE user_points (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            total_points INT NOT NULL DEFAULT 0,
            level INT NOT NULL DEFAULT 1,
            UNIQUE KEY unique_user_id (user_id)
        )";
        
        $db->exec($query);
        
        echo "User points table created successfully.\n";
    } else {
        echo "User points table already exists.\n";
    }
    
    echo "All achievement-related tables have been created successfully.\n";
    
} catch(PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

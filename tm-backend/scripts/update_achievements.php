<?php
// Script to update achievements in the database to match the frontend

// Include database configuration
include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "Connected to database successfully.\n";
    
    // Check if achievements table exists
    $query = "SHOW TABLES LIKE 'achievements'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $achievementsTableExists = $stmt->rowCount() > 0;
    
    if (!$achievementsTableExists) {
        echo "Creating achievements table...\n";
        
        $query = "CREATE TABLE achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255) NOT NULL,
            icon VARCHAR(255) NOT NULL,
            points INT NOT NULL DEFAULT 100,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        $db->exec($query);
        
        echo "Achievements table created successfully.\n";
    } else {
        echo "Achievements table already exists.\n";
        
        // Clear existing achievements to avoid duplicates
        echo "Clearing existing achievements...\n";
        $query = "TRUNCATE TABLE achievements";
        $db->exec($query);
        
        echo "Existing achievements cleared.\n";
    }
    
    // Check if user_achievements table exists
    $query = "SHOW TABLES LIKE 'user_achievements'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $userAchievementsTableExists = $stmt->rowCount() > 0;
    
    if (!$userAchievementsTableExists) {
        echo "Creating user_achievements table...\n";
        
        $query = "CREATE TABLE user_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            achievement_id INT NOT NULL,
            unlocked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        )";
        $db->exec($query);
        
        echo "User achievements table created successfully.\n";
    } else {
        echo "User achievements table already exists.\n";
    }
    
    // Insert achievements from frontend
    echo "Inserting achievements from frontend...\n";
    
    $achievements = [
        [
            'id' => 1,
            'name' => 'First Task',
            'description' => 'Complete your first task',
            'icon' => 'FirstTask.png',
            'points' => 100
        ],
        [
            'id' => 2,
            'name' => 'Task Streak',
            'description' => 'Complete tasks for 7 days in a row',
            'icon' => 'TaskStreak.png',
            'points' => 500
        ],
        [
            'id' => 3,
            'name' => 'Early Bird',
            'description' => 'Complete 5 tasks before 9 AM',
            'icon' => 'EarlyBird.png',
            'points' => 300
        ],
        [
            'id' => 4,
            'name' => 'Night Owl',
            'description' => 'Complete 5 tasks after 10 PM',
            'icon' => 'NightOwl.png',
            'points' => 300
        ],
        [
            'id' => 5,
            'name' => 'Task Master',
            'description' => 'Complete 50 tasks in total',
            'icon' => 'TaskMaster.png',
            'points' => 1000
        ],
        [
            'id' => 6,
            'name' => 'Perfect Week',
            'description' => 'Complete all tasks in a week',
            'icon' => 'PerfectWeek.png',
            'points' => 800
        ],
        [
            'id' => 7,
            'name' => 'Big Spender',
            'description' => 'Buy 5 avatars',
            'icon' => 'BigSpender.png',
            'points' => 400
        ],
        [
            'id' => 8,
            'name' => 'Time Manager',
            'description' => 'Complete 10 tasks on time',
            'icon' => 'TimeManager.png',
            'points' => 600
        ],
        [
            'id' => 9,
            'name' => 'Task Explorer',
            'description' => 'Create tasks in 5 different categories',
            'icon' => 'TaskExplorer.png',
            'points' => 400
        ],
        [
            'id' => 10,
            'name' => 'Achievement Hunter',
            'description' => 'Unlock 5 achievements',
            'icon' => 'AchievementHunter.png',
            'points' => 1000
        ],
        // Add the achievements from the test cases
        [
            'id' => 11,
            'name' => 'Consistent Student',
            'description' => 'Complete 5 school-related tasks',
            'icon' => 'FirstTask.png', // Using a placeholder icon
            'points' => 300
        ],
        [
            'id' => 12,
            'name' => 'Dedicated Worker',
            'description' => 'Complete 3 Work tasks',
            'icon' => 'TaskStreak.png', // Using a placeholder icon
            'points' => 300
        ],
        [
            'id' => 13,
            'name' => 'Daily Task Master',
            'description' => 'Complete 3+ tasks in one day',
            'icon' => 'TaskMaster.png', // Using a placeholder icon
            'points' => 300
        ]
    ];
    
    foreach ($achievements as $achievement) {
        $query = "INSERT INTO achievements (id, name, description, icon, points) 
                 VALUES (:id, :name, :description, :icon, :points)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $achievement['id']);
        $stmt->bindParam(':name', $achievement['name']);
        $stmt->bindParam(':description', $achievement['description']);
        $stmt->bindParam(':icon', $achievement['icon']);
        $stmt->bindParam(':points', $achievement['points']);
        $stmt->execute();
        
        echo "Inserted achievement: " . $achievement['name'] . "\n";
    }
    
    echo "All achievements inserted successfully.\n";
    
    // Update the auto-increment value to avoid conflicts
    $query = "ALTER TABLE achievements AUTO_INCREMENT = " . (count($achievements) + 1);
    $db->exec($query);
    
    echo "Auto-increment value updated.\n";
    
    echo "Script completed successfully.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

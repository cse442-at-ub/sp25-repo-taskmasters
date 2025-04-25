<?php
/**
 * Test Achievement System
 * 
 * This script tests the achievement system by:
 * 1. Creating a test user if one doesn't exist
 * 2. Creating test tasks for the user
 * 3. Completing some of the tasks to trigger achievements
 * 4. Checking achievement progress and notifications
 * 
 * Usage: php test_achievement_system.php
 */

// Include database configuration
include_once '../config/database.php';
include_once '../api/achievements.php';

try {
    echo "Testing achievement system...\n\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Create a test user if one doesn't exist
    echo "Creating test user...\n";
    $testUsername = "achievement_test_user";
    $testEmail = "achievement_test@example.com";
    $testPassword = password_hash("password123", PASSWORD_DEFAULT);
    
    // Check if test user already exists
    $query = "SELECT user_id FROM users WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $testUsername);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $userId = $stmt->fetch(PDO::FETCH_COLUMN);
        echo "Test user already exists with ID: $userId\n";
    } else {
        // Create test user
        $query = "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $testUsername);
        $stmt->bindParam(':email', $testEmail);
        $stmt->bindParam(':password', $testPassword);
        $stmt->execute();
        
        $userId = $db->lastInsertId();
        echo "Created test user with ID: $userId\n";
    }
    
    // Create test tasks for different categories
    echo "\nCreating test tasks...\n";
    $categories = ['Work', 'School', 'Personal', 'Shopping', 'Health'];
    $taskCount = 0;
    
    foreach ($categories as $category) {
        // Create 3 tasks for each category
        for ($i = 1; $i <= 3; $i++) {
            $taskName = "$category Task $i";
            $taskDescription = "This is a test task for $category category";
            $taskDate = date('Y-m-d');
            $taskTime = date('H:i:s');
            
            // Check if task already exists
            $query = "SELECT task_id FROM tasks WHERE user_id = :userId AND task_name = :taskName";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':taskName', $taskName);
            $stmt->execute();
            
            if ($stmt->rowCount() === 0) {
                // Create task
                $query = "INSERT INTO tasks (user_id, task_name, task_description, task_startDate, Task_time, task_tags) 
                         VALUES (:userId, :taskName, :taskDescription, :taskDate, :taskTime, :category)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':taskName', $taskName);
                $stmt->bindParam(':taskDescription', $taskDescription);
                $stmt->bindParam(':taskDate', $taskDate);
                $stmt->bindParam(':taskTime', $taskTime);
                $stmt->bindParam(':category', $category);
                $stmt->execute();
                
                $taskId = $db->lastInsertId();
                echo "Created task: $taskName (ID: $taskId)\n";
                $taskCount++;
            }
        }
    }
    
    echo "Created $taskCount new tasks.\n";
    
    // Get all tasks for the user
    $query = "SELECT task_id, task_name, task_tags FROM tasks WHERE user_id = :userId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nCompleting tasks to trigger achievements...\n";
    
    // Complete some tasks to trigger achievements
    $completedCount = 0;
    $schoolTasksCompleted = 0;
    $workTasksCompleted = 0;
    
    foreach ($tasks as $task) {
        // Skip if task is already completed
        $query = "SELECT id FROM completed_tasks WHERE user_id = :userId AND task_id = :taskId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':taskId', $task['task_id']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            continue;
        }
        
        // Complete the task based on category to trigger specific achievements
        $shouldComplete = false;
        
        if ($task['task_tags'] === 'School' && $schoolTasksCompleted < 3) {
            $shouldComplete = true;
            $schoolTasksCompleted++;
        } else if ($task['task_tags'] === 'Work' && $workTasksCompleted < 2) {
            $shouldComplete = true;
            $workTasksCompleted++;
        } else if ($completedCount < 5) {
            $shouldComplete = true;
        }
        
        if ($shouldComplete) {
            // Complete the task
            $query = "INSERT INTO completed_tasks (user_id, task_id) VALUES (:userId, :taskId)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':taskId', $task['task_id']);
            $stmt->execute();
            
            echo "Completed task: " . $task['task_name'] . " (" . $task['task_tags'] . ")\n";
            $completedCount++;
            
            // Check achievements after each task completion
            $result = checkTaskAchievements($db, $userId, $task['task_id']);
            
            if ($result['success'] && count($result['unlockedAchievements']) > 0) {
                echo "Unlocked " . count($result['unlockedAchievements']) . " achievements:\n";
                foreach ($result['unlockedAchievements'] as $achievement) {
                    echo "- " . $achievement['name'] . " (" . $achievement['points'] . " points)\n";
                }
            }
        }
    }
    
    echo "\nCompleted $completedCount tasks.\n";
    
    // Check achievement progress
    echo "\nChecking achievement progress...\n";
    $result = checkAllAchievements($db, $userId);
    
    if ($result['success']) {
        echo "Updated " . count($result['updatedProgress']) . " achievement progress records.\n";
        
        foreach ($result['updatedProgress'] as $progress) {
            echo "- " . $progress['name'] . ": " . $progress['current_value'] . "/" . $progress['target_value'] . 
                 " (" . $progress['percent'] . "%)\n";
        }
        
        if (count($result['unlockedAchievements']) > 0) {
            echo "\nUnlocked " . count($result['unlockedAchievements']) . " achievements:\n";
            foreach ($result['unlockedAchievements'] as $achievement) {
                echo "- " . $achievement['name'] . " (" . $achievement['points'] . " points)\n";
            }
        }
        
        if (count($result['thresholdNotifications']) > 0) {
            echo "\nCreated " . count($result['thresholdNotifications']) . " threshold notifications:\n";
            foreach ($result['thresholdNotifications'] as $notification) {
                echo "- " . $notification['name'] . " reached " . $notification['threshold'] . "% (" . 
                     $notification['current_percent'] . "%)\n";
            }
        }
    } else {
        echo "Error checking achievements: " . $result['message'] . "\n";
    }
    
    // Check achievement notifications
    echo "\nChecking achievement notifications...\n";
    
    // Check completion notifications
    $query = "SELECT an.id, a.name, an.notified 
             FROM achievement_notifications an
             JOIN achievements a ON an.achievement_id = a.id
             WHERE an.user_id = :userId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($notifications) > 0) {
        echo "Found " . count($notifications) . " completion notifications:\n";
        foreach ($notifications as $notification) {
            echo "- " . $notification['name'] . " (Notified: " . ($notification['notified'] ? 'Yes' : 'No') . ")\n";
        }
    } else {
        echo "No completion notifications found.\n";
    }
    
    // Check threshold notifications
    $query = "SELECT tn.id, a.name, tn.threshold, tn.current_percent, tn.notified 
             FROM achievement_threshold_notifications tn
             JOIN achievements a ON tn.achievement_id = a.id
             WHERE tn.user_id = :userId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();
    $thresholdNotifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($thresholdNotifications) > 0) {
        echo "\nFound " . count($thresholdNotifications) . " threshold notifications:\n";
        foreach ($thresholdNotifications as $notification) {
            echo "- " . $notification['name'] . " reached " . $notification['threshold'] . "% (" . 
                 $notification['current_percent'] . "%) (Notified: " . ($notification['notified'] ? 'Yes' : 'No') . ")\n";
        }
    } else {
        echo "No threshold notifications found.\n";
    }
    
    echo "\nAchievement system test completed.\n";
    echo "You can now run 'php send_achievement_emails.php' to create achievement notifications.\n";
    echo "Note: The system now uses in-app notifications instead of emails for achievements.\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

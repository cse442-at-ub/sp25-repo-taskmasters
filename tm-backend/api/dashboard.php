<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    $database = new Database();
    $db = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
            
            error_log("Received request for user ID: $userId");
            
            if (!$userId) {
                error_log("No user ID provided in request");
                throw new Exception("User ID is required");
            }

            $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
            error_log("Using date: $date for user ID: $userId");

            $tasks = getTodaysTasks($db, $userId, $date);
            error_log("Retrieved " . count($tasks) . " tasks for user ID: $userId");
            
            // Get user level
            $userLevel = getUserLevel($db, $userId);
            
            // Get user achievements
            $achievements = getUserAchievements($db, $userId);

            $response = array(
                'tasks' => $tasks,
                'level' => $userLevel,
                'achievements' => $achievements
            );

            http_response_code(200);
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array(
                "message" => "Error processing GET request",
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString()
            ));
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        try {
            $input = file_get_contents("php://input");
            $data = json_decode($input);

            if (!$data) {
                throw new Exception("No input received");
            }

            if (isset($data->action) && $data->action === 'completeTask') {
                if (!isset($data->taskId) || !isset($data->userId) || !isset($data->completed)) {
                    throw new Exception("Task ID, User ID, and completed status are required");
                }

                $result = completeTask($db, $data->taskId, $data->userId, $data->completed);
                
                http_response_code(200);
                echo json_encode($result);
            } else {
                throw new Exception("Invalid action");
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(array(
                "message" => "Error processing POST request",
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString()
            ));
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

function getTodaysTasks($db, $userId, $date) {
    try {
        error_log("Fetching tasks for userId: $userId, date: $date");
        
        // Format the date to ensure consistent comparison
        $formattedDate = date('Y-m-d', strtotime($date));
        error_log("Formatted date for comparison: $formattedDate");
        
        // Get current date for comparison
        $currentDate = date('Y-m-d');
        error_log("Current date: $currentDate");
        
        // Query to get tasks for the specified date
        $query = "SELECT t.*, 
                DATE_FORMAT(t.Task_time, '%H:%i:%s') as formatted_time,
                CASE WHEN ct.task_id IS NOT NULL THEN 1 ELSE 0 END AS completed
                FROM tasks t
                LEFT JOIN completed_tasks ct ON t.task_id = ct.task_id AND ct.user_id = :userId
                WHERE t.user_id = :userId 
                AND (
                    t.task_startDate = :formattedDate 
                    OR (t.task_Title LIKE '%Today%' AND :currentDate = :formattedDate)
                )
                ORDER BY t.task_tags, t.Task_time";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':formattedDate', $formattedDate);
        $stmt->bindParam(':currentDate', $currentDate);
        $stmt->execute();
        
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Found " . count($tasks) . " tasks for userId: $userId, date: $date");
        
        return $tasks;
    } catch (Exception $e) {
        error_log("Error in getTodaysTasks: " . $e->getMessage());
        return array();
    }
}

function completeTask($db, $taskId, $userId, $completed) {
    try {
        ensureCompletedTasksTableExists($db);
        
        // Get task details
        $query = "SELECT * FROM tasks WHERE task_id = :taskId AND user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':taskId', $taskId);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            throw new Exception("Task not found or does not belong to the user");
        }
        
        if ($completed) {
            // Check if task is already completed
            $checkQuery = "SELECT * FROM completed_tasks WHERE task_id = :taskId AND user_id = :userId";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':taskId', $taskId);
            $checkStmt->bindParam(':userId', $userId);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                // Task is already completed, return existing data
                return array(
                    'message' => 'Task is already completed',
                    'success' => true,
                    'level' => getUserLevel($db, $userId),
                    'achievements' => getUserAchievements($db, $userId)
                );
            }
            
            // Determine points based on priority
            $points = 0;
            switch (strtolower($task['task_priority'])) {
                case 'high':
                    $points = 30;
                    break;
                case 'medium':
                    $points = 20;
                    break;
                case 'low':
                    $points = 10;
                    break;
                default:
                    $points = 10;
            }
            
            // Mark task as completed with points
            $query = "INSERT INTO completed_tasks (task_id, user_id, points) 
                    VALUES (:taskId, :userId, :points)
                    ON DUPLICATE KEY UPDATE completed_date = CURRENT_TIMESTAMP, points = :pointsUpdate";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':taskId', $taskId);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':points', $points);
            $stmt->bindParam(':pointsUpdate', $points);
            $stmt->execute();
            
            // Update user points
            updateUserPoints($db, $userId, $points);
            
            // Check for achievements
            $achievements = checkAchievements($db, $userId);
            
            // Get updated user level
            $userLevel = getUserLevel($db, $userId);
            
            return array(
                'message' => 'Task marked as completed',
                'success' => true,
                'points' => $points,
                'level' => $userLevel,
                'achievements' => $achievements
            );
        } else {
            // Get the points that were awarded for this task
            $query = "SELECT points FROM completed_tasks WHERE task_id = :taskId AND user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':taskId', $taskId);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            $completedTask = $stmt->fetch(PDO::FETCH_ASSOC);
            $pointsToRemove = $completedTask ? $completedTask['points'] : 0;
            
            // Remove the task from completed_tasks
            $query = "DELETE FROM completed_tasks WHERE task_id = :taskId AND user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':taskId', $taskId);
            $stmt->bindParam(':userId', $userId);
            $stmt->execute();
            
            // Update user points (subtract points)
            if ($pointsToRemove > 0) {
                updateUserPoints($db, $userId, -$pointsToRemove);
            }
            
            // Get updated user level
            $userLevel = getUserLevel($db, $userId);
            
            return array(
                'message' => 'Task marked as not completed',
                'success' => true,
                'level' => $userLevel
            );
        }
    } catch (Exception $e) {
        error_log("Error in completeTask: " . $e->getMessage());
        throw $e;
    }
}

// Function to update user points
function updateUserPoints($db, $userId, $pointsToAdd) {
    try {
        // Check if user exists in user_points table
        $query = "SELECT * FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Update existing user points
            $query = "UPDATE user_points SET total_points = total_points + :points WHERE user_id = :userId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':points', $pointsToAdd);
            $stmt->execute();
        } else {
            // Insert new user points record
            $query = "INSERT INTO user_points (user_id, total_points, level) VALUES (:userId, :points, 1)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':points', $pointsToAdd);
            $stmt->execute();
        }
        
        // Update level based on total points
        $query = "SELECT total_points FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $totalPoints = $result['total_points'];
        
        // Calculate level (1 level per 100 points)
        $level = floor($totalPoints / 100) + 1;
        
        // Update level
        $query = "UPDATE user_points SET level = :level WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':level', $level);
        $stmt->execute();
        
        return true;
    } catch (Exception $e) {
        error_log("Error in updateUserPoints: " . $e->getMessage());
        return false;
    }
}

// Function to get user level and progress
function getUserLevel($db, $userId) {
    try {
        $query = "SELECT total_points, level FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $totalPoints = $result['total_points'];
            $level = $result['level'];
            
            // Calculate points needed for next level
            $pointsForNextLevel = $level * 100;
            
            // Calculate progress percentage
            $progress = ($totalPoints % 100);
            
            return array(
                'level' => $level,
                'totalPoints' => $totalPoints,
                'pointsForNextLevel' => $pointsForNextLevel,
                'progress' => $progress
            );
        } else {
            // Default values for new users
            return array(
                'level' => 1,
                'totalPoints' => 0,
                'pointsForNextLevel' => 100,
                'progress' => 0
            );
        }
    } catch (Exception $e) {
        error_log("Error in getUserLevel: " . $e->getMessage());
        return array(
            'level' => 1,
            'totalPoints' => 0,
            'pointsForNextLevel' => 100,
            'progress' => 0
        );
    }
}

// Function to get user achievements
function getUserAchievements($db, $userId) {
    try {
        // Get all user achievements
        $query = "SELECT a.* FROM user_achievements ua 
                 JOIN achievements a ON ua.achievement_id = a.id 
                 WHERE ua.user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $userAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all possible achievements
        $query = "SELECT * FROM achievements";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $allAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array(
            'unlocked' => $userAchievements,
            'total' => count($userAchievements),
            'totalPossible' => count($allAchievements)
        );
    } catch (Exception $e) {
        error_log("Error in getUserAchievements: " . $e->getMessage());
        return array(
            'unlocked' => array(),
            'total' => 0,
            'totalPossible' => 5
        );
    }
}

// Function to check and award achievements
function checkAchievements($db, $userId) {
    try {
        $achievements = array();
        $today = date('Y-m-d');
        
        // Get all completed tasks for today
        $query = "SELECT t.task_id, t.task_tags, t.task_priority 
                 FROM completed_tasks ct 
                 JOIN tasks t ON ct.task_id = t.task_id 
                 WHERE ct.user_id = :userId 
                 AND DATE(ct.completed_date) = :today";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':today', $today);
        $stmt->execute();
        $completedTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Count tasks by category
        $categoryCounts = array();
        foreach ($completedTasks as $task) {
            $category = $task['task_tags'] ?: 'Uncategorized';
            if (!isset($categoryCounts[$category])) {
                $categoryCounts[$category] = 0;
            }
            $categoryCounts[$category]++;
        }
        
        // Check for achievements
        
        // 1. Consistent Student - Complete 2 School category tasks in one day
        if (isset($categoryCounts['School']) && $categoryCounts['School'] >= 2) {
            $achievements[] = awardAchievement($db, $userId, 1); // ID 1 for Consistent Student
        }
        
        // 2. Dedicated Worker - Complete 2 Work category tasks in one day
        if (isset($categoryCounts['Work']) && $categoryCounts['Work'] >= 2) {
            $achievements[] = awardAchievement($db, $userId, 2); // ID 2 for Dedicated Worker
        }
        
        // 3. Fitness Guru - Complete a Personal category task
        if (isset($categoryCounts['Personal']) && $categoryCounts['Personal'] >= 1) {
            $achievements[] = awardAchievement($db, $userId, 3); // ID 3 for Fitness Guru
        }
        
        // 4. Daily Task Master - Complete at least 3 tasks in one day
        if (count($completedTasks) >= 3) {
            $achievements[] = awardAchievement($db, $userId, 4); // ID 4 for Daily Task Master
        }
        
        // 5. Productivity Streak - Complete all tasks in one day
        // Get total tasks for today
        $query = "SELECT COUNT(*) as total FROM tasks WHERE user_id = :userId AND task_startDate = :today";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':today', $today);
        $stmt->execute();
        $totalTasks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        if ($totalTasks > 0 && count($completedTasks) >= $totalTasks) {
            $achievements[] = awardAchievement($db, $userId, 5); // ID 5 for Productivity Streak
        }
        
        // Get all user achievements
        $query = "SELECT a.* FROM user_achievements ua 
                 JOIN achievements a ON ua.achievement_id = a.id 
                 WHERE ua.user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $userAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all possible achievements
        $query = "SELECT * FROM achievements";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $allAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array(
            'unlocked' => $userAchievements,
            'total' => count($userAchievements),
            'totalPossible' => count($allAchievements),
            'newlyUnlocked' => $achievements
        );
    } catch (Exception $e) {
        error_log("Error in checkAchievements: " . $e->getMessage());
        return array(
            'unlocked' => array(),
            'total' => 0,
            'totalPossible' => 5,
            'newlyUnlocked' => array()
        );
    }
}

// Function to award an achievement
function awardAchievement($db, $userId, $achievementId) {
    try {
        // Check if user already has this achievement
        $query = "SELECT * FROM user_achievements WHERE user_id = :userId AND achievement_id = :achievementId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':achievementId', $achievementId);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            // Award the achievement
            $query = "INSERT INTO user_achievements (user_id, achievement_id, unlocked_date) 
                     VALUES (:userId, :achievementId, NOW())";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':userId', $userId);
            $stmt->bindParam(':achievementId', $achievementId);
            $stmt->execute();
            
            // Get achievement details
            $query = "SELECT * FROM achievements WHERE id = :achievementId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':achievementId', $achievementId);
            $stmt->execute();
            $achievement = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Add bonus points for achievement
            updateUserPoints($db, $userId, 50); // 50 bonus points per achievement
            
            return array(
                'id' => $achievement['id'],
                'name' => $achievement['name'],
                'description' => $achievement['description'],
                'icon' => $achievement['icon'],
                'isNew' => true
            );
        }
        
        return null;
    } catch (Exception $e) {
        error_log("Error in awardAchievement: " . $e->getMessage());
        return null;
    }
}

function ensureCompletedTasksTableExists($db) {
    $tableExists = false;
    try {
        $query = "SHOW TABLES LIKE 'completed_tasks'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tableExists = $stmt->rowCount() > 0;
    } catch(Exception $e) {
        $tableExists = false;
    }
    
    if (!$tableExists) {
        // Create the completed_tasks table
        $query = "CREATE TABLE completed_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            completed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            points INT DEFAULT 0,
            UNIQUE KEY unique_task_user (task_id, user_id)
        )";
        $db->exec($query);
    } else {
        // Check if points column exists
        try {
            $query = "SHOW COLUMNS FROM completed_tasks LIKE 'points'";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $pointsColumnExists = $stmt->rowCount() > 0;
            
            if (!$pointsColumnExists) {
                // Add points column if it doesn't exist
                $query = "ALTER TABLE completed_tasks ADD COLUMN points INT DEFAULT 0";
                $db->exec($query);
            }
        } catch(Exception $e) {
            error_log("Error checking/adding points column: " . $e->getMessage());
        }
    }
}
?>

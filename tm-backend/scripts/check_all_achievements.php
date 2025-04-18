<?php
// Script to check all achievements for a user and unlock them if criteria are met

// Include database configuration
include_once '../config/database.php';
include_once '../api/achievements.php';

/**
 * Check all achievements for a user and unlock them if criteria are met
 * 
 * @param PDO $db Database connection
 * @param int $userId User ID
 * @return array Result of the operation
 */
function checkAllAchievements($db, $userId) {
    try {
        $unlockedAchievements = [];
        
        // Get all achievements
        $query = "SELECT * FROM achievements";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $allAchievements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get user's unlocked achievements
        $query = "SELECT achievement_id FROM user_achievements WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $userAchievements = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($allAchievements as $achievement) {
            // Skip if already unlocked
            if (in_array($achievement['id'], $userAchievements)) {
                continue;
            }
            
            // Check if achievement should be unlocked based on its description
            $shouldUnlock = false;
            
            switch ($achievement['name']) {
                case 'First Task':
                    $shouldUnlock = checkFirstTaskAchievement($db, $userId);
                    break;
                case 'Task Streak':
                    $shouldUnlock = checkTaskStreakAchievement($db, $userId);
                    break;
                case 'Early Bird':
                    $shouldUnlock = checkEarlyBirdAchievement($db, $userId);
                    break;
                case 'Night Owl':
                    $shouldUnlock = checkNightOwlAchievement($db, $userId);
                    break;
                case 'Task Master':
                    $shouldUnlock = checkTaskMasterAchievement($db, $userId);
                    break;
                case 'Perfect Week':
                    $shouldUnlock = checkPerfectWeekAchievement($db, $userId);
                    break;
                case 'Big Spender':
                    $shouldUnlock = checkBigSpenderAchievement($db, $userId);
                    break;
                case 'Time Manager':
                    $shouldUnlock = checkTimeManagerAchievement($db, $userId);
                    break;
                case 'Task Explorer':
                    $shouldUnlock = checkTaskExplorerAchievement($db, $userId);
                    break;
                case 'Achievement Hunter':
                    $shouldUnlock = checkAchievementHunterAchievement($db, $userId);
                    break;
                case 'Consistent Student':
                    $shouldUnlock = checkConsistentStudentAchievement($db, $userId);
                    break;
                case 'Dedicated Worker':
                    $shouldUnlock = checkDedicatedWorkerAchievement($db, $userId);
                    break;
                case 'Daily Task Master':
                    $shouldUnlock = checkDailyTaskMasterAchievement($db, $userId);
                    break;
                default:
                    // Unknown achievement, skip
                    continue 2;
            }
            
            if ($shouldUnlock) {
                // Unlock the achievement
                $result = unlockAchievement($db, $userId, $achievement['id']);
                if ($result['success']) {
                    $unlockedAchievements[] = $result['achievement'];
                }
            }
        }
        
        return [
            'success' => true,
            'unlockedAchievements' => $unlockedAchievements
        ];
    } catch (Exception $e) {
        error_log("Error checking all achievements: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Error checking achievements: ' . $e->getMessage()
        ];
    }
}

/**
 * Check if "First Task" achievement should be unlocked
 */
function checkFirstTaskAchievement($db, $userId) {
    try {
        // Check if user has completed at least one task
        $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $completedTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $completedTasksCount > 0;
    } catch (Exception $e) {
        error_log("Error checking First Task achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Task Streak" achievement should be unlocked
 */
function checkTaskStreakAchievement($db, $userId) {
    try {
        // Get all completed tasks for the user, ordered by date
        $query = "SELECT DATE(completed_date) as completion_date FROM completed_tasks 
                 WHERE user_id = :userId 
                 ORDER BY completed_date ASC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $completedDates = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($completedDates) < 7) {
            return false;
        }
        
        // Check for a 7-day streak
        $streakCount = 1;
        $maxStreak = 1;
        
        for ($i = 1; $i < count($completedDates); $i++) {
            $prevDate = new DateTime($completedDates[$i-1]);
            $currDate = new DateTime($completedDates[$i]);
            
            // Calculate the difference in days
            $diff = $prevDate->diff($currDate)->days;
            
            if ($diff === 1) {
                // Consecutive day
                $streakCount++;
                $maxStreak = max($maxStreak, $streakCount);
            } else if ($diff === 0) {
                // Same day, continue streak
                continue;
            } else {
                // Streak broken
                $streakCount = 1;
            }
        }
        
        return $maxStreak >= 7;
    } catch (Exception $e) {
        error_log("Error checking Task Streak achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Early Bird" achievement should be unlocked
 */
function checkEarlyBirdAchievement($db, $userId) {
    try {
        // Check if user has completed at least 5 tasks before 9 AM
        $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                 JOIN tasks t ON ct.task_id = t.task_id 
                 WHERE ct.user_id = :userId 
                 AND TIME(t.Task_time) < '09:00:00'";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $earlyTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $earlyTasksCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Early Bird achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Night Owl" achievement should be unlocked
 */
function checkNightOwlAchievement($db, $userId) {
    try {
        // Check if user has completed at least 5 tasks after 10 PM
        $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                 JOIN tasks t ON ct.task_id = t.task_id 
                 WHERE ct.user_id = :userId 
                 AND TIME(t.Task_time) >= '22:00:00'";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $nightTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $nightTasksCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Night Owl achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Task Master" achievement should be unlocked
 */
function checkTaskMasterAchievement($db, $userId) {
    try {
        // Check if user has completed at least 50 tasks
        $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $completedTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $completedTasksCount >= 50;
    } catch (Exception $e) {
        error_log("Error checking Task Master achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Perfect Week" achievement should be unlocked
 */
function checkPerfectWeekAchievement($db, $userId) {
    try {
        // Get all tasks for the user
        $query = "SELECT task_id, task_startDate FROM tasks WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $allTasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get all completed tasks for the user
        $query = "SELECT task_id FROM completed_tasks WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $completedTaskIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Group tasks by week
        $weekTasks = [];
        foreach ($allTasks as $task) {
            $date = new DateTime($task['task_startDate']);
            $weekNumber = $date->format('YW'); // Year and week number
            
            if (!isset($weekTasks[$weekNumber])) {
                $weekTasks[$weekNumber] = [
                    'total' => 0,
                    'completed' => 0
                ];
            }
            
            $weekTasks[$weekNumber]['total']++;
            
            if (in_array($task['task_id'], $completedTaskIds)) {
                $weekTasks[$weekNumber]['completed']++;
            }
        }
        
        // Check if there's any week where all tasks were completed
        foreach ($weekTasks as $week) {
            if ($week['total'] > 0 && $week['total'] === $week['completed']) {
                return true;
            }
        }
        
        return false;
    } catch (Exception $e) {
        error_log("Error checking Perfect Week achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Big Spender" achievement should be unlocked
 */
function checkBigSpenderAchievement($db, $userId) {
    try {
        // Check if user has purchased at least 5 avatars
        $query = "SELECT COUNT(*) as count FROM user_avatars WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $avatarCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $avatarCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Big Spender achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Time Manager" achievement should be unlocked
 */
function checkTimeManagerAchievement($db, $userId) {
    try {
        // Check if user has completed at least 10 tasks on time
        // This is a simplified implementation since we don't track if tasks were completed on time
        // We'll assume all completed tasks were completed on time
        $query = "SELECT COUNT(*) as count FROM completed_tasks WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $completedTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $completedTasksCount >= 10;
    } catch (Exception $e) {
        error_log("Error checking Time Manager achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Task Explorer" achievement should be unlocked
 */
function checkTaskExplorerAchievement($db, $userId) {
    try {
        // Check if user has created tasks in at least 5 different categories
        $query = "SELECT COUNT(DISTINCT task_tags) as count FROM tasks WHERE user_id = :userId AND task_tags != ''";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $categoriesCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $categoriesCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Task Explorer achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Achievement Hunter" achievement should be unlocked
 */
function checkAchievementHunterAchievement($db, $userId) {
    try {
        // Check if user has unlocked at least 5 achievements
        $query = "SELECT COUNT(*) as count FROM user_achievements WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $achievementsCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $achievementsCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Achievement Hunter achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Consistent Student" achievement should be unlocked
 */
function checkConsistentStudentAchievement($db, $userId) {
    try {
        // Check if user has completed at least 5 school-related tasks
        $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                 JOIN tasks t ON ct.task_id = t.task_id 
                 WHERE ct.user_id = :userId AND t.task_tags = 'School'";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $schoolTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $schoolTasksCount >= 5;
    } catch (Exception $e) {
        error_log("Error checking Consistent Student achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Dedicated Worker" achievement should be unlocked
 */
function checkDedicatedWorkerAchievement($db, $userId) {
    try {
        // Check if user has completed at least 3 work-related tasks
        $query = "SELECT COUNT(*) as count FROM completed_tasks ct 
                 JOIN tasks t ON ct.task_id = t.task_id 
                 WHERE ct.user_id = :userId AND t.task_tags = 'Work'";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $workTasksCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $workTasksCount >= 3;
    } catch (Exception $e) {
        error_log("Error checking Dedicated Worker achievement: " . $e->getMessage());
        return false;
    }
}

/**
 * Check if "Daily Task Master" achievement should be unlocked
 */
function checkDailyTaskMasterAchievement($db, $userId) {
    try {
        // Get all completed tasks for the user, grouped by date
        $query = "SELECT DATE(completed_date) as completion_date, COUNT(*) as count 
                 FROM completed_tasks 
                 WHERE user_id = :userId 
                 GROUP BY DATE(completed_date)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $dailyCounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if there's any day with at least 3 completed tasks
        foreach ($dailyCounts as $day) {
            if ($day['count'] >= 3) {
                return true;
            }
        }
        
        return false;
    } catch (Exception $e) {
        error_log("Error checking Daily Task Master achievement: " . $e->getMessage());
        return false;
    }
}

// If this script is run directly, check achievements for the specified user
if (isset($argv[1])) {
    try {
        $userId = $argv[1];
        
        $database = new Database();
        $db = $database->getConnection();
        
        $result = checkAllAchievements($db, $userId);
        
        echo "Checked achievements for user $userId\n";
        echo "Unlocked " . count($result['unlockedAchievements']) . " achievements\n";
        
        foreach ($result['unlockedAchievements'] as $achievement) {
            echo "- " . $achievement['name'] . " (" . $achievement['points'] . " points)\n";
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>

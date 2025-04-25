<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);

        if (!$data) {
            throw new Exception("No input received");
        }


        $hasRecurringColumn = false;
        try {
            $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'Task_recurring'";
            $checkColumnStmt = $db->prepare($checkColumnQuery);
            $checkColumnStmt->execute();
            $hasRecurringColumn = $checkColumnStmt->rowCount() > 0;
        } catch(Exception $e) {
            $hasRecurringColumn = false;
        }

       
        // Check if recurringDays column exists
        $hasRecurringDaysColumn = false;
        try {
            $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'recurringDays'";
            $checkColumnStmt = $db->prepare($checkColumnQuery);
            $checkColumnStmt->execute();
            $hasRecurringDaysColumn = $checkColumnStmt->rowCount() > 0;
        } catch(Exception $e) {
            $hasRecurringDaysColumn = false;
        }

        if ($hasRecurringColumn && $hasRecurringDaysColumn) {
            $query = "INSERT INTO tasks (
                task_Title, 
                task_description, 
                task_duration, 
                task_dueDate, 
                task_tags, 
                task_priority, 
                user_id, 
                Task_time,
                task_startDate,
                created_time,
                Task_recurring,
                recurringDays
            ) VALUES (
                :title,
                :description,
                :duration,
                :dueDate,
                :tags,
                :priority,
                :userId,
                :time,
                :startDate,
                NOW(),
                :recurring,
                :recurringDays
            )";
        } elseif ($hasRecurringColumn) {
            $query = "INSERT INTO tasks (
                task_Title, 
                task_description, 
                task_duration, 
                task_dueDate, 
                task_tags, 
                task_priority, 
                user_id, 
                Task_time,
                task_startDate,
                created_time,
                Task_recurring
            ) VALUES (
                :title,
                :description,
                :duration,
                :dueDate,
                :tags,
                :priority,
                :userId,
                :time,
                :startDate,
                NOW(),
                :recurring
            )";
        } else {
            $query = "INSERT INTO tasks (
                task_Title, 
                task_description, 
                task_duration, 
                task_dueDate, 
                task_tags, 
                task_priority, 
                user_id, 
                Task_time,
                task_startDate,
                created_time
            ) VALUES (
                :title,
                :description,
                :duration,
                :dueDate,
                :tags,
                :priority,
                :userId,
                :time,
                :startDate,
                NOW()
            )";
        }

        $stmt = $db->prepare($query);

        $startDate = date('Y-m-d', strtotime($data->startDate));
        $dueDate = date('Y-m-d', strtotime($data->endDate));
 
        $taskTime = date('Y-m-d H:i:s', strtotime($data->startDate . ' ' . $data->startTime));

        $stmt->bindParam(":title", $data->taskName);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":duration", $data->duration);
        $stmt->bindParam(":dueDate", $dueDate);
        $stmt->bindParam(":tags", $data->category);
        $stmt->bindParam(":priority", $data->priority);
        $stmt->bindParam(":userId", $data->userId);
        $stmt->bindParam(":time", $taskTime);
        $stmt->bindParam(":startDate", $startDate);
        

        if ($hasRecurringColumn && $hasRecurringDaysColumn) {
            $recurring = isset($data->recurring) ? (int)$data->recurring : 0;
            $recurringDays = isset($data->recurringDays) ? $data->recurringDays : "";
            $stmt->bindParam(":recurring", $recurring);
            $stmt->bindParam(":recurringDays", $recurringDays);
        } elseif ($hasRecurringColumn) {
            $recurring = isset($data->recurring) ? (int)$data->recurring : 0;
            $stmt->bindParam(":recurring", $recurring);
        }

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Task created successfully",
                "id" => $db->lastInsertId()
            ));
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Check if this is a delete operation via GET (for testing purposes)
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        
        if ($action === 'delete') {
            // Handle deletion via GET for testing purposes
            // Check for either 'id' or 'task_id' parameter
            $taskId = isset($_GET['id']) ? $_GET['id'] : (isset($_GET['task_id']) ? $_GET['task_id'] : null);
            $deleteRecurring = isset($_GET['deleteRecurring']) ? filter_var($_GET['deleteRecurring'], FILTER_VALIDATE_BOOLEAN) : false;
            
            if (!$taskId) {
                http_response_code(400);
                echo json_encode(array("message" => "Task ID is required"));
                exit;
            }
            
            // First, get the task details
            // Check if Task_recurring column exists
            $hasRecurringColumn = false;
            try {
                $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'Task_recurring'";
                $checkColumnStmt = $db->prepare($checkColumnQuery);
                $checkColumnStmt->execute();
                $hasRecurringColumn = $checkColumnStmt->rowCount() > 0;
            } catch(Exception $e) {
                // Column doesn't exist, continue without it
                $hasRecurringColumn = false;
            }
            
            // Build the query based on whether the Task_recurring column exists
            if ($hasRecurringColumn) {
                $query = "SELECT task_Title, user_id, Task_recurring FROM tasks WHERE task_id = :taskId";
            } else {
                $query = "SELECT task_Title, user_id FROM tasks WHERE task_id = :taskId";
            }
            $stmt = $db->prepare($query);
            $stmt->bindParam(":taskId", $taskId);
            $stmt->execute();
            
            $task = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$task) {
                http_response_code(404);
                echo json_encode(array("message" => "Task not found"));
                exit;
            }
            
            // check if the task is recurring and if we should delete all instances
            $isRecurring = $hasRecurringColumn && isset($task['Task_recurring']) && $task['Task_recurring'] == 1;
            
            if ($isRecurring && $deleteRecurring) {
                // delete all tasks with the same title and user ID
                if ($hasRecurringColumn) {
                    $query = "DELETE FROM tasks WHERE task_Title = :title AND user_id = :userId AND Task_recurring = 1";
                } else {
                    $query = "DELETE FROM tasks WHERE task_Title = :title AND user_id = :userId";
                }
                $stmt = $db->prepare($query);
                $stmt->bindParam(":title", $task['task_Title']);
                $stmt->bindParam(":userId", $task['user_id']);
                
                if ($stmt->execute()) {
                    $count = $stmt->rowCount();
                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "All recurring tasks deleted successfully",
                        "count" => $count
                    ));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Failed to delete recurring tasks"));
                }
            } else {
                // delete just the single task
                $query = "DELETE FROM tasks WHERE task_id = :taskId";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":taskId", $taskId);
                
                if ($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(array("message" => "Task deleted successfully"));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Failed to delete task"));
                }
            }
        } else {
            // Check if we're fetching for a date range or a single date
            if (isset($_GET['startDate']) && isset($_GET['endDate'])) {
                $startDate = $_GET['startDate'];
                $endDate = $_GET['endDate'];
                $userId = isset($_GET['userId']) ? $_GET['userId'] : null;

                $query = "SELECT *, DATE_FORMAT(Task_time, '%H:%i:%s') as formatted_time, task_startDate as task_date, recurringDays FROM tasks WHERE task_startDate BETWEEN :startDate AND :endDate";
                if ($userId) {
                    $query .= " AND user_id = :userId";
                }
                $query .= " ORDER BY task_startDate ASC, Task_time ASC";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":startDate", $startDate);
                $stmt->bindParam(":endDate", $endDate);
                if ($userId) {
                    $stmt->bindParam(":userId", $userId);
                }
            } else {
                $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
                $userId = isset($_GET['userId']) ? $_GET['userId'] : null;

                $query = "SELECT *, DATE_FORMAT(Task_time, '%H:%i:%s') as formatted_time, recurringDays FROM tasks WHERE task_startDate = :date";
                if ($userId) {
                    $query .= " AND user_id = :userId";
                }
                $query .= " ORDER BY Task_time ASC";

                $stmt = $db->prepare($query);
                $stmt->bindParam(":date", $date);
                if ($userId) {
                    $stmt->bindParam(":userId", $userId);
                }
            }

            $stmt->execute();
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode($tasks);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);

        if (!$data) {
            throw new Exception("No input received");
        }

        if (!isset($data->taskId) || !isset($data->userId)) {
            http_response_code(400);
            echo json_encode(array("message" => "Task ID and User ID are required"));
            exit;
        }

        // Check if the task exists and belongs to the user
        $checkQuery = "SELECT * FROM tasks WHERE task_id = :taskId AND user_id = :userId";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":taskId", $data->taskId);
        $checkStmt->bindParam(":userId", $data->userId);
        $checkStmt->execute();

        if ($checkStmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(array("message" => "Task not found or does not belong to the user"));
            exit;
        }

        // Format dates and times
        $startDate = date('Y-m-d', strtotime($data->startDate));
        $dueDate = date('Y-m-d', strtotime($data->endDate));
        $taskTime = date('Y-m-d H:i:s', strtotime($data->startDate . ' ' . $data->startTime));

        // Check if Task_recurring column exists
        $hasRecurringColumn = false;
        try {
            $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'Task_recurring'";
            $checkColumnStmt = $db->prepare($checkColumnQuery);
            $checkColumnStmt->execute();
            $hasRecurringColumn = $checkColumnStmt->rowCount() > 0;
        } catch(Exception $e) {
            $hasRecurringColumn = false;
        }
        
        // Check if recurringDays column exists
        $hasRecurringDaysColumn = false;
        try {
            $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'recurringDays'";
            $checkColumnStmt = $db->prepare($checkColumnQuery);
            $checkColumnStmt->execute();
            $hasRecurringDaysColumn = $checkColumnStmt->rowCount() > 0;
        } catch(Exception $e) {
            $hasRecurringDaysColumn = false;
        }

        // Update the task
        if ($hasRecurringColumn && $hasRecurringDaysColumn) {
            $query = "UPDATE tasks SET 
                task_Title = :title,
                task_description = :description,
                task_duration = :duration,
                task_dueDate = :dueDate,
                task_tags = :tags,
                task_priority = :priority,
                Task_time = :time,
                task_startDate = :startDate,
                Task_recurring = :recurring,
                recurringDays = :recurringDays
                WHERE task_id = :taskId AND user_id = :userId";
        } elseif ($hasRecurringColumn) {
            $query = "UPDATE tasks SET 
                task_Title = :title,
                task_description = :description,
                task_duration = :duration,
                task_dueDate = :dueDate,
                task_tags = :tags,
                task_priority = :priority,
                Task_time = :time,
                task_startDate = :startDate,
                Task_recurring = :recurring
                WHERE task_id = :taskId AND user_id = :userId";
        } else {
            $query = "UPDATE tasks SET 
                task_Title = :title,
                task_description = :description,
                task_duration = :duration,
                task_dueDate = :dueDate,
                task_tags = :tags,
                task_priority = :priority,
                Task_time = :time,
                task_startDate = :startDate
                WHERE task_id = :taskId AND user_id = :userId";
        }

        $stmt = $db->prepare($query);
        $stmt->bindParam(":title", $data->taskName);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":duration", $data->duration);
        $stmt->bindParam(":dueDate", $dueDate);
        $stmt->bindParam(":tags", $data->category);
        $stmt->bindParam(":priority", $data->priority);
        $stmt->bindParam(":time", $taskTime);
        $stmt->bindParam(":startDate", $startDate);
        $stmt->bindParam(":taskId", $data->taskId);
        $stmt->bindParam(":userId", $data->userId);
        
        if ($hasRecurringColumn && $hasRecurringDaysColumn) {
            $recurring = isset($data->recurring) ? (int)$data->recurring : 0;
            $recurringDays = isset($data->recurringDays) ? $data->recurringDays : "";
            $stmt->bindParam(":recurring", $recurring);
            $stmt->bindParam(":recurringDays", $recurringDays);
        } elseif ($hasRecurringColumn) {
            $recurring = isset($data->recurring) ? (int)$data->recurring : 0;
            $stmt->bindParam(":recurring", $recurring);
        }

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("message" => "Task updated successfully"));
        } else {
            http_response_code(500);
            echo json_encode(array("message" => "Failed to update task"));
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Parse the URL to get the task ID
        $url_components = parse_url($_SERVER['REQUEST_URI']);
        parse_str($url_components['query'] ?? '', $params);
        
        // Check for either 'id' or 'task_id' parameter
        $taskId = isset($params['id']) ? $params['id'] : (isset($params['task_id']) ? $params['task_id'] : null);
        $deleteRecurring = isset($params['deleteRecurring']) ? filter_var($params['deleteRecurring'], FILTER_VALIDATE_BOOLEAN) : false;
        
        if (!$taskId) {
            http_response_code(400);
            echo json_encode(array("message" => "Task ID is required"));
            exit;
        }
        
        // First, get the task details
        // Check if Task_recurring column exists
        $hasRecurringColumn = false;
        try {
            $checkColumnQuery = "SHOW COLUMNS FROM tasks LIKE 'Task_recurring'";
            $checkColumnStmt = $db->prepare($checkColumnQuery);
            $checkColumnStmt->execute();
            $hasRecurringColumn = $checkColumnStmt->rowCount() > 0;
        } catch(Exception $e) {
            // Column doesn't exist, continue without it
            $hasRecurringColumn = false;
        }
        
        // Build the query based on whether the Task_recurring column exists
        if ($hasRecurringColumn) {
            $query = "SELECT task_Title, user_id, Task_recurring FROM tasks WHERE task_id = :taskId";
        } else {
            $query = "SELECT task_Title, user_id FROM tasks WHERE task_id = :taskId";
        }
        $stmt = $db->prepare($query);
        $stmt->bindParam(":taskId", $taskId);
        $stmt->execute();
        
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            http_response_code(404);
            echo json_encode(array("message" => "Task not found"));
            exit;
        }
        
        // Check if the task is recurring (if the column exists) and if we should delete all instances
        $isRecurring = $hasRecurringColumn && isset($task['Task_recurring']) && $task['Task_recurring'] == 1;
        
        if ($isRecurring && $deleteRecurring) {
            // Delete all tasks with the same title and user ID
            if ($hasRecurringColumn) {
                $query = "DELETE FROM tasks WHERE task_Title = :title AND user_id = :userId AND Task_recurring = 1";
            } else {
                $query = "DELETE FROM tasks WHERE task_Title = :title AND user_id = :userId";
            }
            $stmt = $db->prepare($query);
            $stmt->bindParam(":title", $task['task_Title']);
            $stmt->bindParam(":userId", $task['user_id']);
            
            if ($stmt->execute()) {
                $count = $stmt->rowCount();
                http_response_code(200);
                echo json_encode(array(
                    "message" => "All recurring tasks deleted successfully",
                    "count" => $count
                ));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Failed to delete recurring tasks"));
            }
        } else {
            // Delete just the single task
            $query = "DELETE FROM tasks WHERE task_id = :taskId";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":taskId", $taskId);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("message" => "Task deleted successfully"));
            } else {
                http_response_code(500);
                echo json_encode(array("message" => "Failed to delete task"));
            }
        }
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error occurred",
        "error" => $e->getMessage()
    ));
}
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
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

        $stmt = $db->prepare($query);

   
        $startDate = date('Y-m-d', strtotime($data->startDate));
        $dueDate = date('Y-m-d', strtotime($data->endDate));
 
        $taskTime = date('Y-m-d H:i:s', strtotime($data->startDate . ' ' . $data->startTime));

        // Set recurring flag (default to 0 if not provided)
        $recurring = isset($data->recurring) ? (int)$data->recurring : 0;

        $stmt->bindParam(":title", $data->taskName);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":duration", $data->duration);
        $stmt->bindParam(":dueDate", $dueDate);
        $stmt->bindParam(":tags", $data->category);
        $stmt->bindParam(":priority", $data->priority);
        $stmt->bindParam(":userId", $data->userId);
        $stmt->bindParam(":time", $taskTime);
        $stmt->bindParam(":startDate", $startDate);
        $stmt->bindParam(":recurring", $recurring);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Task created successfully",
                "id" => $db->lastInsertId()
            ));
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  
        $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;

        $query = "SELECT *, DATE_FORMAT(Task_time, '%H:%i:%s') as formatted_time FROM tasks WHERE task_startDate = :date";
        if ($userId) {
            $query .= " AND user_id = :userId";
        }
        $query .= " ORDER BY Task_time ASC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":date", $date);
        if ($userId) {
            $stmt->bindParam(":userId", $userId);
        }

        $stmt->execute();
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        

        http_response_code(200);
        echo json_encode($tasks);
    } else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Parse the URL to get the task ID
        $url_components = parse_url($_SERVER['REQUEST_URI']);
        parse_str($url_components['query'] ?? '', $params);
        
        $taskId = isset($params['id']) ? $params['id'] : null;
        $deleteRecurring = isset($params['deleteRecurring']) ? filter_var($params['deleteRecurring'], FILTER_VALIDATE_BOOLEAN) : false;
        
        if (!$taskId) {
            http_response_code(400);
            echo json_encode(array("message" => "Task ID is required"));
            exit;
        }
        
        // First, get the task details to check if it's part of a recurring series
        $query = "SELECT task_Title, user_id, Task_recurring FROM tasks WHERE id = :taskId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":taskId", $taskId);
        $stmt->execute();
        
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            http_response_code(404);
            echo json_encode(array("message" => "Task not found"));
            exit;
        }
        
        // Check if the task is recurring and if we should delete all instances
        if (($task['Task_recurring'] == 1) && $deleteRecurring) {
            // Delete all tasks with the same title and user ID
            $query = "DELETE FROM tasks WHERE task_Title = :title AND user_id = :userId AND Task_recurring = 1";
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
            $query = "DELETE FROM tasks WHERE id = :taskId";
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

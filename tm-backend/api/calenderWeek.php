<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

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

        $stmt = $db->prepare($query);

        $startDate = date('Y-m-d', strtotime($data->startDate));
        $dueDate = date('Y-m-d', strtotime($data->dueDate));
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

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Task created successfully",
                "id" => $db->lastInsertId()
            ));
        }
    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : date('Y-m-d');
        $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : date('Y-m-d', strtotime('+6 days'));
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;

        $query = "SELECT *, DATE_FORMAT(Task_time, '%H:%i:%s') as formatted_time 
                 FROM tasks 
                 WHERE task_startDate BETWEEN :startDate AND :endDate";
        
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

        $stmt->execute();
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($tasks);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error occurred",
        "error" => $e->getMessage()
    ));
}
?>

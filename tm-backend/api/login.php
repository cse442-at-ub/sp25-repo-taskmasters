<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

include_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    if (!$data || !$data->email || !$data->password) {
        throw new Exception("Email and password are required");
    }

    $query = "SELECT user_id, username, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $data->email);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid credentials."));
        exit();
    }
    
    if (password_verify($data->password, $row['password_hash'])) {
        http_response_code(200);
        echo json_encode(array(
            "message" => "Login successful.",
            "user" => array(
                "id" => $row['user_id'],
                "username" => $row['username'],
                "email" => $row['email']
            )
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Invalid credentials."));
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
?>
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

    if (!$data || !$data->username || !$data->email || !$data->password) {
        throw new Exception("Required fields missing");
    }

    // Check if email already exists
    $check_query = "SELECT COUNT(*) FROM users WHERE email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":email", $data->email);
    $check_stmt->execute();
    
    if ($check_stmt->fetchColumn() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "Email already exists"));
        exit();
    }

    // Insert new user
    $query = "INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)";
    $stmt = $db->prepare($query);

    $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

    $stmt->bindParam(":username", $data->username);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":password_hash", $hashed_password);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "User created successfully."));
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

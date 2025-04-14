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

    if (!$data || !$data->userId) {
        throw new Exception("User ID is required");
    }

    // Initialize variables to track changes
    $changes = [];
    $updatedFields = [];

    // Check if email is being updated
    if (isset($data->email) && !empty($data->email)) {
        $email = filter_var($data->email, FILTER_VALIDATE_EMAIL);
        if (!$email) {
            throw new Exception("Invalid email format");
        }

        // Check if email already exists for a different user
        $check_query = "SELECT COUNT(*) FROM users WHERE email = :email AND user_id != :userId";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":email", $email);
        $check_stmt->bindParam(":userId", $data->userId);
        $check_stmt->execute();
        
        if ($check_stmt->fetchColumn() > 0) {
            http_response_code(400);
            echo json_encode(array("success" => false, "message" => "Email already in use by another account"));
            exit();
        }

        $changes[] = "email = :email";
        $updatedFields["email"] = $email;
    }

    // Check if password is being updated
    if (isset($data->newPassword) && !empty($data->newPassword)) {
        // Current password is required for changing password
        if (!isset($data->currentPassword) || empty($data->currentPassword)) {
            throw new Exception("Current password is required to change password");
        }

        // Verify current password
        $query = "SELECT password_hash FROM users WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":userId", $data->userId);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new Exception("User not found");
        }

        if (!password_verify($data->currentPassword, $row['password_hash'])) {
            http_response_code(401);
            echo json_encode(array("success" => false, "message" => "Current password is incorrect"));
            exit();
        }

        // Validate new password - match registration requirements
        if (strlen($data->newPassword) < 8) {
            throw new Exception("New password must be at least 8 characters long");
        }
        
        // Check for uppercase letter
        if (!preg_match('/[A-Z]/', $data->newPassword)) {
            throw new Exception("Password must contain at least one uppercase letter");
        }
        
        // Check for lowercase letter
        if (!preg_match('/[a-z]/', $data->newPassword)) {
            throw new Exception("Password must contain at least one lowercase letter");
        }
        
        // Check for number
        if (!preg_match('/[0-9]/', $data->newPassword)) {
            throw new Exception("Password must contain at least one number");
        }
        
        // Check for special character
        if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $data->newPassword)) {
            throw new Exception("Password must contain at least one special character");
        }

        $hashed_password = password_hash($data->newPassword, PASSWORD_DEFAULT);
        $changes[] = "password_hash = :password_hash";
        $updatedFields["password_hash"] = $hashed_password;
    }

    // If no changes requested, return early
    if (empty($changes)) {
        http_response_code(400);
        echo json_encode(array("success" => false, "message" => "No changes provided"));
        exit();
    }

    // Build and execute the update query
    $query = "UPDATE users SET " . implode(", ", $changes) . " WHERE user_id = :userId";
    $stmt = $db->prepare($query);
    
    // Bind parameters
    $stmt->bindParam(":userId", $data->userId);
    foreach ($updatedFields as $key => $value) {
        $stmt->bindParam(":" . $key, $updatedFields[$key]);
    }

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array(
            "success" => true, 
            "message" => "Profile updated successfully",
            "updatedFields" => array_keys($updatedFields)
        ));
    } else {
        throw new Exception("Failed to update profile");
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Database error",
        "error" => $e->getMessage()
    ));
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => $e->getMessage()
    ));
}
?> 
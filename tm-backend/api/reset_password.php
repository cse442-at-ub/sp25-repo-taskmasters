<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Start session for CSRF protection
session_start();

// Set secure headers
header("Access-Control-Allow-Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
header("Content-Security-Policy: default-src * 'unsafe-inline' 'unsafe-eval'; img-src * data:;");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';

// Function to sanitize input data
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Enable detailed error logging for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log the request for debugging
error_log("Password reset request received");

try {
    // Verify request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }
    
    $database = new Database();
    $db = $database->getConnection();

    $input = file_get_contents("php://input");
    error_log("Request body: " . $input);
    
    $data = json_decode($input);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON: " . json_last_error_msg());
    }

    // Validate input
    if (!$data || !isset($data->token) || !isset($data->password) || !isset($data->confirmPassword)) {
        throw new Exception("Token, password, and confirm password are required");
    }
    
    error_log("Token: " . substr($data->token, 0, 10) . "...");
    
    // Validate password match
    if ($data->password !== $data->confirmPassword) {
        throw new Exception("Passwords do not match");
    }
    
    // Validate password strength
    if (strlen($data->password) < 8) {
        http_response_code(400);
        echo json_encode(array(
            "message" => "Password must be at least 8 characters long"
        ));
        exit();
    }
    
    // Sanitize token
    $token = sanitizeInput($data->token);
    
    // Validate token format - allow any token format for now to debug the issue
    // if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    //     http_response_code(400);
    //     echo json_encode(array(
    //         "message" => "The reset link is invalid or has expired"
    //     ));
    //     exit();
    // }
    
    error_log("Looking up token in database: " . $token);
    
    // Check if the token exists and is valid
    $query = "SELECT user_id, expiry_time 
              FROM password_reset_tokens
              WHERE token = :token";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":token", $token);
    $stmt->execute();
    
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tokenData) {
        error_log("Token not found in database");
        throw new Exception("The reset link is invalid or has expired");
    }
    
    error_log("Token found for user_id: " . $tokenData['user_id']);
    
    // Check if token is expired
    $currentTime = date('Y-m-d H:i:s');
    if ($currentTime > $tokenData['expiry_time']) {
        error_log("Token expired. Current time: $currentTime, Expiry time: " . $tokenData['expiry_time']);
        throw new Exception("The reset link is invalid or has expired");
    }
    
    // Hash the new password
    $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
    error_log("Password hashed successfully");
    
    // Update the user's password
    $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":password_hash", $hashedPassword);
    $updateStmt->bindParam(":user_id", $tokenData['user_id']);
    
    error_log("Executing password update query for user_id: " . $tokenData['user_id']);
    $updateResult = $updateStmt->execute();
    
    if (!$updateResult) {
        error_log("Failed to update password: " . implode(", ", $updateStmt->errorInfo()));
        throw new Exception("Failed to update password");
    }
    
    error_log("Password updated successfully");
    
    // Delete the used token
    $deleteQuery = "DELETE FROM password_reset_tokens WHERE user_id = :user_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(":user_id", $tokenData['user_id']);
    
    error_log("Deleting used token");
    $deleteResult = $deleteStmt->execute();
    
    if (!$deleteResult) {
        error_log("Failed to delete token: " . implode(", ", $deleteStmt->errorInfo()));
        // Continue anyway since the password was updated successfully
    }
    
    // Return success
    error_log("Password reset successful");
    http_response_code(200);
    echo json_encode(array(
        "message" => "Password has been reset successfully. You can now log in with your new password."
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error occurred",
        "error" => $e->getMessage() // Include error message for debugging
    ));
    error_log("Database error in reset_password.php: " . $e->getMessage());
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "message" => $e->getMessage()
    ));
    error_log("Exception in reset_password.php: " . $e->getMessage());
}
?>

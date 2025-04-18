<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to PHP's error log
ini_set('log_errors', 1);

// Start session for CSRF protection
session_start();

// Set secure headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log the request method
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("message" => "Method not allowed"));
    exit;
}

// Include database configuration
include_once '../config/database.php';

// Function to sanitize input data
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Function to generate a secure random token (for consistency with request_password_reset.php)
function generateToken() {
    // Generate a token that's URL-safe
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}

// Get the request body
$input = file_get_contents("php://input");
error_log("Request body: " . $input);

// Parse the JSON data
$data = json_decode($input);

// Check if the JSON is valid
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid JSON: " . json_last_error_msg()));
    exit;
}

// Check if the required fields are present
if (!isset($data->token) || !isset($data->password) || !isset($data->confirmPassword)) {
    http_response_code(400);
    echo json_encode(array("message" => "Token, password, and confirm password are required"));
    exit;
}

// Check if the passwords match
if ($data->password !== $data->confirmPassword) {
    http_response_code(400);
    echo json_encode(array("message" => "Passwords do not match"));
    exit;
}

// Check if the password is strong enough
if (strlen($data->password) < 8) {
    http_response_code(400);
    echo json_encode(array("message" => "Password must be at least 8 characters long"));
    exit;
}

// Use the token as-is without sanitizing
$token = $data->token;
error_log("Token: " . $token);

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if the token exists and is valid
    $query = "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = :token";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":token", $token);
    $stmt->execute();
    
    // Check if the token was found
    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode(array("message" => "The reset link is invalid or has expired"));
        exit;
    }
    
    // Get the token data
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
    $userId = $tokenData['user_id'];
    $expiryTime = $tokenData['expires_at'];
    
    error_log("Token found for user_id: " . $userId);
    
    // Check if the token has expired
    $currentTime = date('Y-m-d H:i:s');
    if ($currentTime > $expiryTime) {
        http_response_code(400);
        echo json_encode(array("message" => "The reset link is invalid or has expired"));
        exit;
    }
    
    // Hash the new password
    $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
    
    // Update the user's password
    $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":password_hash", $hashedPassword);
    $updateStmt->bindParam(":user_id", $userId);
    $updateStmt->execute();
    
    // Check if the password was updated
    if ($updateStmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(array("message" => "Failed to update password"));
        exit;
    }
    
    error_log("Password updated successfully for user_id: " . $userId);
    
    // Delete the used token
    $deleteQuery = "DELETE FROM password_reset_tokens WHERE token = :token";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(":token", $token);
    $deleteStmt->execute();
    
    // Return success
    http_response_code(200);
    echo json_encode(array("message" => "Password has been reset successfully. You can now log in with your new password."));
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Database error: " . $e->getMessage()));
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("message" => "Error: " . $e->getMessage()));
}
?>

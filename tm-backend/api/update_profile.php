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
    echo json_encode(array("success" => false, "message" => "Method not allowed"));
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

// Get the request body
$input = file_get_contents("php://input");
error_log("Request body: " . $input);

// Parse the JSON data
$data = json_decode($input);

// Check if the JSON is valid
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Invalid JSON: " . json_last_error_msg()));
    exit;
}

// Check if the required fields are present
if (!isset($data->userId) || !isset($data->currentPassword) || !isset($data->newPassword)) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "User ID, current password, and new password are required"));
    exit;
}

// Check if the password is strong enough
if (strlen($data->newPassword) < 8) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Password must be at least 8 characters long"));
    exit;
}

// Sanitize the inputs
$userId = sanitizeInput($data->userId);
$currentPassword = $data->currentPassword; // Don't sanitize passwords
$newPassword = $data->newPassword; // Don't sanitize passwords
$email = isset($data->email) ? sanitizeInput($data->email) : null;

error_log("Processing profile update for user ID: " . $userId);

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get the user's current password hash
    $query = "SELECT password_hash, email FROM users WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    // Check if the user was found
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(array("success" => false, "message" => "User not found"));
        exit;
    }
    
    // Get the user data
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    $storedPasswordHash = $userData['password_hash'];
    $userEmail = $userData['email'];
    
    error_log("User found with email: " . $userEmail);
    
    // Verify the current password
    if (!password_verify($currentPassword, $storedPasswordHash)) {
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Current password is incorrect"));
        exit;
    }
    
    error_log("Current password verified successfully");
    
    // Hash the new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update the user's password
    $updateQuery = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":password_hash", $hashedPassword);
    $updateStmt->bindParam(":user_id", $userId);
    $updateStmt->execute();
    
    // Check if the password was updated
    if ($updateStmt->rowCount() === 0) {
        http_response_code(500);
        echo json_encode(array("success" => false, "message" => "Failed to update password"));
        exit;
    }
    
    error_log("Password updated successfully for user ID: " . $userId);
    
    // Return success
    http_response_code(200);
    echo json_encode(array(
        "success" => true,
        "message" => "Password has been updated successfully."
    ));
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => "Error: " . $e->getMessage()));
}
?>

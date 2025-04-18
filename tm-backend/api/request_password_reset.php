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

// Function to generate a secure random token
function generateToken() {
    return bin2hex(random_bytes(32));
}

// Include the EmailSender class
require_once '../utils/EmailSender.php';

/**
 * Function to send password reset email
 * 
 * This function uses the EmailSender class to send a password reset email
 * with better error handling and logging.
 * 
 * @param string $email Recipient email address
 * @param string $token Reset token
 * @return bool True if email was sent successfully, false otherwise
 */
function sendResetEmail($email, $token) {
    return EmailSender::sendPasswordResetEmail($email, $token);
}

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
    if (!$data || !isset($data->email)) {
        throw new Exception("Email is required");
    }
    
    // Sanitize input
    $email = sanitizeInput($data->email);
    error_log("Processing reset request for email: " . $email);
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array(
            "message" => "Please enter a valid email address"
        ));
        exit();
    }

    // Check if the email exists in the database
    $query = "SELECT user_id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    $userExists = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Always return a success message even if the email doesn't exist
    // This prevents user enumeration attacks
    if ($userExists) {
        error_log("User found with ID: " . $userExists['user_id']);
        
        // Generate a token
        $token = generateToken();
        error_log("Generated token: " . substr($token, 0, 10) . "...");
        
        $expiryTime = date('Y-m-d H:i:s', strtotime('+1 hour'));
        error_log("Token expiry time: " . $expiryTime);
        
        try {
            // Check if a reset token already exists for this user
            $checkQuery = "SELECT * FROM password_reset_tokens WHERE user_id = :user_id";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(":user_id", $userExists['user_id']);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                error_log("Existing token found, updating");
                // Update existing token
                $updateQuery = "UPDATE password_reset_tokens 
                               SET token = :token, expiry_time = :expiry_time, created_at = NOW() 
                               WHERE user_id = :user_id";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(":token", $token);
                $updateStmt->bindParam(":expiry_time", $expiryTime);
                $updateStmt->bindParam(":user_id", $userExists['user_id']);
                $updateResult = $updateStmt->execute();
                
                if (!$updateResult) {
                    error_log("Failed to update token: " . implode(", ", $updateStmt->errorInfo()));
                } else {
                    error_log("Token updated successfully");
                }
            } else {
                error_log("No existing token, creating new one");
                // Insert new token
                $insertQuery = "INSERT INTO password_reset_tokens (user_id, token, expiry_time) 
                               VALUES (:user_id, :token, :expiry_time)";
                $insertStmt = $db->prepare($insertQuery);
                $insertStmt->bindParam(":user_id", $userExists['user_id']);
                $insertStmt->bindParam(":token", $token);
                $insertStmt->bindParam(":expiry_time", $expiryTime);
                $insertResult = $insertStmt->execute();
                
                if (!$insertResult) {
                    error_log("Failed to insert token: " . implode(", ", $insertStmt->errorInfo()));
                } else {
                    error_log("Token inserted successfully");
                }
            }
        } catch (PDOException $e) {
            error_log("Database error in token creation: " . $e->getMessage());
            // Continue execution to return success message even if token creation fails
        }
        
        // Send the reset email
        $emailResult = sendResetEmail($email, $token);
        error_log("Email sending result: " . ($emailResult ? "Success" : "Failed"));
    } else {
        error_log("No user found with email: " . $email);
    }
    
    // Always return success to prevent user enumeration
    http_response_code(200);
    echo json_encode(array(
        "message" => "If an account exists with this email, you will receive a password reset link."
    ));
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error occurred",
        "error" => $e->getMessage() // Include error message for debugging
    ));
    error_log("Database error in request_password_reset.php: " . $e->getMessage());
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "message" => $e->getMessage()
    ));
    error_log("Exception in request_password_reset.php: " . $e->getMessage());
}
?>

<?php
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
// Less restrictive CSP for development
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

try {
    // Verify request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }
    
    // Always generate a new CSRF token for each login attempt
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    
    // Log the generated token for debugging
    error_log("Generated CSRF token: " . $_SESSION['csrf_token']);
    
    $database = new Database();
    $db = $database->getConnection();

    $input = file_get_contents("php://input");
    $data = json_decode($input);

    // Validate input
    if (!$data || !isset($data->email) || !isset($data->password)) {
        throw new Exception("Email and password are required");
    }
    
    // Sanitize input
    $email = sanitizeInput($data->email);
    $password = $data->password; // Don't sanitize password before verification
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("Invalid email format");
    }

    // Prepare query with parameterized statement to prevent SQL injection
    $query = "SELECT user_id, username, email, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        // Use generic error message to prevent user enumeration
        http_response_code(401);
        echo json_encode(array("message" => "Invalid credentials"));
        exit();
    }
    
    // Verify password using constant-time comparison
    if (password_verify($password, $row['password_hash'])) {
        // Generate a new CSRF token for the authenticated session
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $csrfToken = $_SESSION['csrf_token'];
        
        // Log the token being sent to the client
        error_log("Sending CSRF token to client: " . $csrfToken);
        
        http_response_code(200);
        echo json_encode(array(
            "message" => "Login successful",
            "user" => array(
                "id" => $row['user_id'],
                "username" => htmlspecialchars($row['username'], ENT_QUOTES, 'UTF-8'),
                "email" => htmlspecialchars($row['email'], ENT_QUOTES, 'UTF-8')
            ),
            "csrf_token" => $csrfToken
        ));
    } else {
        // Use generic error message to prevent user enumeration
        http_response_code(401);
        echo json_encode(array("message" => "Invalid credentials"));
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Server error occurred"
        // Don't expose detailed error messages in production
    ));
    error_log("Database error: " . $e->getMessage());
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "message" => $e->getMessage()
    ));
}
?>

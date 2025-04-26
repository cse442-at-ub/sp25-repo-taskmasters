<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Load environment variables and database
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/database.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Load PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

// Validate email
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

try {
    // Initialize database connection
    $database = new Database();
    $db = $database->getConnection();

    // Check if email exists in database
    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    // Always return success to prevent email enumeration
    if ($stmt->rowCount() == 0) {
        echo json_encode(['message' => 'If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.']);
        exit;
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $userId = $user['id'];

    // Generate a secure token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Store token in database
    $query = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->bindParam(":token", $token);
    $stmt->bindParam(":expires_at", $expiresAt);
    $stmt->execute();
    
    // Create a new PHPMailer instance
    $mail = new PHPMailer(true);
    
    // Server settings
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['SMTP_USERNAME'];
    $mail->Password = $_ENV['SMTP_PASSWORD'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    // Recipients
    $mail->setFrom('taskmasterreset@gmail.com', 'TaskMasters');
    $mail->addAddress($email);
    
    // Content
    $mail->isHTML(true);
    $mail->Subject = 'Password Reset Request';
    $resetLink = 'http://localhost:3000/reset-password?token=' . $token;
    $mail->Body = "
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href='$resetLink'>Reset Password</a></p>
        <p>If you did not request this reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
    ";
    
    $mail->send();
    
    echo json_encode(['message' => 'If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.']);
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred. Please try again.']);
} 
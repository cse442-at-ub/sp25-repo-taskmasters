<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['token']) || !isset($data['password']) || !isset($data['confirmPassword'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Token, password, and confirm password are required']);
        exit;
    }

    $token = filter_var($data['token'], FILTER_SANITIZE_STRING);
    $password = $data['password'];
    $confirmPassword = $data['confirmPassword'];

    if ($password !== $confirmPassword) {
        http_response_code(400);
        echo json_encode(['message' => 'Passwords do not match']);
        exit;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['message' => 'Password must be at least 8 characters long']);
        exit;
    }

    try {
        // Verify token exists and is valid
        $stmt = $pdo->prepare("
            SELECT prt.*, u.email 
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token = ? AND prt.used = 0 AND prt.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $resetToken = $stmt->fetch();

        if (!$resetToken) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid or expired reset token']);
            exit;
        }

        // Hash the new password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Update user's password
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $resetToken['user_id']]);

        // Mark token as used
        $stmt = $pdo->prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?");
        $stmt->execute([$resetToken['id']]);

        echo json_encode(['message' => 'Password has been reset successfully']);
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'An error occurred. Please try again later.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
} 
<?php
/**
 * Test Password Reset Flow
 * 
 * This script tests the password reset flow by:
 * 1. Creating a test user if it doesn't exist
 * 2. Generating a password reset token for the test user
 * 3. Simulating a password reset request
 * 4. Simulating a password reset
 * 5. Verifying the password was reset
 * 
 * Usage: php test_password_reset_flow.php
 */

// Include database configuration
include_once '../config/database.php';
include_once '../utils/EmailSender.php';

// Test user credentials
$testEmail = 'test@example.com';
$testUsername = 'testuser';
$oldPassword = 'oldpassword123';
$newPassword = 'newpassword123';

try {
    echo "Testing password reset flow...\n\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Step 1: Create a test user if it doesn't exist
    echo "Step 1: Creating test user if it doesn't exist...\n";
    
    // Check if the test user exists
    $query = "SELECT user_id, password_hash FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $testEmail);
    $stmt->execute();
    
    $userId = null;
    $existingPasswordHash = null;
    
    if ($stmt->rowCount() > 0) {
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
        $userId = $userData['user_id'];
        $existingPasswordHash = $userData['password_hash'];
        echo "Test user already exists with ID: $userId\n";
    } else {
        // Create the test user
        $hashedPassword = password_hash($oldPassword, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':username', $testUsername);
        $stmt->bindParam(':email', $testEmail);
        $stmt->bindParam(':password_hash', $hashedPassword);
        $stmt->execute();
        
        $userId = $db->lastInsertId();
        $existingPasswordHash = $hashedPassword;
        
        echo "Created test user with ID: $userId\n";
    }
    
    // Step 2: Generate a password reset token
    echo "\nStep 2: Generating password reset token...\n";
    
    // Generate a token
    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Check if a token already exists for this user
    $query = "SELECT id FROM password_reset_tokens WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        // Update the existing token
        $query = "UPDATE password_reset_tokens SET token = :token, expires_at = :expires_at, created_at = NOW() WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires_at', $expiresAt);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        echo "Updated existing token for user ID: $userId\n";
    } else {
        // Insert a new token
        $query = "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expires_at', $expiresAt);
        $stmt->execute();
        
        echo "Created new token for user ID: $userId\n";
    }
    
    echo "Token: " . substr($token, 0, 10) . "...\n";
    echo "Expiry time: $expiresAt\n";
    
    // Step 3: Simulate a password reset request
    echo "\nStep 3: Simulating password reset request...\n";
    
    // Generate the reset URL
    $resetUrl = "https://se-dev.cse.buffalo.edu/CSE442/2025-Spring/cse-442h/#/reset-password?token=$token";
    echo "Reset URL: $resetUrl\n";
    
    // Step 4: Simulate a password reset
    echo "\nStep 4: Simulating password reset...\n";
    
    // Hash the new password
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update the user's password
    $query = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':password_hash', $newPasswordHash);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    echo "Updated password for user ID: $userId\n";
    
    // Delete the used token
    $query = "DELETE FROM password_reset_tokens WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    echo "Deleted token for user ID: $userId\n";
    
    // Step 5: Verify the password was reset
    echo "\nStep 5: Verifying password was reset...\n";
    
    // Get the updated password hash
    $query = "SELECT password_hash FROM users WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    $updatedPasswordHash = $userData['password_hash'];
    
    if ($updatedPasswordHash !== $existingPasswordHash) {
        echo "Password was successfully reset!\n";
        
        // Verify the new password works
        if (password_verify($newPassword, $updatedPasswordHash)) {
            echo "New password verification successful!\n";
        } else {
            echo "New password verification failed!\n";
        }
    } else {
        echo "Password was not reset!\n";
    }
    
    echo "\nPassword reset flow test completed.\n";
    
} catch(PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

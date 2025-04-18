<?php
// Include database configuration
include_once '../config/database.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // SQL to create password_reset_tokens table
    $sql = "CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expiry_time DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_id (user_id),
        UNIQUE KEY unique_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    // Execute the SQL
    $db->exec($sql);
    
    echo "Password reset tokens table created successfully\n";
    
} catch(PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
?>

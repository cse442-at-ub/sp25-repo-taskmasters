<?php
// Include database configuration
include_once '../config/database.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if the table exists
    $query = "SHOW TABLES LIKE 'password_reset_tokens'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo "The password_reset_tokens table does not exist.\n";
        exit;
    }
    
    echo "The password_reset_tokens table exists.\n";
    
    // Get the table structure
    $query = "DESCRIBE password_reset_tokens";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    echo "Table structure:\n";
    echo "----------------\n";
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Key'] . " | " . $row['Default'] . " | " . $row['Extra'] . "\n";
    }
    
    // Create the table if it doesn't have the correct structure
    echo "\nRecreating the password_reset_tokens table...\n";
    
    // Drop the table if it exists
    $query = "DROP TABLE IF EXISTS password_reset_tokens";
    $db->exec($query);
    
    // Create the table
    $query = "CREATE TABLE password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(512) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_id (user_id),
        UNIQUE KEY unique_token (token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($query);
    
    echo "The password_reset_tokens table has been recreated.\n";
    
} catch(PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch(Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

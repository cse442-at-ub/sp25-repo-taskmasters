<?php
// Script to import avatar images from the assets directory into the database

// Include database connection
include_once '../config/database.php';

// Function to create the avatar_images table if it doesn't exist
function createAvatarImagesTable($db) {
    try {
        // Check if the table exists
        $query = "SHOW TABLES LIKE 'avatar_images'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $tableExists = $stmt->rowCount() > 0;
        
        if (!$tableExists) {
            // Create the table
            $query = "CREATE TABLE avatar_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_name VARCHAR(255) NOT NULL,
                image_data LONGBLOB NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_image_name (image_name)
            )";
            $db->exec($query);
            echo "Avatar images table created successfully.\n";
        } else {
            echo "Avatar images table already exists.\n";
        }
        
        return true;
    } catch (Exception $e) {
        echo "Error creating avatar images table: " . $e->getMessage() . "\n";
        return false;
    }
}

// Function to import avatar images from the assets directory
function importAvatarImages($db) {
    try {
        // Path to the assets directory
        $assetsPath = '../../taskmasters/src/assets/';
        
        // Get all avatar image files
        $avatarFiles = [
            'Level1Avatar.png',
            'Level2Avatar.png',
            'Level3Avatar.png',
            'Level4Avatar.png',
            'Level5Avatar.png',
            'Level6Avatar.png',
            'Level7Avatar.png',
            'Level8Avatar.png',
            'Level9Avatar.png',
            'Level10Avatar.png'
        ];
        
        $importedCount = 0;
        
        foreach ($avatarFiles as $file) {
            $filePath = $assetsPath . $file;
            
            if (file_exists($filePath)) {
                // Get the file content and encode it as base64
                $imageData = file_get_contents($filePath);
                
                // Get the MIME type
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $filePath);
                finfo_close($finfo);
                
                // Check if the image already exists in the database
                $query = "SELECT id FROM avatar_images WHERE image_name = :image_name";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':image_name', $file);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    // Update the existing image
                    $query = "UPDATE avatar_images SET image_data = :image_data, mime_type = :mime_type WHERE image_name = :image_name";
                } else {
                    // Insert a new image
                    $query = "INSERT INTO avatar_images (image_name, image_data, mime_type) VALUES (:image_name, :image_data, :mime_type)";
                }
                
                $stmt = $db->prepare($query);
                $stmt->bindParam(':image_name', $file);
                $stmt->bindParam(':image_data', $imageData, PDO::PARAM_LOB);
                $stmt->bindParam(':mime_type', $mimeType);
                $stmt->execute();
                
                $importedCount++;
                echo "Imported $file successfully.\n";
            } else {
                echo "File $file not found in assets directory.\n";
            }
        }
        
        echo "Imported $importedCount avatar images into the database.\n";
        return true;
    } catch (Exception $e) {
        echo "Error importing avatar images: " . $e->getMessage() . "\n";
        return false;
    }
}

// Main execution
try {
    echo "Starting avatar image import process...\n";
    
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Create the avatar_images table if it doesn't exist
    if (createAvatarImagesTable($db)) {
        // Import avatar images
        importAvatarImages($db);
    }
    
    echo "Avatar image import process completed.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>

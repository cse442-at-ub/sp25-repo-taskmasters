<?php

session_start();


header("Access-Control-Allow-Origin: " . (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*'));
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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


function sanitizeInput($data) {
    if (is_string($data)) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    return $data;
}


function verifyCsrfToken($token) {
    if (empty($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
        return false;
    }
    return true;
}

try {
    // Temporarily disable CSRF verification for testing
    // We'll log the headers to debug the issue
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        $headers = getallheaders();
        $csrfToken = isset($headers['X-CSRF-Token']) ? $headers['X-CSRF-Token'] : null;
        
        // Log headers for debugging
        error_log("Request headers: " . json_encode($headers));
        error_log("CSRF Token from header: " . ($csrfToken ?? 'null'));
        error_log("CSRF Token from session: " . ($_SESSION['csrf_token'] ?? 'null'));
        
        // Temporarily skip CSRF verification
        // if (!$csrfToken || !verifyCsrfToken($csrfToken)) {
        //     http_response_code(403);
        //     echo json_encode(array("message" => "Invalid or missing CSRF token"));
        //     exit;
        // }
    }
    
    $database = new Database();
    $db = $database->getConnection();

    
    ensureAvatarTablesExist($db);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
        
        if (!$userId) {
            throw new Exception("User ID is required");
        }

      
        $userData = getUserAvatarData($db, $userId);
        
        http_response_code(200);
        echo json_encode($userData);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);

        if (!$data) {
            throw new Exception("No input received");
        }

        if (isset($data->action) && $data->action === 'purchaseAvatar') {
            if (!isset($data->userId) || !isset($data->avatarId)) {
                throw new Exception("User ID and Avatar ID are required");
            }

            $result = purchaseAvatar($db, $data->userId, $data->avatarId);
            
            http_response_code(200);
            echo json_encode($result);
        } elseif (isset($data->action) && $data->action === 'selectAvatar') {
            if (!isset($data->userId) || !isset($data->avatarId)) {
                throw new Exception("User ID and Avatar ID are required");
            }

            $result = selectAvatar($db, $data->userId, $data->avatarId);
            
            http_response_code(200);
            echo json_encode($result);
        } else {
            throw new Exception("Invalid action");
        }
    } else {
        throw new Exception("Method not allowed");
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Database error",
        "error" => $e->getMessage()
    ));
} catch(Exception $e) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Error",
        "error" => $e->getMessage()
    ));
}


function ensureAvatarTablesExist($db) {
    try {
        $query = "SHOW TABLES LIKE 'avatars'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $avatarsTableExists = $stmt->rowCount() > 0;
        
        if (!$avatarsTableExists) {
            $query = "CREATE TABLE avatars (
                avatar_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                cost INT NOT NULL DEFAULT 0,
                is_default BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )";
            $db->exec($query);

            $defaultAvatars = [
                ['name' => 'Default Avatar', 'image_url' => 'default.png', 'cost' => 0, 'is_default' => 1],
                ['name' => 'Ninja', 'image_url' => 'ninja.png', 'cost' => 50],
                ['name' => 'Wizard', 'image_url' => 'wizard.png', 'cost' => 100],
                ['name' => 'Astronaut', 'image_url' => 'astronaut.png', 'cost' => 150],
                ['name' => 'Superhero', 'image_url' => 'superhero.png', 'cost' => 200],
                ['name' => 'Robot', 'image_url' => 'robot.png', 'cost' => 250],
                ['name' => 'Pirate', 'image_url' => 'pirate.png', 'cost' => 300],
                ['name' => 'Knight', 'image_url' => 'knight.png', 'cost' => 350],
                ['name' => 'Alien', 'image_url' => 'alien.png', 'cost' => 400],
                ['name' => 'Zombie', 'image_url' => 'zombie.png', 'cost' => 450]
            ];
            
            foreach ($defaultAvatars as $avatar) {
                $isDefault = isset($avatar['is_default']) ? $avatar['is_default'] : 0;
                $query = "INSERT INTO avatars (name, image_url, cost, is_default) VALUES (:name, :image_url, :cost, :is_default)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':name', $avatar['name']);
                $stmt->bindParam(':image_url', $avatar['image_url']);
                $stmt->bindParam(':cost', $avatar['cost']);
                $stmt->bindParam(':is_default', $isDefault);
                $stmt->execute();
            }
        }

        $query = "SHOW TABLES LIKE 'user_avatars'";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $userAvatarsTableExists = $stmt->rowCount() > 0;
        
        if (!$userAvatarsTableExists) {

            $query = "CREATE TABLE user_avatars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                avatar_id INT NOT NULL,
                is_current BOOLEAN DEFAULT 0,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_avatar (user_id, avatar_id)
            )";
            $db->exec($query);
            
    
            $query = "SELECT user_id FROM users";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
 
            $query = "SELECT avatar_id FROM avatars WHERE is_default = 1 LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $defaultAvatar = $stmt->fetch(PDO::FETCH_ASSOC);
            $defaultAvatarId = $defaultAvatar ? $defaultAvatar['avatar_id'] : 1;
            
            
            foreach ($users as $user) {
                $query = "INSERT INTO user_avatars (user_id, avatar_id, is_current) VALUES (:user_id, :avatar_id, 1)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':user_id', $user['user_id']);
                $stmt->bindParam(':avatar_id', $defaultAvatarId);
                $stmt->execute();
            }
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Error ensuring avatar tables exist: " . $e->getMessage());
        throw $e;
    }
}


function getUserAvatarData($db, $userId) {
    try {
 
        $query = "SELECT a.avatar_id, a.name, a.image_url 
                 FROM user_avatars ua 
                 JOIN avatars a ON ua.avatar_id = a.avatar_id 
                 WHERE ua.user_id = :userId AND ua.is_current = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $currentAvatar = $stmt->fetch(PDO::FETCH_ASSOC);
        
       
        if (!$currentAvatar) {
           
            $query = "SELECT avatar_id, name, image_url FROM avatars WHERE is_default = 1 LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $defaultAvatar = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($defaultAvatar) {
                
                $query = "INSERT INTO user_avatars (user_id, avatar_id, is_current) VALUES (:userId, :avatarId, 1)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':userId', $userId);
                $stmt->bindParam(':avatarId', $defaultAvatar['avatar_id']);
                $stmt->execute();
                
                $currentAvatar = $defaultAvatar;
            }
        }
        
        
        $query = "SELECT a.avatar_id, a.name, a.image_url, a.cost, ua.is_current 
                 FROM user_avatars ua 
                 JOIN avatars a ON ua.avatar_id = a.avatar_id 
                 WHERE ua.user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $ownedAvatars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        
        $query = "SELECT avatar_id, name, image_url, cost FROM avatars ORDER BY cost ASC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $allAvatars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
       
        $availableAvatars = [];
        foreach ($allAvatars as $avatar) {
            $isOwned = false;
            foreach ($ownedAvatars as $ownedAvatar) {
                if ($avatar['avatar_id'] == $ownedAvatar['avatar_id']) {
                    $isOwned = true;
                    break;
                }
            }
            
            $avatar['is_owned'] = $isOwned;
            $availableAvatars[] = $avatar;
        }
        
        
        $query = "SELECT level, total_points FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $userPoints = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userPoints) {
            $userPoints = [
                'level' => 1,
                'total_points' => 0
            ];
        }
        
        return [
            'currentAvatar' => $currentAvatar,
            'ownedAvatars' => $ownedAvatars,
            'availableAvatars' => $availableAvatars,
            'level' => $userPoints['level'],
            'totalPoints' => $userPoints['total_points']
        ];
    } catch (Exception $e) {
        error_log("Error getting user avatar data: " . $e->getMessage());
        throw $e;
    }
}


function purchaseAvatar($db, $userId, $avatarId) {
    try {
 
        $db->beginTransaction();
        
       
        $query = "SELECT * FROM user_avatars WHERE user_id = :userId AND avatar_id = :avatarId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':avatarId', $avatarId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            
            $db->rollBack();
            return [
                'success' => false,
                'message' => 'You already own this avatar'
            ];
        }
        
        
        $query = "SELECT * FROM avatars WHERE avatar_id = :avatarId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':avatarId', $avatarId);
        $stmt->execute();
        $avatar = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$avatar) {
            $db->rollBack();
            return [
                'success' => false,
                'message' => 'Avatar not found'
            ];
        }
        
 
        $query = "SELECT total_points FROM user_points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $userPoints = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$userPoints) {
            $db->rollBack();
            return [
                'success' => false,
                'message' => 'User points not found'
            ];
        }
        
 
        if ($userPoints['total_points'] < $avatar['cost']) {
            $db->rollBack();
            return [
                'success' => false,
                'message' => 'Not enough points to purchase this avatar'
            ];
        }
        

        $newPoints = $userPoints['total_points'] - $avatar['cost'];
        $query = "UPDATE user_points SET total_points = :points WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':points', $newPoints);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
      
        $query = "INSERT INTO user_avatars (user_id, avatar_id, is_current) VALUES (:userId, :avatarId, 0)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':avatarId', $avatarId);
        $stmt->execute();
        
   
        $db->commit();
        
        
        $userData = getUserAvatarData($db, $userId);
        
        return [
            'success' => true,
            'message' => 'Avatar successfully purchased!',
            'userData' => $userData
        ];
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Error purchasing avatar: " . $e->getMessage());
        throw $e;
    }
}


function selectAvatar($db, $userId, $avatarId) {
    try {
      
        $query = "SELECT * FROM user_avatars WHERE user_id = :userId AND avatar_id = :avatarId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':avatarId', $avatarId);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            return [
                'success' => false,
                'message' => 'You do not own this avatar'
            ];
        }
        
      
        $query = "UPDATE user_avatars SET is_current = 0 WHERE user_id = :userId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        
    
        $query = "UPDATE user_avatars SET is_current = 1 WHERE user_id = :userId AND avatar_id = :avatarId";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':userId', $userId);
        $stmt->bindParam(':avatarId', $avatarId);
        $stmt->execute();
        
 
        $userData = getUserAvatarData($db, $userId);
        
        return [
            'success' => true,
            'message' => 'Avatar successfully changed!',
            'userData' => $userData
        ];
    } catch (Exception $e) {
        error_log("Error selecting avatar: " . $e->getMessage());
        throw $e;
    }
}
?>

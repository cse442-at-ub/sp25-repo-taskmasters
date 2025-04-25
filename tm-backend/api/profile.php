<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get user ID from query parameters
$userId = isset($_GET['userId']) ? $_GET['userId'] : null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit();
}

try {
    // Get database connection
    $db = Database::getInstance()->getConnection();

    // Debug log the user ID
    error_log("Fetching profile data for user ID: $userId");

    // Get user data including points and level
    $stmt = $db->prepare("
        SELECT 
            u.user_id,
            u.username, 
            u.email, 
            u.level,
            u.total_points as totalPoints,
            ua.is_current as isCurrentAvatar,
            a.image_url as avatarImage,
            a.name as avatarName,
            a.level_requirement as avatarLevelReq
        FROM users u
        LEFT JOIN user_avatars ua ON u.user_id = ua.user_id AND ua.is_current = 1
        LEFT JOIN avatars a ON ua.avatar_id = a.id
        WHERE u.user_id = ?
    ");
    
    $stmt->execute([$userId]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);

    // Debug log the user data
    error_log("User data from database: " . json_encode($userData));

    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit();
    }

    // Get all purchased avatars
    $stmt = $db->prepare("
        SELECT 
            a.id as avatarId,
            a.name as avatarName,
            a.image_url,
            a.level_requirement,
            ua.is_current
        FROM user_avatars ua
        JOIN avatars a ON ua.avatar_id = a.id
        WHERE ua.user_id = ?
    ");
    $stmt->execute([$userId]);
    $purchasedAvatars = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Debug log the purchased avatars
    error_log("Purchased avatars: " . json_encode($purchasedAvatars));

    // Format the response
    $response = [
        'username' => $userData['username'],
        'email' => $userData['email'],
        'level' => (int)$userData['level'],
        'totalPoints' => (int)$userData['totalPoints'],
        'currentAvatar' => $userData['avatarImage'] ? [
            'image_url' => $userData['avatarImage'],
            'name' => $userData['avatarName'],
            'level_requirement' => (int)$userData['avatarLevelReq']
        ] : null,
        'purchasedAvatars' => array_map(function($avatar) {
            return [
                'id' => (int)$avatar['avatarId'],
                'name' => $avatar['avatarName'],
                'image_url' => $avatar['image_url'],
                'level_requirement' => (int)$avatar['level_requirement'],
                'is_current' => (bool)$avatar['is_current']
            ];
        }, $purchasedAvatars)
    ];

    // Debug log the final response
    error_log("Profile API Response for user $userId: " . json_encode($response));

    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Database error in profile.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Server error in profile.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
} 
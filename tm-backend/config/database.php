<?php
// Define secure access constant
define('SECURE_ACCESS', true);


if (!file_exists($credentialsPath)) {
    // Fallback to local credentials for development
    $credentialsPath = __DIR__ . '/credentials.php';
}

if (!file_exists($credentialsPath)) {
    die('Database configuration file not found');
}

require_once $credentialsPath;

class Database {
    private $host;
    private $database_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = DB_HOST;
        $this->database_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->database_name, 
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            if (DEBUG_MODE) {
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            }
        } catch(PDOException $e) {
            if (DEBUG_MODE) {
                echo "Connection error: " . $e->getMessage();
            } else {
                echo "Connection error occurred";
            }
        }
        return $this->conn;
    }
}
?>

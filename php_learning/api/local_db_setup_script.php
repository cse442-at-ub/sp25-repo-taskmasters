<?php

// ** Have to have XAMPP, PHP, and all dependencies installed
// ** Before running this script, start apache and mySQL in XAMPP
// ** from W3Schools php tutorials 

$servername = "localhost";
$username = "root";
$password = "password";
$dbname = "myTestDB";
$tablename = "test_users";

$test_user = "user1";
$test_password = "password1";
$test_email = "user@test.com";

$test_user2 = "user2";
$test_password2 = "password2";
$test_email2 = "user2@test.com";

// Create connection
$conn = new mysqli($servername, $username);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Create database
$sql = "CREATE DATABASE IF NOT EXISTS {$dbname}";
if ($conn->query($sql) === TRUE) {
  echo "Database {$dbname} created successfully";
} else {
  echo "Error creating database: " . $conn->error;
}

$conn->select_db($dbname);

//create tables, change params as necessary
$sql = "CREATE TABLE IF NOT EXISTS {$tablename} (
  user_id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  password_hash VARCHAR(30) NOT NULL,
  email VARCHAR(50),
  reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )";

  
  if ($conn->query($sql) === TRUE) {
    echo "Table {$tablename} created successfully";
  } else {
    echo "Error creating table: " . $conn->error;
  }

$sql = "INSERT INTO {$tablename} (username, password_hash, email) 
VALUES ({$test_user}, {$test_password}, {$test_email})";

if ($conn->query($sql) === TRUE) {
  echo "user {$test_user} created successfully";
} else {
  echo "Error adding user: " . $conn->error;
}

$sql = "INSERT INTO {$tablename} (username, password_hash, email) 
VALUES ({$test_user2}, {$test_password2}, {$test_email2})";

if ($conn->query($sql) === TRUE) {
  echo "user {$test_user2} created successfully";
} else {
  echo "Error adding user2: " . $conn->error;
}


$conn->close();
?>


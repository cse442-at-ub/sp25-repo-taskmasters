<?php

// ** Have to have XAMPP, PHP, and all dependencies installed
// ** Before running this script, start apache and mySQL in XAMPP
// ** from W3Schools php tutorials 

$servername = "localhost";
$username = "root";
$password = "password";
$dbname = "myDB2";
$tablename = "test_tasks";
// Create connection
$conn = new mysqli($servername, $username, database: $dbname);
// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

//drop table if desired, comment out otherwise
// $sql = "DROP TABLE {$tablename}";
// if ($conn->query($sql) === TRUE) {
//     echo "Table dropped successfully";
//   } else {
//     echo "Error dropping table: " . $conn->error;
//   }

//drop entire database if desired, comment out otherwise
$sql = "DROP DATABASE {$dbname}";
if ($conn->query($sql) === TRUE) {
    echo "Database dropped successfully";
  } else {
    echo "Error dropping database: " . $conn->error;
  }



$conn->close();
?>


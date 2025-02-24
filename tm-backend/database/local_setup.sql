-- create database
CREATE DATABASE IF NOT EXISTS taskmasters_db;
USE taskmasters_db;

-- create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


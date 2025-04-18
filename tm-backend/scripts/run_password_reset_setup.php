<?php
/**
 * Run Password Reset Setup
 * 
 * This script sets up the password reset system by:
 * 1. Creating the password_reset_tokens table
 * 2. Testing the email configuration
 * 
 * Usage: php run_password_reset_setup.php
 */

echo "Setting up password reset system...\n\n";

// Step 1: Create the password_reset_tokens table
echo "Step 1: Creating password_reset_tokens table...\n";
include_once 'check_password_reset_table.php';

// Step 2: Test the email configuration
echo "\nStep 2: Testing email configuration...\n";
include_once 'test_email.php';

echo "\nPassword reset system setup completed.\n";
echo "You can now use the 'Forgot Password?' feature on the login page.\n";
?>

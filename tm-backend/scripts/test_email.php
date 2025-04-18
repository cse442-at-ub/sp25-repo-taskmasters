<?php
/**
 * Test Email Sending
 * 
 * This script tests the email sending functionality by sending a test email
 * to the specified email address using the configured email settings.
 * 
 * Usage: php test_email.php recipient@example.com
 */

// Include the EmailSender class
require_once '../utils/EmailSender.php';

// Check if email is provided
if ($argc < 2) {
    echo "Usage: php test_email.php recipient@example.com\n";
    exit(1);
}

$email = $argv[1];

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "Error: Invalid email format\n";
    exit(1);
}

echo "Sending test email to $email...\n";

// Send a test email
$subject = "TaskMasters Email Test";
$htmlBody = "
<html>
<head>
    <title>TaskMasters Email Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #9706e9; color: white; padding: 10px 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>TaskMasters</h1>
        </div>
        <div class='content'>
            <h2>Email Test</h2>
            <p>This is a test email from TaskMasters to verify that the email sending functionality is working correctly.</p>
            <p>If you received this email, it means that the email configuration is set up correctly!</p>
        </div>
        <div class='footer'>
            <p>TaskMasters - Organize your tasks efficiently</p>
        </div>
    </div>
</body>
</html>
";

// Send the email
$result = EmailSender::sendHtmlEmail($email, $subject, $htmlBody);

if ($result) {
    echo "Test email sent successfully!\n";
} else {
    echo "Failed to send test email. Check the error logs for more information.\n";
}
?>

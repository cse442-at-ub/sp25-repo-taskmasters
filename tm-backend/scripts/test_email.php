<?php
/**
 * Test Email
 * 
 * This script tests the email configuration by sending a test email.
 * 
 * Usage: php test_email.php [recipient_email]
 */

// Include email configuration
include_once '../config/email_config.php';
include_once '../utils/EmailSender.php';

// Get recipient email from command line argument or use default
$recipientEmail = isset($argv[1]) ? $argv[1] : 'test@example.com';

echo "Testing email configuration...\n";
echo "Recipient email: $recipientEmail\n";

// Email subject
$subject = "TaskMasters Test Email";

// Email content with HTML
$htmlBody = "
<html>
<head>
    <title>TaskMasters Test Email</title>
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
            <h2>Test Email</h2>
            <p>This is a test email from TaskMasters.</p>
            <p>If you received this email, the email configuration is working correctly.</p>
            <p>You can now use the password reset functionality.</p>
        </div>
        <div class='footer'>
            <p>TaskMasters - Organize your tasks efficiently</p>
        </div>
    </div>
</body>
</html>
";

// Send the email
$result = EmailSender::sendHtmlEmail($recipientEmail, $subject, $htmlBody);

if ($result) {
    echo "Email sent successfully to $recipientEmail.\n";
} else {
    echo "Failed to send email to $recipientEmail.\n";
}
?>

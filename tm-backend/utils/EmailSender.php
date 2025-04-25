<?php
/**
 * EmailSender class for handling email operations
 * 
 * This class provides a robust way to send emails using either PHP's built-in mail() function
 * or SMTP for more reliable delivery.
 */

// Include email configuration
require_once __DIR__ . '/../config/email_config.php';

class EmailSender {
    /**
     * Send an email using the configured method (SMTP or mail())
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlBody HTML content of the email
     * @param string $from From email address (optional)
     * @param string $fromName From name (optional)
     * @return bool True if email was sent successfully, false otherwise
     */
    public static function sendHtmlEmail($to, $subject, $htmlBody, $from = null, $fromName = null) {
        // Use configuration values if not provided
        $from = $from ?: getEmailConfig('from_email', 'noreply@taskmasters.com');
        $fromName = $fromName ?: getEmailConfig('from_name', 'TaskMasters');
        $replyTo = getEmailConfig('reply_to', $from);
        
        // Check if SMTP is enabled
        if (getEmailConfig('smtp.enabled', false)) {
            return self::sendSmtpEmail($to, $subject, $htmlBody, $from, $fromName);
        } else {
            return self::sendMailEmail($to, $subject, $htmlBody, $from, $fromName);
        }
    }
    
    /**
     * Send an email using PHP's mail() function
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlBody HTML content of the email
     * @param string $from From email address
     * @param string $fromName From name
     * @return bool True if email was sent successfully, false otherwise
     */
    private static function sendMailEmail($to, $subject, $htmlBody, $from, $fromName) {
        // Create headers
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "From: $fromName <$from>\r\n";
        $headers .= "Reply-To: $from\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        
        // Log the email attempt
        error_log("Attempting to send email via mail() to: $to, Subject: $subject");
        
        // Send the email
        $result = mail($to, $subject, $htmlBody, $headers);
        
        // Log the result
        if ($result) {
            error_log("Email sent successfully to: $to");
        } else {
            error_log("Failed to send email to: $to");
        }
        
        return $result;
    }
    
    /**
     * Send an email using SMTP
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlBody HTML content of the email
     * @param string $from From email address
     * @param string $fromName From name
     * @return bool True if email was sent successfully, false otherwise
     */
    private static function sendSmtpEmail($to, $subject, $htmlBody, $from, $fromName) {
        // Get SMTP configuration
        $host = getEmailConfig('smtp.host', 'smtp.gmail.com');
        $port = getEmailConfig('smtp.port', 587);
        $username = getEmailConfig('smtp.username', '');
        $password = getEmailConfig('smtp.password', '');
        $secure = getEmailConfig('smtp.secure', 'tls');
        
        // Log the email attempt
        error_log("Attempting to send email via SMTP to: $to, Subject: $subject");
        
        try {
            // Create a unique boundary for multipart message
            $boundary = md5(time());
            
            // Connect to SMTP server
            $smtpConnect = fsockopen(($secure == 'ssl' ? 'ssl://' : '') . $host, $port, $errno, $errstr, 30);
            if (!$smtpConnect) {
                throw new Exception("SMTP connection failed: $errstr ($errno)");
            }
            
            // Check connection response
            if (!self::checkResponse($smtpConnect, 220)) {
                throw new Exception("SMTP server not ready");
            }
            
            // Say hello to the server
            fputs($smtpConnect, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
            if (!self::checkResponse($smtpConnect, 250)) {
                throw new Exception("EHLO command failed");
            }
            
            // Start TLS if required
            if ($secure == 'tls') {
                fputs($smtpConnect, "STARTTLS\r\n");
                if (!self::checkResponse($smtpConnect, 220)) {
                    throw new Exception("STARTTLS command failed");
                }
                
                // Enable crypto
                stream_socket_enable_crypto($smtpConnect, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                
                // Say hello again after TLS
                fputs($smtpConnect, "EHLO " . $_SERVER['SERVER_NAME'] . "\r\n");
                if (!self::checkResponse($smtpConnect, 250)) {
                    throw new Exception("EHLO command failed after TLS");
                }
            }
            
            // Authenticate
            fputs($smtpConnect, "AUTH LOGIN\r\n");
            if (!self::checkResponse($smtpConnect, 334)) {
                throw new Exception("AUTH LOGIN command failed");
            }
            
            // Send username
            fputs($smtpConnect, base64_encode($username) . "\r\n");
            if (!self::checkResponse($smtpConnect, 334)) {
                throw new Exception("Username not accepted");
            }
            
            // Send password
            fputs($smtpConnect, base64_encode($password) . "\r\n");
            if (!self::checkResponse($smtpConnect, 235)) {
                throw new Exception("Authentication failed");
            }
            
            // Set sender
            fputs($smtpConnect, "MAIL FROM: <$from>\r\n");
            if (!self::checkResponse($smtpConnect, 250)) {
                throw new Exception("MAIL FROM command failed");
            }
            
            // Set recipient
            fputs($smtpConnect, "RCPT TO: <$to>\r\n");
            if (!self::checkResponse($smtpConnect, 250)) {
                throw new Exception("RCPT TO command failed");
            }
            
            // Start data
            fputs($smtpConnect, "DATA\r\n");
            if (!self::checkResponse($smtpConnect, 354)) {
                throw new Exception("DATA command failed");
            }
            
            // Prepare email headers and body
            $message = "From: $fromName <$from>\r\n";
            $message .= "To: $to\r\n";
            $message .= "Subject: $subject\r\n";
            $message .= "MIME-Version: 1.0\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 8bit\r\n";
            $message .= "\r\n";
            $message .= $htmlBody;
            $message .= "\r\n.\r\n";
            
            // Send the message
            fputs($smtpConnect, $message);
            if (!self::checkResponse($smtpConnect, 250)) {
                throw new Exception("Message sending failed");
            }
            
            // Close connection
            fputs($smtpConnect, "QUIT\r\n");
            fclose($smtpConnect);
            
            error_log("Email sent successfully via SMTP to: $to");
            return true;
        } catch (Exception $e) {
            error_log("SMTP Error: " . $e->getMessage());
            if (isset($smtpConnect) && is_resource($smtpConnect)) {
                fclose($smtpConnect);
            }
            return false;
        }
    }
    
    /**
     * Check SMTP server response
     * 
     * @param resource $connection SMTP connection resource
     * @param int $expectedCode Expected response code
     * @return bool True if response matches expected code, false otherwise
     */
    private static function checkResponse($connection, $expectedCode) {
        $response = '';
        while ($line = fgets($connection, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') {
                break;
            }
        }
        
        $code = substr($response, 0, 3);
        error_log("SMTP Response: $response");
        
        return $code == $expectedCode;
    }
    
    /**
     * Generate a password reset email
     * 
     * @param string $email Recipient email address
     * @param string $token Reset token
     * @param string $resetUrl Reset URL
     * @return bool True if email was sent successfully, false otherwise
     */
    public static function sendPasswordResetEmail($email, $token, $resetUrl = null) {
        // If reset URL is not provided, generate it
        if ($resetUrl === null) {
            // Get the base URL from configuration or request
            $baseUrl = getEmailConfig('base_url', '');
            
            if (empty($baseUrl)) {
                // Use the current host if base_url is not configured
                $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'];
                $baseUrl = $protocol . '://' . $host;
            }
            
            // Generate the reset URL with email parameter instead of token
            $resetUrl = $baseUrl . "/#/reset-password?email=" . urlencode($email);
            
            // Log the reset URL for debugging
            error_log("Generated reset URL: $resetUrl");
        }
        
        // Email subject
        $subject = "TaskMasters Password Reset";
        
        // Email content with HTML
        $htmlBody = "
        <html>
        <head>
            <title>Reset Your TaskMasters Password</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9706e9; color: white; padding: 10px 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; background-color: #9706e9; color: white; padding: 10px 20px; 
                          text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>TaskMasters</h1>
                </div>
                <div class='content'>
                    <h2>Reset Your Password</h2>
                    <p>You recently requested to reset your password for your TaskMasters account. Click the button below to reset it.</p>
                    <p><a href='$resetUrl' class='button'>Reset Password</a></p>
                    <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
                    <p>This password reset link is only valid for 1 hour.</p>
                </div>
                <div class='footer'>
                    <p>TaskMasters - Organize your tasks efficiently</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        // Send the email
        return self::sendHtmlEmail($email, $subject, $htmlBody);
    }
}
?>

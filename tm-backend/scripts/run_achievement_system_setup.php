<?php
/**
 * Run Achievement System Setup
 * 
 * This script sets up the achievement system by:
 * 1. Creating the necessary tables
 * 2. Initializing the achievements
 * 3. Setting up achievement notifications
 * 4. Updating achievement progress for all users
 * 
 * Usage: php run_achievement_system_setup.php
 */

echo "Setting up achievement system...\n\n";

// Step 1: Create the necessary tables
echo "Step 1: Creating necessary tables...\n";
include_once 'create_achievement_progress_table.php';

// Step 2: Set up the achievement system
echo "\nStep 2: Setting up achievement system...\n";
include_once 'setup_achievement_system.php';

// Step 3: Update achievements for all users
echo "\nStep 3: Updating achievements for all users...\n";
include_once 'update_achievements.php';

// Step 4: Set up achievement notifications
echo "\nStep 4: Setting up achievement notifications...\n";
include_once 'send_achievement_emails.php';

echo "\nAchievement system setup completed.\n";
echo "You can now use the achievement system.\n";
?>

#!/bin/bash

# Script to run the achievement progress updater
# This script can be added to a cron job to run periodically
# Example cron entry (runs every hour):
# 0 * * * * /path/to/tm-backend/scripts/run_achievement_updater.sh

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the scripts directory
cd "$SCRIPT_DIR"

# Run the PHP script
php update_achievement_progress.php >> achievement_updater.log 2>&1

echo "Achievement updater completed at $(date)"

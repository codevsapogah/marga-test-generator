const cron = require('node-cron');
const BackupService = require('./backupService');

/**
 * Task Scheduler
 * Manages automated background tasks
 */

class Scheduler {
    constructor() {
        this.tasks = [];
    }

    /**
     * Initialize all scheduled tasks
     */
    start() {
        console.log('[Scheduler] Starting scheduled tasks...');

        // Backup students every 24 hours at 2:00 AM
        const backupTask = cron.schedule('0 2 * * *', async () => {
            console.log('[Scheduler] Running daily student backup...');
            try {
                await BackupService.syncStudentsBackup();
            } catch (error) {
                console.error('[Scheduler] Daily backup failed:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Almaty" // Kazakhstan timezone
        });

        this.tasks.push({ name: 'Daily Student Backup', task: backupTask });

        // Optional: Clean old backups once a week (Sunday at 3:00 AM)
        const cleanupTask = cron.schedule('0 3 * * 0', async () => {
            console.log('[Scheduler] Running weekly backup cleanup...');
            try {
                await BackupService.cleanOldBackups(90); // Keep 90 days
            } catch (error) {
                console.error('[Scheduler] Backup cleanup failed:', error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Almaty"
        });

        this.tasks.push({ name: 'Weekly Backup Cleanup', task: cleanupTask });

        console.log(`[Scheduler] ${this.tasks.length} scheduled tasks started successfully`);
        this.tasks.forEach(({ name }) => {
            console.log(`  - ${name}`);
        });

        // Run initial backup on startup
        this.runInitialBackup();
    }

    /**
     * Run initial backup when server starts
     */
    async runInitialBackup() {
        try {
            console.log('[Scheduler] Running initial backup on startup...');
            await BackupService.syncStudentsBackup();
        } catch (error) {
            console.error('[Scheduler] Initial backup failed:', error);
        }
    }

    /**
     * Stop all scheduled tasks
     */
    stop() {
        console.log('[Scheduler] Stopping all scheduled tasks...');
        this.tasks.forEach(({ name, task }) => {
            task.stop();
            console.log(`  - Stopped: ${name}`);
        });
        this.tasks = [];
    }

    /**
     * Get status of all scheduled tasks
     */
    getStatus() {
        return this.tasks.map(({ name, task }) => ({
            name,
            running: task.getStatus() === 'scheduled'
        }));
    }
}

// Export singleton instance
module.exports = new Scheduler();

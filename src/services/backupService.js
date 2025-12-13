const db = require('../config/database');

/**
 * Backup Service
 * Handles automated backup of students table to students_backup
 * Runs every 24 hours to maintain a historical record
 */

class BackupService {
    /**
     * Sync all students to the backup table
     * Creates a snapshot of current student data
     */
    static async syncStudentsBackup() {
        try {
            console.log('[BackupService] Starting student backup sync...');
            const startTime = Date.now();

            // Get all students (including soft-deleted ones)
            const query = `
                SELECT id, first_name, last_name, class_level, email, phone,
                       created_at, updated_at, deleted_at
                FROM students
            `;

            const [students] = await db.query(query);

            if (students.length === 0) {
                console.log('[BackupService] No students to backup');
                return { success: true, count: 0 };
            }

            // Insert into backup table
            const insertQuery = `
                INSERT INTO students_backup
                (id, first_name, last_name, class_level, email, phone,
                 created_at, updated_at, deleted_at, backup_created_at)
                VALUES ?
            `;

            const values = students.map(student => [
                student.id,
                student.first_name,
                student.last_name,
                student.class_level,
                student.email,
                student.phone,
                student.created_at,
                student.updated_at,
                student.deleted_at,
                new Date() // backup_created_at
            ]);

            await db.query(insertQuery, [values]);

            const duration = Date.now() - startTime;
            console.log(`[BackupService] Backup completed successfully. ${students.length} students backed up in ${duration}ms`);

            return {
                success: true,
                count: students.length,
                duration: duration
            };

        } catch (error) {
            console.error('[BackupService] Backup failed:', error);
            throw new Error(`Backup sync failed: ${error.message}`);
        }
    }

    /**
     * Get backup history summary
     */
    static async getBackupStats() {
        try {
            const query = `
                SELECT
                    DATE(backup_created_at) as backup_date,
                    COUNT(*) as record_count,
                    COUNT(DISTINCT id) as unique_students
                FROM students_backup
                GROUP BY DATE(backup_created_at)
                ORDER BY backup_date DESC
                LIMIT 30
            `;

            const [stats] = await db.query(query);
            return stats;

        } catch (error) {
            console.error('[BackupService] Failed to get backup stats:', error);
            throw error;
        }
    }

    /**
     * Clean old backups (optional - keep last N days)
     * @param {number} daysToKeep - Number of days of backups to retain
     */
    static async cleanOldBackups(daysToKeep = 90) {
        try {
            const query = `
                DELETE FROM students_backup
                WHERE backup_created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            `;

            const [result] = await db.query(query, [daysToKeep]);

            console.log(`[BackupService] Cleaned ${result.affectedRows} old backup records (older than ${daysToKeep} days)`);

            return {
                success: true,
                deletedCount: result.affectedRows
            };

        } catch (error) {
            console.error('[BackupService] Failed to clean old backups:', error);
            throw error;
        }
    }

    /**
     * Restore a student from backup
     * @param {string} studentId - Student ID to restore
     * @param {Date} backupDate - Optional: specific backup date to restore from
     */
    static async restoreFromBackup(studentId, backupDate = null) {
        try {
            let query;
            let params;

            if (backupDate) {
                // Restore from specific backup date
                query = `
                    SELECT id, first_name, last_name, class_level, email, phone
                    FROM students_backup
                    WHERE id = ? AND DATE(backup_created_at) = DATE(?)
                    ORDER BY backup_created_at DESC
                    LIMIT 1
                `;
                params = [studentId, backupDate];
            } else {
                // Restore from most recent backup
                query = `
                    SELECT id, first_name, last_name, class_level, email, phone
                    FROM students_backup
                    WHERE id = ?
                    ORDER BY backup_created_at DESC
                    LIMIT 1
                `;
                params = [studentId];
            }

            const [backups] = await db.query(query, params);

            if (backups.length === 0) {
                throw new Error('No backup found for this student');
            }

            return backups[0];

        } catch (error) {
            console.error('[BackupService] Failed to restore from backup:', error);
            throw error;
        }
    }
}

module.exports = BackupService;

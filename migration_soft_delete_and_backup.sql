-- Migration: Add Soft Delete and Backup functionality
-- Date: 2025-11-01
-- Description: Adds deleted_at column for soft deletes and creates students_backup table

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Step 1: Add deleted_at column to students table for soft delete
ALTER TABLE students
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp - NULL means active, value means in trash';

-- Add index on deleted_at for efficient queries
ALTER TABLE students
ADD INDEX idx_deleted_at (deleted_at);

-- Step 2: Create students_backup table (mirrors students table structure)
CREATE TABLE IF NOT EXISTS students_backup (
    id CHAR(6) NOT NULL COMMENT '6-digit ID (100000-999999). Display shows initials: ИИ-123456',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_level INT NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Backup includes soft-deleted records',
    backup_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this backup record was created',

    -- Composite primary key: id + backup_created_at allows multiple backups of same student
    PRIMARY KEY (id, backup_created_at),

    INDEX idx_class (class_level),
    INDEX idx_name (last_name, first_name),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_backup_date (backup_created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT 'Daily backup of students table - syncs every 24 hours';

-- Step 3: Create initial backup from current students
INSERT INTO students_backup (id, first_name, last_name, class_level, email, phone, created_at, updated_at, deleted_at)
SELECT id, first_name, last_name, class_level, email, phone, created_at, updated_at, NULL as deleted_at
FROM students;

-- Verify migration
SELECT 'Migration complete!' as status;
SELECT COUNT(*) as active_students FROM students WHERE deleted_at IS NULL;
SELECT COUNT(*) as deleted_students FROM students WHERE deleted_at IS NOT NULL;
SELECT COUNT(*) as backup_records FROM students_backup;

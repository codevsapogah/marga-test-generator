const db = require('../config/database');

/**
 * Generate student ID from name
 * Format: 6-digit number (for OMR reliability)
 * Display format shows initials for easy recognition: ИИ-123456
 * Bubble format: pure 6 digits (easier OMR scanning)
 */
function generateStudentId(firstName, lastName) {
    // Generate 6 random digits (100000-999999)
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return randomNumber.toString();
}

/**
 * Get display format of student ID (with initials for easy reading)
 * Example: 123456 for student "Иван Иванов" shows as "ИИ-123456"
 */
function getDisplayId(studentId, firstName, lastName) {
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}-${studentId}`;
}

/**
 * Check if student ID already exists (only active students)
 */
async function studentIdExists(studentId) {
    const [rows] = await db.execute(
        'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL',
        [studentId]
    );
    return rows.length > 0;
}

/**
 * Generate unique student ID (check for collisions)
 */
async function generateUniqueStudentId(firstName, lastName) {
    let attempts = 0;
    let studentId;

    // Try up to 10 times to generate unique ID
    while (attempts < 10) {
        studentId = generateStudentId(firstName, lastName);

        const exists = await studentIdExists(studentId);
        if (!exists) {
            return studentId;
        }

        attempts++;
    }

    // If still colliding after 10 attempts, add extra digit
    const extraDigit = Math.floor(Math.random() * 10);
    return `${generateStudentId(firstName, lastName)}${extraDigit}`;
}

/**
 * Register a new student
 */
async function registerStudent(studentData) {
    const { firstName, lastName, classLevel, email, phone } = studentData;

    // Validate required fields
    if (!firstName || !lastName || !classLevel) {
        throw new Error('Необходимо указать имя, фамилию и класс');
    }

    // Generate unique student ID
    const studentId = await generateUniqueStudentId(firstName, lastName);

    // Insert into database
    await db.execute(`
        INSERT INTO students (id, first_name, last_name, class_level, email, phone)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [studentId, firstName, lastName, classLevel, email || null, phone || null]);

    return {
        studentId,
        firstName,
        lastName,
        classLevel,
        email,
        phone
    };
}

/**
 * Get student by ID (only active students)
 */
async function getStudentById(studentId) {
    const [rows] = await db.execute(
        'SELECT * FROM students WHERE id = ? AND deleted_at IS NULL',
        [studentId]
    );

    if (rows.length === 0) {
        return null;
    }

    return rows[0];
}

/**
 * Get all active students in a class
 */
async function getStudentsByClass(classLevel) {
    const [rows] = await db.execute(
        'SELECT * FROM students WHERE class_level = ? AND deleted_at IS NULL ORDER BY last_name, first_name',
        [classLevel]
    );

    return rows;
}

/**
 * Get all active students (excluding soft-deleted)
 */
async function getAllStudents() {
    const [rows] = await db.execute(
        'SELECT * FROM students WHERE deleted_at IS NULL ORDER BY class_level, last_name, first_name'
    );

    return rows;
}

/**
 * Update student information (only active students)
 */
async function updateStudent(studentId, updates) {
    const { firstName, lastName, classLevel, email, phone } = updates;

    const fields = [];
    const values = [];

    if (firstName) {
        fields.push('first_name = ?');
        values.push(firstName);
    }
    if (lastName) {
        fields.push('last_name = ?');
        values.push(lastName);
    }
    if (classLevel) {
        fields.push('class_level = ?');
        values.push(classLevel);
    }
    if (email !== undefined) {
        fields.push('email = ?');
        values.push(email);
    }
    if (phone !== undefined) {
        fields.push('phone = ?');
        values.push(phone);
    }

    if (fields.length === 0) {
        throw new Error('Нет данных для обновления');
    }

    values.push(studentId);

    await db.execute(`
        UPDATE students
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deleted_at IS NULL
    `, values);

    return await getStudentById(studentId);
}

/**
 * Soft delete student (move to trash)
 */
async function deleteStudent(studentId) {
    // Soft delete: set deleted_at timestamp
    await db.execute(
        'UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [studentId]
    );

    return true;
}

/**
 * Get student statistics
 */
async function getStudentStats(studentId) {
    // Get all test results for this student
    const [results] = await db.execute(`
        SELECT
            sr.*,
            t.test_name,
            t.class_level,
            t.total_questions
        FROM student_results sr
        JOIN tests t ON sr.test_id = t.id
        WHERE sr.student_id = ?
        ORDER BY sr.submitted_at DESC
    `, [studentId]);

    if (results.length === 0) {
        return {
            totalTests: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            recentTests: []
        };
    }

    const percentages = results.map(r => parseFloat(r.percentage));

    return {
        totalTests: results.length,
        averageScore: percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        highestScore: Math.max(...percentages),
        lowestScore: Math.min(...percentages),
        recentTests: results.slice(0, 5)
    };
}

/**
 * Search active students by name or ID
 */
async function searchStudents(query) {
    const [rows] = await db.execute(`
        SELECT * FROM students
        WHERE (first_name LIKE ? OR last_name LIKE ? OR id LIKE ?)
        AND deleted_at IS NULL
        ORDER BY last_name, first_name
        LIMIT 50
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    return rows;
}

/**
 * Bulk import students from array
 */
async function bulkImportStudents(studentsArray) {
    const results = {
        success: [],
        failed: []
    };

    for (const studentData of studentsArray) {
        try {
            const student = await registerStudent(studentData);
            results.success.push(student);
        } catch (error) {
            results.failed.push({
                data: studentData,
                error: error.message
            });
        }
    }

    return results;
}

// ========== TRASH MANAGEMENT FUNCTIONS ==========

/**
 * Get all deleted students (in trash)
 */
async function getDeletedStudents() {
    const [rows] = await db.execute(
        'SELECT * FROM students WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
    );

    return rows;
}

/**
 * Restore student from trash (undelete)
 */
async function restoreStudent(studentId) {
    await db.execute(
        'UPDATE students SET deleted_at = NULL WHERE id = ?',
        [studentId]
    );

    return await getStudentById(studentId);
}

/**
 * Permanently delete student from database
 * WARNING: This cannot be undone!
 */
async function permanentlyDeleteStudent(studentId) {
    // Check if student has any results
    const [results] = await db.execute(
        'SELECT COUNT(*) as count FROM student_results WHERE student_id = ?',
        [studentId]
    );

    if (results[0].count > 0) {
        throw new Error('Невозможно удалить студента с существующими результатами. Студент останется в базе данных.');
    }

    // Hard delete
    await db.execute('DELETE FROM students WHERE id = ?', [studentId]);

    return true;
}

/**
 * Permanently delete all students in trash
 * WARNING: This cannot be undone!
 */
async function cleanAllTrash() {
    // Get all deleted students
    const [deletedStudents] = await db.execute(
        'SELECT id FROM students WHERE deleted_at IS NOT NULL'
    );

    const results = {
        deleted: 0,
        skipped: 0,
        errors: []
    };

    for (const student of deletedStudents) {
        try {
            // Check if student has results
            const [testResults] = await db.execute(
                'SELECT COUNT(*) as count FROM student_results WHERE student_id = ?',
                [student.id]
            );

            if (testResults[0].count > 0) {
                // Skip students with results
                results.skipped++;
            } else {
                // Permanently delete
                await db.execute('DELETE FROM students WHERE id = ?', [student.id]);
                results.deleted++;
            }
        } catch (error) {
            results.errors.push({
                studentId: student.id,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Get trash statistics
 */
async function getTrashStats() {
    const [stats] = await db.execute(`
        SELECT
            COUNT(*) as total_deleted,
            COUNT(DISTINCT class_level) as classes_affected,
            MIN(deleted_at) as oldest_deletion,
            MAX(deleted_at) as newest_deletion
        FROM students
        WHERE deleted_at IS NOT NULL
    `);

    return stats[0];
}

module.exports = {
    generateStudentId,
    generateUniqueStudentId,
    getDisplayId,
    registerStudent,
    getStudentById,
    getStudentsByClass,
    getAllStudents,
    updateStudent,
    deleteStudent,
    getStudentStats,
    searchStudents,
    bulkImportStudents,
    // Trash management
    getDeletedStudents,
    restoreStudent,
    permanentlyDeleteStudent,
    cleanAllTrash,
    getTrashStats
};

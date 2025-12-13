const studentService = require('../services/studentService');

/**
 * Register a new student
 */
exports.register = async (req, res, next) => {
    try {
        const { firstName, lastName, classLevel, email, phone } = req.body;

        const student = await studentService.registerStudent({
            firstName,
            lastName,
            classLevel: parseInt(classLevel),
            email,
            phone
        });

        const displayId = studentService.getDisplayId(student.studentId, firstName, lastName);

        res.status(201).json({
            success: true,
            message: 'Студент зарегистрирован успешно',
            student: {
                ...student,
                displayId
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student by ID
 */
exports.getById = async (req, res, next) => {
    try {
        const student = await studentService.getStudentById(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Студент не найден'
            });
        }

        const displayId = studentService.getDisplayId(
            student.id,
            student.first_name,
            student.last_name
        );

        res.json({
            success: true,
            student: {
                id: student.id,
                displayId,
                firstName: student.first_name,
                lastName: student.last_name,
                classLevel: student.class_level,
                email: student.email,
                phone: student.phone,
                createdAt: student.created_at
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all students
 */
exports.getAll = async (req, res, next) => {
    try {
        const { classLevel } = req.query;

        let students;
        if (classLevel) {
            students = await studentService.getStudentsByClass(parseInt(classLevel));
        } else {
            students = await studentService.getAllStudents();
        }

        const studentsWithDisplayId = students.map(s => ({
            id: s.id,
            displayId: studentService.getDisplayId(s.id, s.first_name, s.last_name),
            firstName: s.first_name,
            lastName: s.last_name,
            classLevel: s.class_level,
            email: s.email
        }));

        res.json({
            success: true,
            count: students.length,
            students: studentsWithDisplayId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Search students
 */
exports.search = async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Поисковый запрос должен содержать минимум 2 символа'
            });
        }

        const students = await studentService.searchStudents(q);

        const studentsWithDisplayId = students.map(s => ({
            id: s.id,
            displayId: studentService.getDisplayId(s.id, s.first_name, s.last_name),
            firstName: s.first_name,
            lastName: s.last_name,
            classLevel: s.class_level
        }));

        res.json({
            success: true,
            count: students.length,
            students: studentsWithDisplayId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update student
 */
exports.update = async (req, res, next) => {
    try {
        const { firstName, lastName, classLevel, email, phone } = req.body;

        const student = await studentService.updateStudent(req.params.id, {
            firstName,
            lastName,
            classLevel: classLevel ? parseInt(classLevel) : undefined,
            email,
            phone
        });

        res.json({
            success: true,
            message: 'Данные студента обновлены',
            student
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete student
 */
exports.delete = async (req, res, next) => {
    try {
        await studentService.deleteStudent(req.params.id);

        res.json({
            success: true,
            message: 'Студент удален'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student statistics
 */
exports.getStats = async (req, res, next) => {
    try {
        const stats = await studentService.getStudentStats(req.params.id);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Bulk import students
 */
exports.bulkImport = async (req, res, next) => {
    try {
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Необходим массив студентов'
            });
        }

        const results = await studentService.bulkImportStudents(students);

        res.json({
            success: true,
            message: `Импортировано ${results.success.length} студентов`,
            imported: results.success.length,
            failed: results.failed.length,
            results
        });
    } catch (error) {
        next(error);
    }
};

// ========== TRASH MANAGEMENT ENDPOINTS ==========

/**
 * Get all deleted students (trash)
 */
exports.getTrash = async (req, res, next) => {
    try {
        const students = await studentService.getDeletedStudents();

        const studentsWithDisplayId = students.map(s => ({
            id: s.id,
            displayId: studentService.getDisplayId(s.id, s.first_name, s.last_name),
            firstName: s.first_name,
            lastName: s.last_name,
            classLevel: s.class_level,
            email: s.email,
            deletedAt: s.deleted_at
        }));

        res.json({
            success: true,
            count: students.length,
            students: studentsWithDisplayId
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Restore student from trash
 */
exports.restore = async (req, res, next) => {
    try {
        const student = await studentService.restoreStudent(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Студент не найден в корзине'
            });
        }

        res.json({
            success: true,
            message: 'Студент восстановлен из корзины',
            student
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Permanently delete student
 */
exports.permanentDelete = async (req, res, next) => {
    try {
        await studentService.permanentlyDeleteStudent(req.params.id);

        res.json({
            success: true,
            message: 'Студент удален навсегда'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clean all trash (permanently delete all students in trash)
 */
exports.cleanAllTrash = async (req, res, next) => {
    try {
        const results = await studentService.cleanAllTrash();

        res.json({
            success: true,
            message: `Корзина очищена. Удалено: ${results.deleted}, Пропущено (с результатами): ${results.skipped}`,
            results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get trash statistics
 */
exports.getTrashStats = async (req, res, next) => {
    try {
        const stats = await studentService.getTrashStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

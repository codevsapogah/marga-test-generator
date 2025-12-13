const Result = require('../models/Result');
const Test = require('../models/Test');
const studentService = require('../services/studentService');
const scannerService = require('../services/scannerService');
const diagnosticService = require('../services/diagnosticService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Process scanned answer sheet
 */
exports.scan = async (req, res, next) => {
    try {
        const { testId } = req.body;

        if (!testId) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать ID теста'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо загрузить изображение бланка ответов'
            });
        }

        // Get test information
        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Тест не найден'
            });
        }

        // Verify scan quality
        const quality = await scannerService.verifyScanQuality(req.file.path);

        if (!quality.valid) {
            return res.status(400).json({
                success: false,
                message: 'Низкое качество сканирования',
                errors: quality.errors
            });
        }

        // Process answer sheet
        const scanResult = await scannerService.processAnswerSheet(
            req.file.path,
            testId,
            test.totalQuestions
        );

        // Check if student exists
        const student = await studentService.getStudentById(scanResult.studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: `Студент с номером ${scanResult.studentId} не найден. Проверьте заполнение номера.`,
                detectedId: scanResult.studentId
            });
        }

        // Check if result already exists
        const existing = await Result.exists(testId, scanResult.studentId);

        if (existing) {
            const existingResult = await Result.findById(existing.id);
            return res.json({
                success: true,
                cached: true,
                message: 'Результат для этого студента уже существует',
                result: existingResult
            });
        }

        // Grade the test
        let score = 0;
        for (const [questionNum, studentAnswer] of Object.entries(scanResult.answers)) {
            if (studentAnswer === test.answerKey[questionNum]) {
                score++;
            }
        }

        const percentage = (score / test.totalQuestions) * 100;

        // Generate diagnostics
        const diagnostics = await diagnosticService.generateDiagnostics(
            testId,
            scanResult.answers,
            test.answerKey
        );

        // Save scanned image
        const scannedSheetUrl = `/scans/${path.basename(req.file.path)}`;

        // Save result
        const resultId = await Result.create({
            testId,
            studentId: scanResult.studentId,
            studentName: `${student.first_name} ${student.last_name}`,
            scannedSheetUrl,
            answers: scanResult.answers,
            score,
            totalQuestions: test.totalQuestions,
            percentage,
            diagnostics,
            needsReview: scanResult.needsReview
        });

        const result = await Result.findById(resultId);

        res.json({
            success: true,
            cached: false,
            message: 'Бланк обработан успешно',
            result,
            scanConfidence: scanResult.confidence
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get result by ID
 */
exports.getById = async (req, res, next) => {
    try {
        const result = await Result.findById(req.params.id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Результат не найден'
            });
        }

        res.json({
            success: true,
            result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all results for a test
 */
exports.getByTest = async (req, res, next) => {
    try {
        const results = await Result.getByTest(req.params.testId);

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all results for a student
 */
exports.getByStudent = async (req, res, next) => {
    try {
        const results = await Result.getByStudent(req.params.studentId);

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get results needing manual review
 */
exports.getNeedingReview = async (req, res, next) => {
    try {
        const results = await Result.getNeedingReview();

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Manual correction of answers
 */
exports.correct = async (req, res, next) => {
    try {
        const { answers, reviewedBy } = req.body;

        if (!answers) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать ответы'
            });
        }

        const result = await Result.updateAnswers(
            req.params.id,
            answers,
            reviewedBy || 'admin'
        );

        res.json({
            success: true,
            message: 'Ответы обновлены',
            ...result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get class statistics
 */
exports.getClassStats = async (req, res, next) => {
    try {
        const stats = await Result.getClassStats(req.params.testId);

        if (!stats) {
            return res.status(404).json({
                success: false,
                message: 'Нет результатов для этого теста'
            });
        }

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

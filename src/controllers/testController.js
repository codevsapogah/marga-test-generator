const Test = require('../models/Test');
const Problem = require('../models/Problem');
const testGenerationService = require('../services/testGenerationService');

/**
 * Generate a new test
 */
exports.generate = async (req, res, next) => {
    try {
        const {
            testName,
            classLevel,
            numberOfQuestions,
            language,
            difficultyLevels,
            tags,
            quarter,
            month
        } = req.body;

        // Validate required fields
        if (!testName || !classLevel || !numberOfQuestions || !language) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать название теста, класс, количество вопросов и язык'
            });
        }

        // Check if enough problems exist
        const availableCount = await Problem.count({
            classLevel,
            difficultyLevels,
            tags,
            quarter,
            month
        });

        if (availableCount < numberOfQuestions) {
            return res.status(400).json({
                success: false,
                message: `Найдено только ${availableCount} задач. Необходимо ${numberOfQuestions}.`
            });
        }

        // Generate test
        const result = await testGenerationService.generateTest({
            testName,
            classLevel: parseInt(classLevel),
            numberOfQuestions: parseInt(numberOfQuestions),
            language,
            difficultyLevels,
            tags,
            quarter: quarter ? parseInt(quarter) : null,
            month: month ? parseInt(month) : null
        });

        res.status(201).json({
            success: true,
            message: 'Тест сгенерирован успешно',
            test: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all tests
 */
exports.getAll = async (req, res, next) => {
    try {
        const filters = {
            classLevel: req.query.classLevel ? parseInt(req.query.classLevel) : null,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };

        const tests = await Test.getAll(filters);

        res.json({
            success: true,
            count: tests.length,
            tests
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get test by ID
 */
exports.getById = async (req, res, next) => {
    try {
        const test = await Test.findById(req.params.id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Тест не найден'
            });
        }

        res.json({
            success: true,
            test
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete test
 */
exports.delete = async (req, res, next) => {
    try {
        await Test.delete(req.params.id);

        res.json({
            success: true,
            message: 'Тест удален'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get test statistics
 */
exports.getStats = async (req, res, next) => {
    try {
        const stats = await Test.getStats(req.params.id);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Regenerate PDFs for an existing test
 */
exports.regeneratePDFs = async (req, res, next) => {
    try {
        const testId = req.params.id;

        // Get test details
        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Тест не найден'
            });
        }

        // Get test problems with their answers
        const testProblems = await Test.getProblems(testId);

        if (!testProblems || testProblems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Вопросы теста не найдены'
            });
        }

        // Regenerate PDFs
        const { generateTestPDF } = require('../services/pdfService');
        const { generateAnswerSheet, generateAnswerKey } = require('../services/answerSheetService');

        const pdfData = {
            testId: test.id,
            testName: test.testName,
            classLevel: test.classLevel,
            language: test.language,
            totalQuestions: test.totalQuestions
        };

        // Generate test questions PDF
        const testPdfUrl = await generateTestPDF(testProblems, pdfData);

        // Generate answer sheet PDF
        const answerSheetUrl = await generateAnswerSheet(pdfData);

        // Generate answer key PDF (extract from answer_key JSON)
        const answerKey = typeof test.answer_key === 'string'
            ? JSON.parse(test.answer_key)
            : test.answer_key;
        const answerKeyUrl = await generateAnswerKey(pdfData, answerKey);

        // Update test with new PDF URLs
        await Test.updateUrls(testId, {
            pdfUrl: testPdfUrl,
            answerSheetUrl,
            answerKeyUrl
        });

        res.json({
            success: true,
            message: 'PDFs успешно перегенерированы',
            urls: {
                testPdfUrl,
                answerSheetUrl,
                answerKeyUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

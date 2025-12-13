const Problem = require('../models/Problem');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload and optimize image
 */
async function uploadImage(file, folder) {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path.join(
        process.env.STORAGE_PATH || './storage',
        'images',
        folder,
        filename
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Optimize image
    await sharp(file.buffer)
        .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);

    return `/images/${folder}/${filename}`;
}

/**
 * Create a new problem
 */
exports.create = async (req, res, next) => {
    try {
        // Handle both JSON and multipart/form-data
        let rawData = req.body.problemData
            ? JSON.parse(req.body.problemData)
            : req.body;

        // Normalize data format (support both textRu and problemText.ru)
        const problemData = {
            problemText: {
                ru: rawData.textRu || rawData.problemText?.ru,
                kz: rawData.textKz || rawData.problemText?.kz || null,
                en: rawData.textEn || rawData.problemText?.en || null
            },
            correctAnswer: rawData.correctAnswer,
            wrongAnswers: rawData.wrongAnswers,
            classLevel: rawData.classLevel,
            difficultyLevel: rawData.difficulty || rawData.difficultyLevel,
            formula: rawData.formula || null,
            problemImageUrl: rawData.problemImageUrl || null,
            solutionImageUrl: rawData.solutionImageUrl || null,
            solution: rawData.solution || null,
            curriculum: {
                quarter: rawData.quarter || rawData.curriculum?.quarter || null,
                month: rawData.month || rawData.curriculum?.month || null
            },
            tags: rawData.tags || []
        };

        // Validate required fields
        if (!problemData.problemText.ru || !problemData.correctAnswer || !problemData.wrongAnswers) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать текст задачи и варианты ответов'
            });
        }

        if (problemData.wrongAnswers.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо указать 3 неправильных ответа'
            });
        }

        // Upload images if provided
        if (req.files?.problemImage) {
            problemData.problemImageUrl = await uploadImage(
                req.files.problemImage[0],
                'problems'
            );
        }

        if (req.files?.solutionImage) {
            problemData.solutionImageUrl = await uploadImage(
                req.files.solutionImage[0],
                'solutions'
            );
        }

        const problemId = await Problem.create(problemData);

        res.status(201).json({
            success: true,
            problemId,
            message: 'Задача создана успешно'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get problem by ID
 */
exports.getById = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Задача не найдена'
            });
        }

        res.json({
            success: true,
            problem
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Search problems
 */
exports.search = async (req, res, next) => {
    try {
        const filters = {
            classLevel: req.query.classLevel ? parseInt(req.query.classLevel) : null,
            difficultyLevels: req.query.difficulty ? req.query.difficulty.split(',') : null,
            tags: req.query.tags ? req.query.tags.split(',') : null,
            quarter: req.query.quarter ? parseInt(req.query.quarter) : null,
            month: req.query.month ? parseInt(req.query.month) : null,
            limit: req.query.limit ? parseInt(req.query.limit) : 100,
            random: req.query.random === 'true'
        };

        const problems = await Problem.search(filters);

        res.json({
            success: true,
            count: problems.length,
            problems
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update problem
 */
exports.update = async (req, res, next) => {
    try {
        const updateData = req.body;

        await Problem.update(req.params.id, updateData);

        res.json({
            success: true,
            message: 'Задача обновлена успешно'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete problem
 */
exports.delete = async (req, res, next) => {
    try {
        await Problem.delete(req.params.id);

        res.json({
            success: true,
            message: 'Задача удалена'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all unique tags
 */
exports.getTags = async (req, res, next) => {
    try {
        const tags = await Problem.getAllTags();

        res.json({
            success: true,
            tags
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get problem count
 */
exports.count = async (req, res, next) => {
    try {
        const filters = {
            classLevel: req.query.classLevel ? parseInt(req.query.classLevel) : null,
            difficultyLevels: req.query.difficulty ? req.query.difficulty.split(',') : null,
            tags: req.query.tags ? req.query.tags.split(',') : null
        };

        const count = await Problem.count(filters);

        res.json({
            success: true,
            count
        });
    } catch (error) {
        next(error);
    }
};

const { v4: uuidv4 } = require('uuid');
const Problem = require('../models/Problem');
const Test = require('../models/Test');
const { generateAnswerSheet, generateAnswerKey } = require('./answerSheetService');
const { generateTestPDF } = require('./pdfService');

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Generate a complete test with PDFs
 */
async function generateTest(config) {
    // 1. Search for matching problems with random ordering
    const problems = await Problem.search({
        classLevel: config.classLevel,
        difficultyLevels: config.difficultyLevels,
        tags: config.tags,
        quarter: config.quarter,
        month: config.month,
        limit: config.numberOfQuestions,
        random: true
    });

    if (problems.length < config.numberOfQuestions) {
        throw new Error(
            `Найдено только ${problems.length} задач. Необходимо ${config.numberOfQuestions}.`
        );
    }

    // 2. Create test record
    const testId = await Test.create({
        testName: config.testName,
        language: config.language,
        classLevel: config.classLevel,
        totalQuestions: config.numberOfQuestions
    });

    // 3. Prepare test problems with shuffled answers
    const testProblems = [];
    const answerKey = {};

    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];
        const questionNumber = i + 1;

        // Collect all answers
        const allAnswers = [
            problem.correctAnswer,
            ...problem.wrongAnswers
        ];

        // Shuffle answers
        const shuffledAnswers = shuffleArray(allAnswers);

        // Find position of correct answer after shuffling
        const correctPosition = shuffledAnswers.indexOf(problem.correctAnswer);
        const correctLetter = String.fromCharCode(65 + correctPosition); // A, B, C, D

        // Save to test_problems table
        await Test.addProblem(
            testId,
            problem.id,
            questionNumber,
            shuffledAnswers,
            correctPosition
        );

        // Prepare for PDF generation
        testProblems.push({
            questionNumber,
            problemText: problem.problemText[config.language],
            formula: problem.formula,
            problemImageUrl: problem.problemImageUrl,
            answers: shuffledAnswers.map((ans, idx) => ({
                letter: String.fromCharCode(65 + idx),
                text: ans
            }))
        });

        answerKey[questionNumber] = correctLetter;

        // Increment usage count
        await Problem.incrementUsageCount(problem.id);
    }

    // 4. Generate PDFs
    const pdfData = {
        testId,
        testName: config.testName,
        classLevel: config.classLevel,
        language: config.language,
        totalQuestions: config.numberOfQuestions
    };

    // Generate test questions PDF
    const testPdfUrl = await generateTestPDF(testProblems, pdfData);

    // Generate answer sheet PDF
    const answerSheetUrl = await generateAnswerSheet(pdfData);

    // Generate answer key PDF
    const answerKeyUrl = await generateAnswerKey(pdfData, answerKey);

    // 5. Update test with PDF URLs and answer key
    await Test.updateUrls(testId, {
        pdfUrl: testPdfUrl,
        answerSheetUrl,
        answerKeyUrl
    });

    // Update answer key in database
    await require('../config/database').execute(
        'UPDATE tests SET answer_key = ? WHERE id = ?',
        [JSON.stringify(answerKey), testId]
    );

    return {
        testId,
        testName: config.testName,
        classLevel: config.classLevel,
        language: config.language,
        totalQuestions: config.numberOfQuestions,
        testPdfUrl,
        answerSheetUrl,
        answerKeyUrl,
        answerKey
    };
}

module.exports = {
    generateTest
};

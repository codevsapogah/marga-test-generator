const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Problem = require('./Problem');

class Test {
    /**
     * Create a new test
     */
    static async create(testData) {
        const id = uuidv4();

        await db.execute(`
            INSERT INTO tests (
                id, test_name, language, class_level, total_questions,
                created_by, answer_key
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            testData.testName,
            testData.language || 'ru',
            testData.classLevel,
            testData.totalQuestions,
            testData.createdBy || null,
            testData.answerKey ? JSON.stringify(testData.answerKey) : null
        ]);

        return id;
    }

    /**
     * Get test by ID
     */
    static async findById(id) {
        const [tests] = await db.execute(`
            SELECT * FROM tests WHERE id = ?
        `, [id]);

        if (tests.length === 0) {
            return null;
        }

        const test = tests[0];

        // Get test problems
        const [problems] = await db.execute(`
            SELECT
                tp.question_order,
                tp.shuffled_answers,
                tp.correct_answer_position,
                mp.*
            FROM test_problems tp
            JOIN math_problems mp ON tp.problem_id = mp.id
            WHERE tp.test_id = ?
            ORDER BY tp.question_order
        `, [id]);

        return {
            id: test.id,
            testName: test.test_name,
            language: test.language,
            classLevel: test.class_level,
            totalQuestions: test.total_questions,
            createdBy: test.created_by,
            createdAt: test.created_at,
            pdfUrl: test.pdf_url,
            answerSheetUrl: test.answer_sheet_url,
            answerKeyUrl: test.answer_key_url,
            answerKey: typeof test.answer_key === 'string' ? JSON.parse(test.answer_key) : test.answer_key,
            answer_key: typeof test.answer_key === 'string' ? JSON.parse(test.answer_key) : test.answer_key,
            problems: problems.map(p => ({
                questionOrder: p.question_order,
                problemId: p.id,
                problemText: p[`problem_text_${test.language}`],
                formula: p.formula,
                problemImageUrl: p.problem_image_url,
                shuffledAnswers: typeof p.shuffled_answers === 'string' ? JSON.parse(p.shuffled_answers) : p.shuffled_answers,
                correctAnswerPosition: String.fromCharCode(65 + p.correct_answer_position) // 0=A, 1=B, etc.
            }))
        };
    }

    /**
     * Get all tests
     */
    static async getAll(filters = {}) {
        let query = 'SELECT * FROM tests WHERE 1=1';
        const params = [];

        if (filters.classLevel) {
            query += ' AND class_level = ?';
            params.push(filters.classLevel);
        }

        query += ' ORDER BY created_at DESC';

        if (filters.limit) {
            const limit = parseInt(filters.limit);
            query += ` LIMIT ${limit}`;
        }

        const [tests] = await db.execute(query, params);

        return tests.map(t => ({
            id: t.id,
            testName: t.test_name,
            language: t.language,
            classLevel: t.class_level,
            totalQuestions: t.total_questions,
            createdAt: t.created_at,
            pdfUrl: t.pdf_url,
            answerSheetUrl: t.answer_sheet_url,
            answerKeyUrl: t.answer_key_url
        }));
    }

    /**
     * Update test URLs after PDF generation
     */
    static async updateUrls(id, urls) {
        const updates = [];
        const params = [];

        if (urls.pdfUrl) {
            updates.push('pdf_url = ?');
            params.push(urls.pdfUrl);
        }

        if (urls.answerSheetUrl) {
            updates.push('answer_sheet_url = ?');
            params.push(urls.answerSheetUrl);
        }

        if (urls.answerKeyUrl) {
            updates.push('answer_key_url = ?');
            params.push(urls.answerKeyUrl);
        }

        if (updates.length > 0) {
            params.push(id);
            await db.execute(`
                UPDATE tests SET ${updates.join(', ')} WHERE id = ?
            `, params);
        }

        return true;
    }

    /**
     * Add problem to test
     */
    static async addProblem(testId, problemId, questionOrder, shuffledAnswers, correctAnswerPosition) {
        await db.execute(`
            INSERT INTO test_problems (
                test_id, problem_id, question_order,
                shuffled_answers, correct_answer_position
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            testId,
            problemId,
            questionOrder,
            JSON.stringify(shuffledAnswers),
            correctAnswerPosition
        ]);

        return true;
    }

    /**
     * Delete test
     */
    static async delete(id) {
        // Check if test has any results
        const [results] = await db.execute(`
            SELECT COUNT(*) as count FROM student_results WHERE test_id = ?
        `, [id]);

        if (results[0].count > 0) {
            throw new Error('Невозможно удалить тест с существующими результатами');
        }

        await db.execute(`DELETE FROM tests WHERE id = ?`, [id]);
        return true;
    }

    /**
     * Get test statistics
     */
    static async getStats(testId) {
        // Get all results for this test
        const [results] = await db.execute(`
            SELECT * FROM student_results WHERE test_id = ?
        `, [testId]);

        if (results.length === 0) {
            return {
                totalSubmissions: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passRate: 0
            };
        }

        const scores = results.map(r => parseFloat(r.percentage));
        const passThreshold = 70; // 70% to pass
        const passCount = scores.filter(s => s >= passThreshold).length;

        return {
            totalSubmissions: results.length,
            averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            passRate: (passCount / results.length) * 100
        };
    }

    /**
     * Get test problems in PDF-ready format
     */
    static async getProblems(testId) {
        // Get test to know the language
        const [tests] = await db.execute(`
            SELECT language FROM tests WHERE id = ?
        `, [testId]);

        if (tests.length === 0) {
            return null;
        }

        const language = tests[0].language;

        // Get problems with shuffled answers
        const [problems] = await db.execute(`
            SELECT
                tp.question_order,
                tp.shuffled_answers,
                tp.correct_answer_position,
                mp.problem_text_ru,
                mp.problem_text_kz,
                mp.problem_text_en,
                mp.formula,
                mp.problem_image_url
            FROM test_problems tp
            JOIN math_problems mp ON tp.problem_id = mp.id
            WHERE tp.test_id = ?
            ORDER BY tp.question_order
        `, [testId]);

        return problems.map(p => {
            const shuffledAnswers = typeof p.shuffled_answers === 'string'
                ? JSON.parse(p.shuffled_answers)
                : p.shuffled_answers;

            return {
                questionNumber: p.question_order,
                problemText: p[`problem_text_${language}`],
                formula: p.formula,
                problemImageUrl: p.problem_image_url,
                answers: shuffledAnswers.map((ans, idx) => ({
                    letter: String.fromCharCode(65 + idx), // A, B, C, D
                    text: ans
                }))
            };
        });
    }
}

module.exports = Test;

const db = require('../config/database');

class Result {
    /**
     * Create a new student result
     */
    static async create(resultData) {
        const [result] = await db.execute(`
            INSERT INTO student_results (
                test_id, student_id, student_name,
                scanned_sheet_url, answers, score,
                total_questions, percentage, diagnostics,
                needs_review
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            resultData.testId,
            resultData.studentId,
            resultData.studentName,
            resultData.scannedSheetUrl || null,
            JSON.stringify(resultData.answers),
            resultData.score,
            resultData.totalQuestions,
            resultData.percentage,
            JSON.stringify(resultData.diagnostics),
            resultData.needsReview || false
        ]);

        return result.insertId;
    }

    /**
     * Check if result already exists
     */
    static async exists(testId, studentId) {
        const [results] = await db.execute(`
            SELECT id FROM student_results
            WHERE test_id = ? AND student_id = ?
        `, [testId, studentId]);

        return results.length > 0 ? results[0] : null;
    }

    /**
     * Get result by ID
     */
    static async findById(id) {
        const [results] = await db.execute(`
            SELECT
                sr.*,
                t.test_name,
                t.class_level,
                s.first_name,
                s.last_name
            FROM student_results sr
            JOIN tests t ON sr.test_id = t.id
            JOIN students s ON sr.student_id = s.id
            WHERE sr.id = ?
        `, [id]);

        if (results.length === 0) {
            return null;
        }

        const result = results[0];

        return {
            id: result.id,
            testId: result.test_id,
            testName: result.test_name,
            studentId: result.student_id,
            studentName: result.student_name,
            firstName: result.first_name,
            lastName: result.last_name,
            classLevel: result.class_level,
            scannedSheetUrl: result.scanned_sheet_url,
            answers: JSON.parse(result.answers),
            score: result.score,
            totalQuestions: result.total_questions,
            percentage: parseFloat(result.percentage),
            diagnostics: JSON.parse(result.diagnostics),
            needsReview: result.needs_review,
            reviewedBy: result.reviewed_by,
            reviewedAt: result.reviewed_at,
            submittedAt: result.submitted_at
        };
    }

    /**
     * Get all results for a test
     */
    static async getByTest(testId) {
        const [results] = await db.execute(`
            SELECT
                sr.*,
                s.first_name,
                s.last_name
            FROM student_results sr
            JOIN students s ON sr.student_id = s.id
            WHERE sr.test_id = ?
            ORDER BY sr.percentage DESC, sr.submitted_at ASC
        `, [testId]);

        return results.map(r => {
            const firstInitial = r.first_name.charAt(0).toUpperCase();
            const lastInitial = r.last_name.charAt(0).toUpperCase();
            const displayId = `${firstInitial}${lastInitial}-${r.student_id}`;

            return {
                id: r.id,
                studentId: r.student_id,
                studentName: r.student_name,
                displayId: displayId,
                firstName: r.first_name,
                lastName: r.last_name,
                score: r.score,
                totalQuestions: r.total_questions,
                percentage: parseFloat(r.percentage),
                diagnostics: r.diagnostics,
                needsReview: r.needs_review,
                submittedAt: r.submitted_at
            };
        });
    }

    /**
     * Get all results for a student
     */
    static async getByStudent(studentId) {
        const [results] = await db.execute(`
            SELECT
                sr.*,
                t.test_name,
                t.class_level
            FROM student_results sr
            JOIN tests t ON sr.test_id = t.id
            WHERE sr.student_id = ?
            ORDER BY sr.submitted_at DESC
        `, [studentId]);

        return results.map(r => ({
            id: r.id,
            testId: r.test_id,
            testName: r.test_name,
            classLevel: r.class_level,
            score: r.score,
            totalQuestions: r.total_questions,
            percentage: parseFloat(r.percentage),
            diagnostics: JSON.parse(r.diagnostics),
            submittedAt: r.submitted_at
        }));
    }

    /**
     * Get results that need manual review
     */
    static async getNeedingReview() {
        const [results] = await db.execute(`
            SELECT
                sr.*,
                t.test_name,
                s.first_name,
                s.last_name
            FROM student_results sr
            JOIN tests t ON sr.test_id = t.id
            JOIN students s ON sr.student_id = s.id
            WHERE sr.needs_review = TRUE AND sr.reviewed_at IS NULL
            ORDER BY sr.submitted_at ASC
        `);

        return results.map(r => ({
            id: r.id,
            testId: r.test_id,
            testName: r.test_name,
            studentId: r.student_id,
            studentName: r.student_name,
            firstName: r.first_name,
            lastName: r.last_name,
            submittedAt: r.submitted_at
        }));
    }

    /**
     * Update answers (manual correction)
     */
    static async updateAnswers(id, answers, reviewedBy) {
        // Recalculate score
        const result = await Result.findById(id);

        // Get test answer key
        const [test] = await db.execute(`
            SELECT answer_key FROM tests WHERE id = ?
        `, [result.testId]);

        const answerKey = JSON.parse(test[0].answer_key);

        let score = 0;
        for (const [questionNum, correctAnswer] of Object.entries(answerKey)) {
            if (answers[questionNum] === correctAnswer) {
                score++;
            }
        }

        const percentage = (score / result.totalQuestions) * 100;

        await db.execute(`
            UPDATE student_results
            SET answers = ?, score = ?, percentage = ?,
                needs_review = FALSE, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(answers), score, percentage, reviewedBy, id]);

        return { score, percentage };
    }

    /**
     * Delete result
     */
    static async delete(id) {
        await db.execute(`DELETE FROM student_results WHERE id = ?`, [id]);
        return true;
    }

    /**
     * Get class statistics for a test
     */
    static async getClassStats(testId) {
        const results = await Result.getByTest(testId);

        if (results.length === 0) {
            return null;
        }

        const scores = results.map(r => r.percentage);

        // Group by score ranges
        const scoreRanges = {
            'excellent': scores.filter(s => s >= 90).length,     // A
            'good': scores.filter(s => s >= 70 && s < 90).length,  // B
            'satisfactory': scores.filter(s => s >= 50 && s < 70).length, // C
            'poor': scores.filter(s => s < 50).length              // F
        };

        return {
            totalStudents: results.length,
            averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            medianScore: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            scoreRanges,
            passRate: ((results.length - scoreRanges.poor) / results.length) * 100
        };
    }
}

module.exports = Result;

const db = require('../config/database');

/**
 * Generate diagnostic analysis for student results
 */
async function generateDiagnostics(testId, studentAnswers, answerKey) {
    // Get all test problems with their metadata
    const [testProblems] = await db.execute(`
        SELECT
            tp.question_order,
            tp.correct_answer_position,
            mp.difficulty_level,
            pt.tag_name
        FROM test_problems tp
        JOIN math_problems mp ON tp.problem_id = mp.id
        LEFT JOIN problem_tags pt ON mp.id = pt.problem_id
        WHERE tp.test_id = ?
        ORDER BY tp.question_order
    `, [testId]);

    // Initialize analysis structures
    const byTopic = {};
    const byDifficulty = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 }
    };

    // Analyze each question
    for (const problem of testProblems) {
        const questionNum = problem.question_order.toString();
        const studentAnswer = studentAnswers[questionNum];
        const correctAnswer = answerKey[questionNum];
        const isCorrect = studentAnswer === correctAnswer;

        // By difficulty
        const difficulty = problem.difficulty_level;
        byDifficulty[difficulty].total++;
        if (isCorrect) {
            byDifficulty[difficulty].correct++;
        }

        // By topic (if tag exists)
        if (problem.tag_name) {
            if (!byTopic[problem.tag_name]) {
                byTopic[problem.tag_name] = { correct: 0, total: 0 };
            }
            byTopic[problem.tag_name].total++;
            if (isCorrect) {
                byTopic[problem.tag_name].correct++;
            }
        }
    }

    // Calculate percentages
    for (const topic in byTopic) {
        if (byTopic[topic].total > 0) {
            byTopic[topic].percentage =
                Math.round((byTopic[topic].correct / byTopic[topic].total) * 100);
        }
    }

    for (const difficulty in byDifficulty) {
        if (byDifficulty[difficulty].total > 0) {
            byDifficulty[difficulty].percentage =
                Math.round((byDifficulty[difficulty].correct / byDifficulty[difficulty].total) * 100);
        }
    }

    // Identify weak topics (< 70%)
    const weakTopics = Object.entries(byTopic)
        .filter(([_, stats]) => stats.percentage < 70)
        .map(([topic, _]) => topic);

    // Identify weak difficulty levels
    const weakDifficulties = Object.entries(byDifficulty)
        .filter(([_, stats]) => stats.percentage < 70 && stats.total > 0)
        .map(([difficulty, _]) => difficulty);

    return {
        byTopic,
        byDifficulty,
        weakTopics,
        weakDifficulties,
        summary: generateSummary(byTopic, byDifficulty)
    };
}

/**
 * Generate text summary of performance
 */
function generateSummary(byTopic, byDifficulty) {
    const summary = [];

    // Overall difficulty performance
    if (byDifficulty.easy.total > 0) {
        summary.push(
            `Легкие задачи: ${byDifficulty.easy.percentage}% (${byDifficulty.easy.correct}/${byDifficulty.easy.total})`
        );
    }
    if (byDifficulty.medium.total > 0) {
        summary.push(
            `Средние задачи: ${byDifficulty.medium.percentage}% (${byDifficulty.medium.correct}/${byDifficulty.medium.total})`
        );
    }
    if (byDifficulty.hard.total > 0) {
        summary.push(
            `Сложные задачи: ${byDifficulty.hard.percentage}% (${byDifficulty.hard.correct}/${byDifficulty.hard.total})`
        );
    }

    // Best topics
    const topicEntries = Object.entries(byTopic);
    if (topicEntries.length > 0) {
        const best = topicEntries
            .filter(([_, stats]) => stats.percentage >= 80)
            .map(([topic, stats]) => `${topic} (${stats.percentage}%)`)
            .join(', ');

        if (best) {
            summary.push(`Сильные темы: ${best}`);
        }

        // Weak topics
        const weak = topicEntries
            .filter(([_, stats]) => stats.percentage < 70)
            .map(([topic, stats]) => `${topic} (${stats.percentage}%)`)
            .join(', ');

        if (weak) {
            summary.push(`Требуют улучшения: ${weak}`);
        }
    }

    return summary;
}

/**
 * Compare student performance across multiple tests
 */
async function getStudentProgress(studentId) {
    const [results] = await db.execute(`
        SELECT
            sr.percentage,
            sr.diagnostics,
            sr.submitted_at,
            t.test_name
        FROM student_results sr
        JOIN tests t ON sr.test_id = t.id
        WHERE sr.student_id = ?
        ORDER BY sr.submitted_at ASC
    `, [studentId]);

    if (results.length === 0) {
        return null;
    }

    const scores = results.map(r => ({
        date: r.submitted_at,
        score: parseFloat(r.percentage),
        testName: r.test_name
    }));

    // Calculate trend
    const firstScore = scores[0].score;
    const lastScore = scores[scores.length - 1].score;
    const trend = lastScore - firstScore;

    return {
        scores,
        trend,
        averageScore: scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
        improvement: trend > 0,
        totalTests: scores.length
    };
}

module.exports = {
    generateDiagnostics,
    getStudentProgress
};

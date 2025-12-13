const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Problem {
    /**
     * Create a new math problem
     */
    static async create(problemData) {
        const id = uuidv4();

        const [result] = await db.execute(`
            INSERT INTO math_problems (
                id, problem_text_ru, problem_text_kz, problem_text_en,
                correct_answer, answer_option_2, answer_option_3, answer_option_4,
                formula, problem_image_url, solution_text, solution_image_url,
                class_level, difficulty_level, curriculum_month, curriculum_quarter
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            problemData.problemText.ru,
            problemData.problemText.kz,
            problemData.problemText.en,
            problemData.correctAnswer,
            problemData.wrongAnswers[0],
            problemData.wrongAnswers[1],
            problemData.wrongAnswers[2],
            problemData.formula || null,
            problemData.problemImageUrl || null,
            problemData.solution?.text || null,
            problemData.solutionImageUrl || null,
            problemData.classLevel,
            problemData.difficultyLevel,
            problemData.curriculum?.month || null,
            problemData.curriculum?.quarter || null
        ]);

        // Insert tags (max 5)
        if (problemData.tags && problemData.tags.length > 0) {
            if (problemData.tags.length > 5) {
                throw new Error('Максимум 5 тэгов на задачу');
            }

            const tagValues = problemData.tags.map(tag => [id, tag]);
            await db.query(`
                INSERT INTO problem_tags (problem_id, tag_name) VALUES ?
            `, [tagValues]);
        }

        return id;
    }

    /**
     * Get problem by ID
     */
    static async findById(id) {
        const [problems] = await db.execute(`
            SELECT * FROM math_problems WHERE id = ?
        `, [id]);

        if (problems.length === 0) {
            return null;
        }

        const problem = problems[0];

        // Get tags
        const [tags] = await db.execute(`
            SELECT tag_name FROM problem_tags WHERE problem_id = ?
        `, [id]);

        problem.tags = tags.map(t => t.tag_name);

        // Format problem object
        return {
            id: problem.id,
            problemText: {
                ru: problem.problem_text_ru,
                kz: problem.problem_text_kz,
                en: problem.problem_text_en
            },
            correctAnswer: problem.correct_answer,
            wrongAnswers: [
                problem.answer_option_2,
                problem.answer_option_3,
                problem.answer_option_4
            ],
            formula: problem.formula,
            problemImageUrl: problem.problem_image_url,
            solution: {
                text: problem.solution_text,
                imageUrl: problem.solution_image_url
            },
            classLevel: problem.class_level,
            difficultyLevel: problem.difficulty_level,
            curriculum: {
                month: problem.curriculum_month,
                quarter: problem.curriculum_quarter
            },
            tags: problem.tags,
            usageCount: problem.usage_count,
            createdAt: problem.created_at,
            updatedAt: problem.updated_at
        };
    }

    /**
     * Search problems with filters
     */
    static async search(filters) {
        let query = `
            SELECT DISTINCT mp.*
            FROM math_problems mp
            LEFT JOIN problem_tags pt ON mp.id = pt.problem_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.classLevel) {
            query += ` AND mp.class_level = ?`;
            params.push(filters.classLevel);
        }

        if (filters.difficultyLevels && filters.difficultyLevels.length > 0) {
            query += ` AND mp.difficulty_level IN (${filters.difficultyLevels.map(() => '?').join(',')})`;
            params.push(...filters.difficultyLevels);
        }

        if (filters.tags && filters.tags.length > 0) {
            query += ` AND pt.tag_name IN (${filters.tags.map(() => '?').join(',')})`;
            params.push(...filters.tags);
        }

        if (filters.quarter) {
            query += ` AND mp.curriculum_quarter = ?`;
            params.push(filters.quarter);
        }

        if (filters.month) {
            query += ` AND mp.curriculum_month = ?`;
            params.push(filters.month);
        }

        // Random ordering for test generation
        if (filters.random) {
            query += ` ORDER BY RAND()`;
        } else {
            query += ` ORDER BY mp.created_at DESC`;
        }

        const limit = parseInt(filters.limit) || 100;
        query += ` LIMIT ${limit}`;

        const [problems] = await db.execute(query, params);

        // Format problems and add tags
        const formattedProblems = await Promise.all(
            problems.map(async (problem) => {
                const [tags] = await db.execute(
                    'SELECT tag_name FROM problem_tags WHERE problem_id = ?',
                    [problem.id]
                );

                return {
                    id: problem.id,
                    problemText: {
                        ru: problem.problem_text_ru,
                        kz: problem.problem_text_kz,
                        en: problem.problem_text_en
                    },
                    correctAnswer: problem.correct_answer,
                    wrongAnswers: [
                        problem.answer_option_2,
                        problem.answer_option_3,
                        problem.answer_option_4
                    ],
                    formula: problem.formula,
                    problemImageUrl: problem.problem_image_url,
                    solution: {
                        text: problem.solution_text,
                        imageUrl: problem.solution_image_url
                    },
                    classLevel: problem.class_level,
                    difficultyLevel: problem.difficulty_level,
                    curriculum: {
                        month: problem.curriculum_month,
                        quarter: problem.curriculum_quarter
                    },
                    tags: tags.map(t => t.tag_name),
                    usageCount: problem.usage_count,
                    createdAt: problem.created_at,
                    updatedAt: problem.updated_at
                };
            })
        );

        return formattedProblems;
    }

    /**
     * Update problem
     */
    static async update(id, updateData) {
        const updates = [];
        const params = [];

        if (updateData.problemText) {
            updates.push('problem_text_ru = ?', 'problem_text_kz = ?', 'problem_text_en = ?');
            params.push(
                updateData.problemText.ru,
                updateData.problemText.kz,
                updateData.problemText.en
            );
        }

        if (updateData.correctAnswer) {
            updates.push('correct_answer = ?');
            params.push(updateData.correctAnswer);
        }

        if (updateData.wrongAnswers) {
            updates.push('answer_option_2 = ?', 'answer_option_3 = ?', 'answer_option_4 = ?');
            params.push(...updateData.wrongAnswers);
        }

        if (updateData.formula !== undefined) {
            updates.push('formula = ?');
            params.push(updateData.formula);
        }

        if (updateData.difficultyLevel) {
            updates.push('difficulty_level = ?');
            params.push(updateData.difficultyLevel);
        }

        if (updateData.classLevel) {
            updates.push('class_level = ?');
            params.push(updateData.classLevel);
        }

        if (updateData.curriculum) {
            if (updateData.curriculum.month !== undefined) {
                updates.push('curriculum_month = ?');
                params.push(updateData.curriculum.month);
            }
            if (updateData.curriculum.quarter !== undefined) {
                updates.push('curriculum_quarter = ?');
                params.push(updateData.curriculum.quarter);
            }
        }

        if (updates.length > 0) {
            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await db.execute(`
                UPDATE math_problems
                SET ${updates.join(', ')}
                WHERE id = ?
            `, params);
        }

        // Update tags if provided
        if (updateData.tags) {
            if (updateData.tags.length > 5) {
                throw new Error('Максимум 5 тэгов на задачу');
            }

            await db.execute(`DELETE FROM problem_tags WHERE problem_id = ?`, [id]);

            if (updateData.tags.length > 0) {
                const tagValues = updateData.tags.map(tag => [id, tag]);
                await db.query(`
                    INSERT INTO problem_tags (problem_id, tag_name) VALUES ?
                `, [tagValues]);
            }
        }

        return true;
    }

    /**
     * Delete problem
     */
    static async delete(id) {
        // Check if used in any tests
        const [tests] = await db.execute(`
            SELECT COUNT(*) as count FROM test_problems WHERE problem_id = ?
        `, [id]);

        if (tests[0].count > 0) {
            throw new Error('Невозможно удалить задачу, которая используется в тестах');
        }

        await db.execute(`DELETE FROM math_problems WHERE id = ?`, [id]);
        return true;
    }

    /**
     * Increment usage count
     */
    static async incrementUsageCount(id) {
        await db.execute(`
            UPDATE math_problems SET usage_count = usage_count + 1 WHERE id = ?
        `, [id]);
    }

    /**
     * Get all unique tags
     */
    static async getAllTags() {
        const [tags] = await db.execute(`
            SELECT DISTINCT tag_name FROM problem_tags ORDER BY tag_name
        `);

        return tags.map(t => t.tag_name);
    }

    /**
     * Get problem count by filters
     */
    static async count(filters = {}) {
        let query = `
            SELECT COUNT(DISTINCT mp.id) as count
            FROM math_problems mp
            LEFT JOIN problem_tags pt ON mp.id = pt.problem_id
            WHERE 1=1
        `;
        const params = [];

        if (filters.classLevel) {
            query += ` AND mp.class_level = ?`;
            params.push(filters.classLevel);
        }

        if (filters.difficultyLevels && filters.difficultyLevels.length > 0) {
            query += ` AND mp.difficulty_level IN (${filters.difficultyLevels.map(() => '?').join(',')})`;
            params.push(...filters.difficultyLevels);
        }

        if (filters.tags && filters.tags.length > 0) {
            query += ` AND pt.tag_name IN (${filters.tags.map(() => '?').join(',')})`;
            params.push(...filters.tags);
        }

        const [result] = await db.execute(query, params);
        return result[0].count;
    }
}

module.exports = Problem;

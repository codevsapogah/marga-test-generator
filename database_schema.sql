-- MARGA: Math Assessment Recognition & Grading Automation
-- Database Schema for Local VPS (MySQL)

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Drop existing tables (in correct order to avoid foreign key issues)
DROP TABLE IF EXISTS student_results;
DROP TABLE IF EXISTS test_problems;
DROP TABLE IF EXISTS problem_tags;
DROP TABLE IF EXISTS tests;
DROP TABLE IF EXISTS math_problems;
DROP TABLE IF EXISTS students;

-- Students Table
CREATE TABLE students (
    id CHAR(6) PRIMARY KEY COMMENT '6-digit ID (100000-999999). Display shows initials: ИИ-123456',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    class_level INT NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_class (class_level),
    INDEX idx_name (last_name, first_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Math Problems Table
CREATE TABLE math_problems (
    id VARCHAR(36) PRIMARY KEY,

    -- Multilingual problem text
    problem_text_ru TEXT NOT NULL,
    problem_text_kz TEXT NOT NULL,
    problem_text_en TEXT NOT NULL,

    -- Answers (1 correct + 3 wrong)
    correct_answer VARCHAR(500) NOT NULL,
    answer_option_2 VARCHAR(500) NOT NULL,
    answer_option_3 VARCHAR(500) NOT NULL,
    answer_option_4 VARCHAR(500) NOT NULL,

    -- Optional content
    formula TEXT COMMENT 'LaTeX format',
    problem_image_url VARCHAR(500),
    solution_text TEXT,
    solution_image_url VARCHAR(500),

    -- Metadata
    class_level INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL,

    -- Curriculum placement
    curriculum_month INT,
    curriculum_quarter INT,

    -- Usage tracking
    usage_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_class_level (class_level),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_curriculum (curriculum_quarter, curriculum_month),
    INDEX idx_usage (usage_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem Tags Table (max 5 tags per problem)
CREATE TABLE problem_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(100) NOT NULL,

    FOREIGN KEY (problem_id) REFERENCES math_problems(id) ON DELETE CASCADE,

    INDEX idx_problem_tags (problem_id),
    INDEX idx_tag_name (tag_name),

    CONSTRAINT unique_problem_tag UNIQUE (problem_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tests Table
CREATE TABLE tests (
    id VARCHAR(36) PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    language ENUM('ru', 'kz', 'en') NOT NULL DEFAULT 'ru',
    class_level INT NOT NULL,
    total_questions INT NOT NULL,

    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    pdf_url VARCHAR(500),
    answer_sheet_url VARCHAR(500),
    answer_key_url VARCHAR(500),
    answer_key JSON COMMENT 'Format: {"1": "A", "2": "B", ...}',

    INDEX idx_class (class_level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test Problems Table (links tests to problems with shuffled answers)
CREATE TABLE test_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    question_order INT NOT NULL,

    shuffled_answers JSON NOT NULL COMMENT 'Array of 4 answers in shuffled order',
    correct_answer_position INT NOT NULL COMMENT '0=A, 1=B, 2=C, 3=D',

    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES math_problems(id),

    INDEX idx_test_problems (test_id),
    UNIQUE KEY unique_test_question (test_id, question_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Results Table
CREATE TABLE student_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL,
    student_id CHAR(6) NOT NULL,
    student_name VARCHAR(200) NOT NULL,

    scanned_sheet_url VARCHAR(500),
    answers JSON COMMENT 'Format: {"1": "A", "2": "B", "3": null, ...}',

    score INT NOT NULL,
    total_questions INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,

    diagnostics JSON COMMENT 'Analysis by topic, difficulty, weak areas',

    needs_review BOOLEAN DEFAULT FALSE COMMENT 'True if OMR failed on some questions',
    reviewed_by VARCHAR(100) COMMENT 'Admin who did manual correction',
    reviewed_at TIMESTAMP NULL,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (test_id) REFERENCES tests(id),
    FOREIGN KEY (student_id) REFERENCES students(id),

    INDEX idx_test_results (test_id),
    INDEX idx_student (student_id),
    INDEX idx_needs_review (needs_review),

    -- Prevent duplicate submissions (same student, same test)
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing

-- Sample students (IDs are 6 digits, displayed with initials like ИИ-123456)
INSERT INTO students (id, first_name, last_name, class_level, email) VALUES
('123456', 'Иван', 'Иванов', 7, 'ivan@school.kz'),
('234567', 'Петр', 'Сидоров', 7, 'petr@school.kz'),
('345678', 'Мария', 'Казакова', 8, 'maria@school.kz');

-- Sample problem
INSERT INTO math_problems (
    id,
    problem_text_ru,
    problem_text_kz,
    problem_text_en,
    correct_answer,
    answer_option_2,
    answer_option_3,
    answer_option_4,
    formula,
    class_level,
    difficulty_level,
    curriculum_quarter,
    curriculum_month
) VALUES (
    'prob-001',
    'Решите уравнение: 2x + 5 = 13',
    'Теңдеуді шешіңіз: 2x + 5 = 13',
    'Solve the equation: 2x + 5 = 13',
    'x = 4',
    'x = 3',
    'x = 5',
    'x = 6',
    '2x + 5 = 13',
    7,
    'medium',
    2,
    11
);

-- Sample tags
INSERT INTO problem_tags (problem_id, tag_name) VALUES
('prob-001', 'algebra'),
('prob-001', 'linear_equations');

-- Show tables
SHOW TABLES;

-- Show counts
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'math_problems', COUNT(*) FROM math_problems
UNION ALL
SELECT 'problem_tags', COUNT(*) FROM problem_tags;

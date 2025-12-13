# MARGA Test Generator - Project Architecture & Documentation

## System Overview

A multilingual mathematics test generation system that:
1. Stores math problems with metadata
2. Generates custom tests based on filters
3. Creates PDF outputs
4. Processes scanned answer sheets
5. Provides diagnostic results

---

## Database Schema (PostgreSQL/MySQL for Local VPS)

### Table: `math_problems`

```sql
CREATE TABLE math_problems (
    id VARCHAR(36) PRIMARY KEY,
    problem_text_ru TEXT NOT NULL,
    problem_text_kz TEXT NOT NULL,
    problem_text_en TEXT NOT NULL,

    correct_answer TEXT NOT NULL,
    answer_option_2 TEXT NOT NULL,
    answer_option_3 TEXT NOT NULL,
    answer_option_4 TEXT NOT NULL,

    formula TEXT,
    problem_image_url VARCHAR(500),
    solution_text TEXT,
    solution_image_url VARCHAR(500),

    class_level INT NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL,

    curriculum_month INT,
    curriculum_quarter INT,

    usage_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_class_level (class_level),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_curriculum (curriculum_quarter, curriculum_month)
);
```

### Table: `problem_tags`

```sql
CREATE TABLE problem_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(100) NOT NULL,

    FOREIGN KEY (problem_id) REFERENCES math_problems(id) ON DELETE CASCADE,
    INDEX idx_problem_tags (problem_id),
    INDEX idx_tag_name (tag_name),

    CONSTRAINT unique_problem_tag UNIQUE (problem_id, tag_name),
    CONSTRAINT max_5_tags CHECK (
        (SELECT COUNT(*) FROM problem_tags WHERE problem_id = problem_tags.problem_id) <= 5
    )
);
```

### Table: `tests`

```sql
CREATE TABLE tests (
    id VARCHAR(36) PRIMARY KEY,
    test_name VARCHAR(200) NOT NULL,
    language ENUM('ru', 'kz', 'en') NOT NULL,
    class_level INT NOT NULL,

    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    pdf_url VARCHAR(500),
    answer_key JSON,

    INDEX idx_created_at (created_at)
);
```

### Table: `test_problems`

```sql
CREATE TABLE test_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL,
    problem_id VARCHAR(36) NOT NULL,
    question_order INT NOT NULL,

    shuffled_answers JSON NOT NULL,
    correct_answer_position INT NOT NULL,

    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES math_problems(id),

    INDEX idx_test_problems (test_id)
);
```

### Table: `student_results`

```sql
CREATE TABLE student_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_id VARCHAR(36) NOT NULL,
    student_name VARCHAR(200),
    student_id VARCHAR(100),

    scanned_sheet_url VARCHAR(500),
    answers JSON,
    score INT,
    total_questions INT,
    percentage DECIMAL(5,2),

    diagnostics JSON,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (test_id) REFERENCES tests(id),
    INDEX idx_test_results (test_id),
    INDEX idx_student (student_id)
);
```

---

## Core Data Structures

### MathProblem Object

```javascript
const MathProblem = {
    id: "uuid-v4",

    // Multilingual content
    problemText: {
        ru: "Решите уравнение: 2x + 5 = 13",
        kz: "Теңдеуді шешіңіз: 2x + 5 = 13",
        en: "Solve the equation: 2x + 5 = 13"
    },

    // Answers (correct answer always stored separately)
    correctAnswer: "x = 4",
    wrongAnswers: ["x = 3", "x = 5", "x = 6"],

    // Visual elements
    formula: "2x + 5 = 13",  // LaTeX format
    problemImage: "/images/problems/abc-123.png",

    // Solution
    solution: {
        text: "2x = 13 - 5\n2x = 8\nx = 4",
        image: "/images/solutions/abc-123.png"
    },

    // Metadata
    classLevel: 7,
    difficultyLevel: "medium",  // easy, medium, hard

    // Curriculum placement
    curriculum: {
        quarter: 2,
        month: 11
    },

    // Tags (max 5)
    tags: ["linear_equations", "algebra", "solving_equations"],

    // Usage tracking
    usageCount: 0,

    // Timestamps
    createdAt: "2025-10-31T10:00:00Z",
    updatedAt: "2025-10-31T10:00:00Z"
};
```

### TestFilter Object

```javascript
const TestFilter = {
    classLevel: 7,
    difficultyLevels: ["easy", "medium"],
    tags: ["algebra", "geometry"],
    quarter: 2,
    month: null,
    numberOfQuestions: 20,
    language: "ru"
};
```

### GeneratedTest Object

```javascript
const GeneratedTest = {
    id: "test-uuid",
    testName: "Algebra Test - Quarter 2",
    language: "ru",
    classLevel: 7,
    createdBy: "teacher@school.com",
    createdAt: "2025-10-31T10:00:00Z",

    problems: [
        {
            questionNumber: 1,
            problemId: "problem-uuid-1",
            problemText: "Решите уравнение...",
            formula: "2x + 5 = 13",
            problemImage: "/images/...",

            // Shuffled answers
            answers: [
                { position: "A", text: "x = 5", isCorrect: false },
                { position: "B", text: "x = 4", isCorrect: true },
                { position: "C", text: "x = 3", isCorrect: false },
                { position: "D", text: "x = 6", isCorrect: false }
            ],

            correctAnswerPosition: "B"
        }
        // ... more problems
    ],

    answerKey: {
        "1": "B",
        "2": "C",
        // ...
    },

    pdfUrl: "/pdfs/test-uuid.pdf"
};
```

### StudentResult Object

```javascript
const StudentResult = {
    id: 123,
    testId: "test-uuid",
    studentName: "Иван Иванов",
    studentId: "student-2024-001",

    scannedSheetUrl: "/scans/student-001-test.png",

    answers: {
        "1": "B",
        "2": "A",
        "3": null,  // Not answered
        // ...
    },

    score: 15,
    totalQuestions: 20,
    percentage: 75.00,

    diagnostics: {
        byTopic: {
            "linear_equations": { correct: 3, total: 5, percentage: 60 },
            "quadratic_equations": { correct: 4, total: 5, percentage: 80 }
        },
        byDifficulty: {
            "easy": { correct: 8, total: 10, percentage: 80 },
            "medium": { correct: 5, total: 7, percentage: 71.43 },
            "hard": { correct: 2, total: 3, percentage: 66.67 }
        },
        weakTopics: ["linear_equations", "fractions"]
    },

    submittedAt: "2025-10-31T14:30:00Z"
};
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  (Web Interface / Mobile App / Desktop Application)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    APPLICATION LAYER                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Problem    │  │     Test     │  │   Results    │      │
│  │  Management  │  │  Generation  │  │  Processing  │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     PDF      │  │     OCR      │  │  Diagnostic  │      │
│  │  Generation  │  │   Scanner    │  │   Analysis   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ SQL Queries
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     DATABASE LAYER                            │
│         PostgreSQL/MySQL on Local VPS                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  math_problems  │  problem_tags  │  tests            │   │
│  │  test_problems  │  student_results                    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     FILE STORAGE                              │
│         Local VPS File System / NFS Mount                     │
│                                                               │
│  /storage/images/problems/                                    │
│  /storage/images/solutions/                                   │
│  /storage/pdfs/tests/                                         │
│  /storage/scans/answer-sheets/                                │
└───────────────────────────────────────────────────────────────┘
```

---

## System Logic & Workflows

### 1. Problem Creation Workflow

```
START
  │
  ├─► Input problem data (3 languages)
  │
  ├─► Generate unique ID (UUID)
  │
  ├─► Upload images (if any)
  │   └─► Store in /storage/images/problems/
  │
  ├─► Validate tags (max 5)
  │
  ├─► Insert into math_problems table
  │
  ├─► Insert tags into problem_tags table
  │
  └─► Return problem ID
END
```

**Code Logic:**
```javascript
async function createMathProblem(problemData) {
    // 1. Generate ID
    const problemId = generateUUID();

    // 2. Validate tags
    if (problemData.tags.length > 5) {
        throw new Error("Maximum 5 tags allowed");
    }

    // 3. Upload images
    let problemImageUrl = null;
    let solutionImageUrl = null;

    if (problemData.problemImage) {
        problemImageUrl = await uploadImage(
            problemData.problemImage,
            `problems/${problemId}`
        );
    }

    if (problemData.solutionImage) {
        solutionImageUrl = await uploadImage(
            problemData.solutionImage,
            `solutions/${problemId}`
        );
    }

    // 4. Insert into database
    await db.query(`
        INSERT INTO math_problems (
            id, problem_text_ru, problem_text_kz, problem_text_en,
            correct_answer, answer_option_2, answer_option_3, answer_option_4,
            formula, problem_image_url, solution_text, solution_image_url,
            class_level, difficulty_level, curriculum_month, curriculum_quarter
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        problemId,
        problemData.problemText.ru,
        problemData.problemText.kz,
        problemData.problemText.en,
        problemData.correctAnswer,
        problemData.wrongAnswers[0],
        problemData.wrongAnswers[1],
        problemData.wrongAnswers[2],
        problemData.formula,
        problemImageUrl,
        problemData.solution.text,
        solutionImageUrl,
        problemData.classLevel,
        problemData.difficultyLevel,
        problemData.curriculum.month,
        problemData.curriculum.quarter
    ]);

    // 5. Insert tags
    for (const tag of problemData.tags) {
        await db.query(`
            INSERT INTO problem_tags (problem_id, tag_name)
            VALUES (?, ?)
        `, [problemId, tag]);
    }

    return problemId;
}
```

---

### 2. Test Generation Workflow

```
START
  │
  ├─► Receive filter parameters
  │
  ├─► Query database for matching problems
  │   └─► Filter by: class, difficulty, tags, curriculum
  │
  ├─► Randomly select N questions
  │
  ├─► Shuffle answer options for each question
  │   └─► Randomize A, B, C, D positions
  │
  ├─► Create test record in database
  │
  ├─► Generate PDF
  │   ├─► Render questions with shuffled answers
  │   └─► Include answer sheet template
  │
  ├─► Store PDF
  │
  └─► Return test ID and PDF URL
END
```

**Code Logic:**
```javascript
async function generateTest(filter) {
    // 1. Generate test ID
    const testId = generateUUID();

    // 2. Build query with filters
    let query = `
        SELECT DISTINCT mp.*
        FROM math_problems mp
        LEFT JOIN problem_tags pt ON mp.id = pt.problem_id
        WHERE mp.class_level = ?
    `;

    const params = [filter.classLevel];

    // Add difficulty filter
    if (filter.difficultyLevels && filter.difficultyLevels.length > 0) {
        query += ` AND mp.difficulty_level IN (${filter.difficultyLevels.map(() => '?').join(',')})`;
        params.push(...filter.difficultyLevels);
    }

    // Add tags filter
    if (filter.tags && filter.tags.length > 0) {
        query += ` AND pt.tag_name IN (${filter.tags.map(() => '?').join(',')})`;
        params.push(...filter.tags);
    }

    // Add curriculum filter
    if (filter.quarter) {
        query += ` AND mp.curriculum_quarter = ?`;
        params.push(filter.quarter);
    }

    if (filter.month) {
        query += ` AND mp.curriculum_month = ?`;
        params.push(filter.month);
    }

    query += ` ORDER BY RAND() LIMIT ?`;
    params.push(filter.numberOfQuestions);

    // 3. Fetch problems
    const problems = await db.query(query, params);

    if (problems.length < filter.numberOfQuestions) {
        throw new Error(`Only found ${problems.length} matching problems`);
    }

    // 4. Create test record
    await db.query(`
        INSERT INTO tests (id, test_name, language, class_level, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `, [testId, filter.testName || `Test ${testId}`, filter.language, filter.classLevel]);

    // 5. Shuffle answers and create test_problems
    const testProblems = [];

    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];

        // Shuffle answers
        const allAnswers = [
            problem.correct_answer,
            problem.answer_option_2,
            problem.answer_option_3,
            problem.answer_option_4
        ];

        const shuffledAnswers = shuffleArray(allAnswers);
        const correctPosition = shuffledAnswers.indexOf(problem.correct_answer);

        // Store in database
        await db.query(`
            INSERT INTO test_problems (
                test_id, problem_id, question_order,
                shuffled_answers, correct_answer_position
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            testId,
            problem.id,
            i + 1,
            JSON.stringify(shuffledAnswers),
            correctPosition
        ]);

        testProblems.push({
            questionNumber: i + 1,
            problemId: problem.id,
            problemText: problem[`problem_text_${filter.language}`],
            formula: problem.formula,
            problemImage: problem.problem_image_url,
            answers: shuffledAnswers.map((ans, idx) => ({
                position: String.fromCharCode(65 + idx),  // A, B, C, D
                text: ans,
                isCorrect: idx === correctPosition
            })),
            correctAnswerPosition: String.fromCharCode(65 + correctPosition)
        });
    }

    // 6. Generate PDF
    const pdfUrl = await generateTestPDF(testId, testProblems, filter.language);

    // 7. Update test with PDF URL and answer key
    const answerKey = testProblems.reduce((acc, p) => {
        acc[p.questionNumber] = p.correctAnswerPosition;
        return acc;
    }, {});

    await db.query(`
        UPDATE tests
        SET pdf_url = ?, answer_key = ?
        WHERE id = ?
    `, [pdfUrl, JSON.stringify(answerKey), testId]);

    // 8. Increment usage count for all problems
    for (const problem of problems) {
        await db.query(`
            UPDATE math_problems
            SET usage_count = usage_count + 1
            WHERE id = ?
        `, [problem.id]);
    }

    return {
        testId,
        pdfUrl,
        answerKey,
        totalQuestions: testProblems.length
    };
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
```

---

### 3. Answer Sheet Scanning Workflow

```
START
  │
  ├─► Receive scanned answer sheet image
  │
  ├─► Preprocess image
  │   ├─► Grayscale conversion
  │   ├─► Noise reduction
  │   └─► Perspective correction
  │
  ├─► Detect answer bubbles (OMR)
  │   └─► Identify marked answers (A/B/C/D)
  │
  ├─► Extract student information
  │   └─► OCR for name/ID
  │
  ├─► Store scanned image
  │
  ├─► Compare with answer key
  │
  ├─► Calculate score
  │
  ├─► Generate diagnostics
  │   ├─► By topic
  │   ├─► By difficulty
  │   └─► Identify weak areas
  │
  ├─► Store results in database
  │
  └─► Return diagnostic report
END
```

**Code Logic:**
```javascript
async function processAnswerSheet(testId, scannedImageFile, studentInfo) {
    // 1. Upload scanned image
    const scannedSheetUrl = await uploadImage(
        scannedImageFile,
        `scans/${testId}/${Date.now()}`
    );

    // 2. Process image with OMR/OCR
    const detectedAnswers = await scanAnswerSheet(scannedImageFile);

    // 3. Get answer key from test
    const test = await db.query(`
        SELECT answer_key FROM tests WHERE id = ?
    `, [testId]);

    const answerKey = JSON.parse(test[0].answer_key);

    // 4. Compare answers and calculate score
    let score = 0;
    const totalQuestions = Object.keys(answerKey).length;

    for (const [questionNum, correctAnswer] of Object.entries(answerKey)) {
        if (detectedAnswers[questionNum] === correctAnswer) {
            score++;
        }
    }

    const percentage = (score / totalQuestions) * 100;

    // 5. Generate diagnostics
    const diagnostics = await generateDiagnostics(
        testId,
        detectedAnswers,
        answerKey
    );

    // 6. Store results
    await db.query(`
        INSERT INTO student_results (
            test_id, student_name, student_id,
            scanned_sheet_url, answers, score,
            total_questions, percentage, diagnostics
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        testId,
        studentInfo.name,
        studentInfo.id,
        scannedSheetUrl,
        JSON.stringify(detectedAnswers),
        score,
        totalQuestions,
        percentage,
        JSON.stringify(diagnostics)
    ]);

    return {
        score,
        totalQuestions,
        percentage,
        diagnostics
    };
}

async function generateDiagnostics(testId, studentAnswers, answerKey) {
    // Get all test problems with their metadata
    const testProblems = await db.query(`
        SELECT
            tp.question_order,
            tp.correct_answer_position,
            mp.difficulty_level,
            pt.tag_name
        FROM test_problems tp
        JOIN math_problems mp ON tp.problem_id = mp.id
        LEFT JOIN problem_tags pt ON mp.id = pt.problem_id
        WHERE tp.test_id = ?
    `, [testId]);

    // Analyze by topic
    const byTopic = {};
    const byDifficulty = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 }
    };

    for (const problem of testProblems) {
        const questionNum = problem.question_order.toString();
        const isCorrect = studentAnswers[questionNum] === answerKey[questionNum];

        // By difficulty
        byDifficulty[problem.difficulty_level].total++;
        if (isCorrect) {
            byDifficulty[problem.difficulty_level].correct++;
        }

        // By topic
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
        byTopic[topic].percentage = (byTopic[topic].correct / byTopic[topic].total) * 100;
    }

    for (const difficulty in byDifficulty) {
        if (byDifficulty[difficulty].total > 0) {
            byDifficulty[difficulty].percentage =
                (byDifficulty[difficulty].correct / byDifficulty[difficulty].total) * 100;
        }
    }

    // Identify weak topics (< 70%)
    const weakTopics = Object.entries(byTopic)
        .filter(([_, stats]) => stats.percentage < 70)
        .map(([topic, _]) => topic);

    return {
        byTopic,
        byDifficulty,
        weakTopics
    };
}
```

---

## Technical Dependencies

### Backend Stack

```json
{
    "dependencies": {
        "express": "^4.18.0",
        "mysql2": "^3.6.0",
        "uuid": "^9.0.0",
        "multer": "^1.4.5-lts.1",
        "sharp": "^0.33.0",
        "pdfkit": "^0.14.0",
        "node-poppler": "^7.0.0",
        "tesseract.js": "^5.0.0",
        "opencv4nodejs": "^6.0.0",
        "dotenv": "^16.0.0",
        "cors": "^2.8.5",
        "helmet": "^7.0.0",
        "express-rate-limit": "^7.0.0"
    }
}
```

### Key Dependencies Explained

1. **express** - Web framework
2. **mysql2** - MySQL database driver (or use `pg` for PostgreSQL)
3. **uuid** - Generate unique IDs
4. **multer** - Handle file uploads
5. **sharp** - Image processing and optimization
6. **pdfkit** - PDF generation
7. **tesseract.js** - OCR for scanning text
8. **opencv4nodejs** - Computer vision for OMR (bubble detection)
9. **helmet** - Security headers
10. **express-rate-limit** - API rate limiting

---

## VPS Server Configuration

### Required Software

```bash
# Database
- PostgreSQL 15+ or MySQL 8+

# Node.js Runtime
- Node.js 18+ LTS

# Image Processing
- ImageMagick
- Tesseract OCR
- OpenCV

# PDF Generation
- Poppler utilities

# Web Server (optional, for serving static files)
- Nginx
```

### Directory Structure on VPS

```
/var/www/marga-test-generator/
│
├── app/
│   ├── server.js
│   ├── routes/
│   ├── services/
│   ├── controllers/
│   └── models/
│
├── storage/
│   ├── images/
│   │   ├── problems/
│   │   └── solutions/
│   ├── pdfs/
│   │   └── tests/
│   └── scans/
│       └── answer-sheets/
│
├── config/
│   └── database.js
│
└── node_modules/
```

### Environment Variables (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marga_test_generator
DB_USER=marga_user
DB_PASSWORD=secure_password

# Server
PORT=3000
NODE_ENV=production

# File Storage
STORAGE_PATH=/var/www/marga-test-generator/storage
MAX_FILE_SIZE=10485760  # 10MB

# Security
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## API Endpoints

### Problem Management

```
POST   /api/problems              - Create new problem
GET    /api/problems/:id          - Get problem by ID
PUT    /api/problems/:id          - Update problem
DELETE /api/problems/:id          - Delete problem
GET    /api/problems/search       - Search problems with filters
GET    /api/problems/tags         - Get all available tags
```

### Test Generation

```
POST   /api/tests/generate        - Generate new test
GET    /api/tests/:id             - Get test details
GET    /api/tests/:id/pdf         - Download test PDF
DELETE /api/tests/:id             - Delete test
```

### Results Processing

```
POST   /api/results/scan          - Upload and process answer sheet
GET    /api/results/:id           - Get student result
GET    /api/results/test/:testId  - Get all results for a test
GET    /api/results/student/:studentId - Get all results for student
```

---

## Performance Considerations

### Database Indexing

```sql
-- Already included in schema above:
- idx_class_level
- idx_difficulty
- idx_curriculum
- idx_problem_tags
- idx_tag_name
```

### Caching Strategy

```javascript
// Use in-memory cache for frequently accessed data
const cache = {
    tags: null,  // Cache all tags
    tagsTTL: 3600000,  // 1 hour

    popularProblems: null,  // Cache most used problems
    popularProblemsTTL: 3600000
};

async function getAllTags() {
    const now = Date.now();

    if (cache.tags && (now - cache.tagsLastFetch < cache.tagsTTL)) {
        return cache.tags;
    }

    cache.tags = await db.query(`
        SELECT DISTINCT tag_name FROM problem_tags ORDER BY tag_name
    `);
    cache.tagsLastFetch = now;

    return cache.tags;
}
```

### File Storage Optimization

```javascript
// Optimize images on upload
async function uploadImage(file, path) {
    const optimized = await sharp(file.buffer)
        .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();

    const filename = `${path}.jpg`;
    await fs.promises.writeFile(
        `${STORAGE_PATH}/images/${filename}`,
        optimized
    );

    return `/images/${filename}`;
}
```

---

## Security Measures

1. **Input Validation** - Validate all user inputs
2. **SQL Injection Prevention** - Use parameterized queries
3. **File Upload Security** - Validate file types and sizes
4. **Rate Limiting** - Prevent API abuse
5. **Authentication** - JWT tokens for user sessions
6. **HTTPS** - SSL/TLS encryption
7. **CORS** - Configure allowed origins
8. **Helmet.js** - Set security headers

---

## Backup Strategy

```bash
# Daily database backup
0 2 * * * mysqldump -u marga_user -p marga_test_generator > /backups/db_$(date +\%Y\%m\%d).sql

# Weekly storage backup
0 3 * * 0 tar -czf /backups/storage_$(date +\%Y\%m\%d).tar.gz /var/www/marga-test-generator/storage/
```

---

## Future Enhancements

1. **Batch Import** - Import problems from Excel/CSV
2. **Problem Versioning** - Track changes to problems
3. **User Roles** - Teachers, admins, students
4. **Analytics Dashboard** - Visualize student performance
5. **API for Mobile Apps** - REST API documentation
6. **Multi-tenancy** - Support multiple schools
7. **Real-time Grading** - WebSocket for live results
8. **AI Problem Generation** - Generate similar problems automatically

---

## Deployment Checklist

- [ ] Install Node.js 18+ on VPS
- [ ] Install and configure PostgreSQL/MySQL
- [ ] Install ImageMagick, Tesseract, OpenCV
- [ ] Create database and tables
- [ ] Set up storage directories with correct permissions
- [ ] Configure firewall (open port 3000 or set up Nginx reverse proxy)
- [ ] Set environment variables
- [ ] Install PM2 for process management
- [ ] Configure automated backups
- [ ] Set up monitoring (logs, errors)
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Test all API endpoints
- [ ] Load test with sample data

---

## Estimated Resource Requirements

**VPS Specifications:**
- CPU: 2+ cores
- RAM: 4GB minimum (8GB recommended)
- Storage: 50GB+ (depends on number of images/PDFs)
- Bandwidth: 100GB/month (adjust based on usage)

**Database Size Estimates:**
- 1,000 problems: ~50MB
- 10,000 problems: ~500MB
- 100,000 results: ~100MB

**File Storage Estimates:**
- Average problem image: 200KB
- Average test PDF: 2MB
- Average scanned sheet: 500KB

---

End of Documentation

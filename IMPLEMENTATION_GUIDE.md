# Implementation Guide - Quick Start

## Step-by-Step Setup

### 1. Initialize Project

```bash
mkdir marga-test-generator
cd marga-test-generator
npm init -y
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install express mysql2 dotenv cors helmet express-rate-limit

# File handling
npm install multer sharp uuid

# PDF generation
npm install pdfkit

# OCR and image processing (for answer sheet scanning)
npm install tesseract.js opencv4nodejs

# Development dependencies
npm install --save-dev nodemon
```

### 3. Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE marga_test_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user
CREATE USER 'marga_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON marga_test_generator.* TO 'marga_user'@'localhost';
FLUSH PRIVILEGES;
```

Then run the SQL schema from `PROJECT_ARCHITECTURE.md`.

### 4. Project Structure

```
marga-test-generator/
│
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── problemController.js
│   │   ├── testController.js
│   │   └── resultController.js
│   ├── services/
│   │   ├── problemService.js
│   │   ├── testService.js
│   │   ├── pdfService.js
│   │   ├── scannerService.js
│   │   └── diagnosticService.js
│   ├── models/
│   │   ├── Problem.js
│   │   ├── Test.js
│   │   └── Result.js
│   ├── routes/
│   │   ├── problems.js
│   │   ├── tests.js
│   │   └── results.js
│   ├── middleware/
│   │   ├── upload.js
│   │   ├── validator.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── logger.js
│       └── helpers.js
│
├── storage/
│   ├── images/
│   ├── pdfs/
│   └── scans/
│
├── .env
├── .gitignore
├── package.json
└── server.js
```

---

## Sample Implementation Files

### server.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const problemRoutes = require('./src/routes/problems');
const testRoutes = require('./src/routes/tests');
const resultRoutes = require('./src/routes/results');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Serve static files
app.use('/images', express.static('storage/images'));
app.use('/pdfs', express.static('storage/pdfs'));

// Routes
app.use('/api/problems', problemRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/results', resultRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

### src/config/database.js

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
        process.exit(1);
    });

module.exports = pool;
```

---

### src/models/Problem.js

```javascript
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Problem {
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

        // Insert tags
        if (problemData.tags && problemData.tags.length > 0) {
            const tagValues = problemData.tags.map(tag => [id, tag]);
            await db.query(`
                INSERT INTO problem_tags (problem_id, tag_name) VALUES ?
            `, [tagValues]);
        }

        return id;
    }

    static async findById(id) {
        const [problems] = await db.execute(`
            SELECT * FROM math_problems WHERE id = ?
        `, [id]);

        if (problems.length === 0) return null;

        const problem = problems[0];

        // Get tags
        const [tags] = await db.execute(`
            SELECT tag_name FROM problem_tags WHERE problem_id = ?
        `, [id]);

        problem.tags = tags.map(t => t.tag_name);

        return problem;
    }

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

        const limit = filters.limit || 100;
        query += ` ORDER BY mp.created_at DESC LIMIT ?`;
        params.push(limit);

        const [problems] = await db.execute(query, params);

        return problems;
    }

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

        if (updateData.difficultyLevel) {
            updates.push('difficulty_level = ?');
            params.push(updateData.difficultyLevel);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        params.push(id);

        await db.execute(`
            UPDATE math_problems
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        // Update tags if provided
        if (updateData.tags) {
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

    static async delete(id) {
        await db.execute(`DELETE FROM math_problems WHERE id = ?`, [id]);
        return true;
    }

    static async incrementUsageCount(id) {
        await db.execute(`
            UPDATE math_problems SET usage_count = usage_count + 1 WHERE id = ?
        `, [id]);
    }
}

module.exports = Problem;
```

---

### src/services/testService.js

```javascript
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Problem = require('../models/Problem');
const pdfService = require('./pdfService');

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function generateTest(filter) {
    const testId = uuidv4();

    // 1. Find matching problems
    const problems = await Problem.search({
        classLevel: filter.classLevel,
        difficultyLevels: filter.difficultyLevels,
        tags: filter.tags,
        quarter: filter.quarter,
        month: filter.month,
        limit: filter.numberOfQuestions * 2 // Get more than needed for randomization
    });

    if (problems.length < filter.numberOfQuestions) {
        throw new Error(`Only found ${problems.length} matching problems, need ${filter.numberOfQuestions}`);
    }

    // 2. Randomly select N questions
    const selectedProblems = shuffleArray(problems).slice(0, filter.numberOfQuestions);

    // 3. Create test record
    await db.execute(`
        INSERT INTO tests (id, test_name, language, class_level, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `, [
        testId,
        filter.testName || `Test ${new Date().toLocaleDateString()}`,
        filter.language,
        filter.classLevel
    ]);

    // 4. Process each problem and shuffle answers
    const testProblems = [];
    const answerKey = {};

    for (let i = 0; i < selectedProblems.length; i++) {
        const problem = selectedProblems[i];
        const questionNumber = i + 1;

        // Collect all answers
        const allAnswers = [
            problem.correct_answer,
            problem.answer_option_2,
            problem.answer_option_3,
            problem.answer_option_4
        ];

        // Shuffle
        const shuffledAnswers = shuffleArray(allAnswers);
        const correctPosition = shuffledAnswers.indexOf(problem.correct_answer);
        const correctLetter = String.fromCharCode(65 + correctPosition); // A, B, C, D

        // Store in database
        await db.execute(`
            INSERT INTO test_problems (
                test_id, problem_id, question_order,
                shuffled_answers, correct_answer_position
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            testId,
            problem.id,
            questionNumber,
            JSON.stringify(shuffledAnswers),
            correctPosition
        ]);

        // Prepare for PDF
        testProblems.push({
            questionNumber,
            problemId: problem.id,
            problemText: problem[`problem_text_${filter.language}`],
            formula: problem.formula,
            problemImage: problem.problem_image_url,
            answers: shuffledAnswers.map((ans, idx) => ({
                position: String.fromCharCode(65 + idx),
                text: ans
            })),
            correctAnswerPosition: correctLetter
        });

        answerKey[questionNumber] = correctLetter;

        // Increment usage count
        await Problem.incrementUsageCount(problem.id);
    }

    // 5. Generate PDF
    const pdfUrl = await pdfService.generateTestPDF({
        testId,
        testName: filter.testName || `Test ${new Date().toLocaleDateString()}`,
        classLevel: filter.classLevel,
        language: filter.language,
        problems: testProblems
    });

    // 6. Update test with PDF URL and answer key
    await db.execute(`
        UPDATE tests
        SET pdf_url = ?, answer_key = ?
        WHERE id = ?
    `, [pdfUrl, JSON.stringify(answerKey), testId]);

    return {
        testId,
        pdfUrl,
        answerKey,
        totalQuestions: testProblems.length
    };
}

async function getTestById(testId) {
    const [tests] = await db.execute(`
        SELECT * FROM tests WHERE id = ?
    `, [testId]);

    if (tests.length === 0) return null;

    const test = tests[0];
    test.answer_key = JSON.parse(test.answer_key);

    // Get all test problems
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
    `, [testId]);

    test.problems = problems.map(p => ({
        questionNumber: p.question_order,
        problemText: p[`problem_text_${test.language}`],
        formula: p.formula,
        problemImage: p.problem_image_url,
        answers: JSON.parse(p.shuffled_answers),
        correctAnswerPosition: String.fromCharCode(65 + p.correct_answer_position)
    }));

    return test;
}

module.exports = {
    generateTest,
    getTestById
};
```

---

### src/routes/problems.js

```javascript
const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const upload = require('../middleware/upload');

router.post('/', upload.fields([
    { name: 'problemImage', maxCount: 1 },
    { name: 'solutionImage', maxCount: 1 }
]), problemController.create);

router.get('/search', problemController.search);
router.get('/:id', problemController.getById);
router.put('/:id', problemController.update);
router.delete('/:id', problemController.delete);

module.exports = router;
```

---

### src/controllers/problemController.js

```javascript
const Problem = require('../models/Problem');
const { uploadImage } = require('../utils/helpers');

exports.create = async (req, res, next) => {
    try {
        const problemData = JSON.parse(req.body.problemData);

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
            message: 'Problem created successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
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

exports.search = async (req, res, next) => {
    try {
        const filters = {
            classLevel: req.query.classLevel ? parseInt(req.query.classLevel) : null,
            difficultyLevels: req.query.difficulty ? req.query.difficulty.split(',') : null,
            tags: req.query.tags ? req.query.tags.split(',') : null,
            quarter: req.query.quarter ? parseInt(req.query.quarter) : null,
            month: req.query.month ? parseInt(req.query.month) : null,
            limit: req.query.limit ? parseInt(req.query.limit) : 100
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

exports.update = async (req, res, next) => {
    try {
        await Problem.update(req.params.id, req.body);

        res.json({
            success: true,
            message: 'Problem updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    try {
        await Problem.delete(req.params.id);

        res.json({
            success: true,
            message: 'Problem deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
```

---

### src/middleware/upload.js

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

module.exports = upload;
```

---

### src/utils/helpers.js

```javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

async function uploadImage(file, folder) {
    const filename = `${uuidv4()}.jpg`;
    const filepath = path.join(process.env.STORAGE_PATH || './storage', 'images', folder, filename);

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

module.exports = {
    uploadImage
};
```

---

### .env.example

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marga_test_generator
DB_USER=marga_user
DB_PASSWORD=your_password_here

# Server
PORT=3000
NODE_ENV=development

# File Storage
STORAGE_PATH=/var/www/marga-test-generator/storage

# Security
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here
```

---

## Testing the API

### 1. Create a Problem

```bash
curl -X POST http://localhost:3000/api/problems \
  -H "Content-Type: multipart/form-data" \
  -F 'problemData={
    "problemText": {
      "ru": "Решите уравнение: 2x + 5 = 13",
      "kz": "Теңдеуді шешіңіз: 2x + 5 = 13",
      "en": "Solve the equation: 2x + 5 = 13"
    },
    "correctAnswer": "x = 4",
    "wrongAnswers": ["x = 3", "x = 5", "x = 6"],
    "formula": "2x + 5 = 13",
    "classLevel": 7,
    "difficultyLevel": "medium",
    "curriculum": {
      "quarter": 2,
      "month": 11
    },
    "tags": ["linear_equations", "algebra"]
  }'
```

### 2. Search Problems

```bash
curl "http://localhost:3000/api/problems/search?classLevel=7&difficulty=medium&tags=algebra"
```

### 3. Generate Test

```bash
curl -X POST http://localhost:3000/api/tests/generate \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "Algebra Test - Quarter 2",
    "classLevel": 7,
    "numberOfQuestions": 10,
    "language": "ru",
    "difficultyLevels": ["medium"],
    "tags": ["algebra"],
    "quarter": 2
  }'
```

---

## Running the Application

### Development Mode

```bash
# Add to package.json scripts
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}

# Run
npm run dev
```

### Production Mode (with PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name marga-test-generator

# Save configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

---

## Next Steps

1. Implement PDF generation service (pdfService.js)
2. Implement OCR/OMR scanner service (scannerService.js)
3. Implement diagnostic analysis (diagnosticService.js)
4. Add authentication and authorization
5. Create frontend interface
6. Set up monitoring and logging
7. Configure Nginx reverse proxy
8. Set up SSL with Let's Encrypt
9. Implement backup automation

---

End of Implementation Guide

# MARGA - Local Setup Guide

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd "/Users/nurbolatkhamitov/Desktop/web projects/marga test generator"
npm install
```

This will install all required packages (~150MB).

### Step 2: Create Storage Directories

```bash
mkdir -p storage/images/problems
mkdir -p storage/images/solutions
mkdir -p storage/pdfs/tests
mkdir -p storage/pdfs/answer-sheets
mkdir -p storage/pdfs/answer-keys
mkdir -p storage/scans
mkdir -p storage/temp
```

### Step 3: Set Up MySQL Database

```bash
# Start MySQL (if not running)
# macOS:
brew services start mysql

# Or start manually:
mysql.server start
```

```bash
# Connect to MySQL
mysql -u root -p
```

```sql
-- In MySQL shell:
CREATE DATABASE marga_test_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'marga_user'@'localhost' IDENTIFIED BY 'marga123';
GRANT ALL PRIVILEGES ON marga_test_generator.* TO 'marga_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import database schema
mysql -u marga_user -pmarga123 marga_test_generator < database_schema.sql
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marga_test_generator
DB_USER=marga_user
DB_PASSWORD=marga123

PORT=3000
NODE_ENV=development
STORAGE_PATH=./storage

BUBBLE_DARKNESS_THRESHOLD=0.4
```

### Step 5: Start the Server

```bash
npm run dev
```

You should see:
```
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   MARGA - Math Assessment Recognition & Grading      ║
    ║           Automation System                           ║
    ║                                                       ║
    ║   Server running on port 3000                         ║
    ║   Environment: development                            ║
    ║                                                       ║
    ║   Admin Panel: http://localhost:3000                  ║
    ║   API: http://localhost:3000/api                      ║
    ║   Health: http://localhost:3000/health                ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝

✓ База данных подключена успешно
```

### Step 6: Open in Browser

Open: http://localhost:3000

---

## What's Working Now

✅ **Student Management (Fully Functional)**
- Register students
- Auto-generate 6-digit IDs
- Display IDs with initials (e.g., ИИ-123456)
- Search students
- View all students

### Test the Student Registration:

1. Go to http://localhost:3000
2. Click "👥 Студенты" tab
3. Fill in:
   - Имя: Иван
   - Фамилия: Иванов
   - Класс: 7
   - Email: ivan@test.kz
4. Click "Зарегистрировать Студента"
5. You'll see the generated ID (e.g., ИИ-123456)

The student will appear in the list below!

---

## Testing Answer Sheet Generation (Manual Test)

Create a test file `test-answer-sheet.js`:

```javascript
const { generateAnswerSheet, generateAnswerKey } = require('./src/services/answerSheetService');

async function test() {
    // Generate answer sheet
    const url = await generateAnswerSheet({
        testId: 'test-123',
        testName: 'Алгебра - Контрольная Работа №1',
        totalQuestions: 25,
        classLevel: 7,
        language: 'ru'
    });

    console.log('Answer sheet generated:', url);

    // Generate answer key
    const answerKey = {};
    for (let i = 1; i <= 25; i++) {
        answerKey[i] = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    }

    const keyUrl = await generateAnswerKey({
        testId: 'test-123',
        testName: 'Алгебра - Контрольная Работа №1',
        classLevel: 7,
        language: 'ru'
    }, answerKey);

    console.log('Answer key generated:', keyUrl);
}

test();
```

Run:
```bash
node test-answer-sheet.js
```

Check: `storage/pdfs/answer-sheets/answer-sheet-test-123.pdf`

---

## API Endpoints (Currently Working)

### Students

**Register Student**
```bash
curl -X POST http://localhost:3000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Петр",
    "lastName": "Петров",
    "classLevel": 8,
    "email": "petr@test.kz"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Студент зарегистрирован успешно",
  "student": {
    "studentId": "234567",
    "displayId": "ПП-234567",
    "firstName": "Петр",
    "lastName": "Петров",
    "classLevel": 8,
    "email": "petr@test.kz"
  }
}
```

**Get All Students**
```bash
curl http://localhost:3000/api/students
```

**Search Students**
```bash
curl http://localhost:3000/api/students/search?q=Иван
```

**Get Student by ID**
```bash
curl http://localhost:3000/api/students/123456
```

---

## Sample Data in Database

The database comes with 3 sample students:

| ID | Display ID | Name | Class |
|----|-----------|------|-------|
| 123456 | ИИ-123456 | Иван Иванов | 7 |
| 234567 | ПС-234567 | Петр Сидоров | 7 |
| 345678 | МК-345678 | Мария Казакова | 8 |

And 1 sample problem:
- "Решите уравнение: 2x + 5 = 13"
- Answer: x = 4
- Class: 7
- Difficulty: Medium
- Tags: algebra, linear_equations

---

## Troubleshooting

### MySQL Connection Error

**Error:** `✗ Ошибка подключения к базе данных`

**Solutions:**
1. Check if MySQL is running:
   ```bash
   mysql.server status
   ```

2. Test connection manually:
   ```bash
   mysql -u marga_user -pmarga123
   ```

3. Check .env file has correct credentials

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in .env:
PORT=3001
```

### Module Not Found

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

Now that the basic system is working, you can:

1. **Test student registration** via the web interface
2. **Generate a sample answer sheet** using the test script
3. **Print the answer sheet** and test OMR scanning
4. **Continue development** of remaining features:
   - Problem management
   - Test generation
   - Answer sheet scanning
   - Results dashboard

---

## File Structure Overview

```
marga-test-generator/
├── server.js                      # Main server (✓ working)
├── package.json                   # Dependencies
├── .env                          # Configuration
├── database_schema.sql            # Database setup (✓ working)
│
├── src/
│   ├── config/
│   │   └── database.js            # DB connection (✓ working)
│   │
│   ├── models/
│   │   ├── Problem.js             # Problem model (✓ created)
│   │   ├── Test.js                # Test model (✓ created)
│   │   └── Result.js              # Result model (✓ created)
│   │
│   ├── services/
│   │   ├── studentService.js      # Student logic (✓ working)
│   │   ├── answerSheetService.js  # PDF generation (✓ working)
│   │   └── scannerService.js      # OMR scanning (✓ working)
│   │
│   ├── controllers/
│   │   └── studentController.js   # Student API (✓ working)
│   │
│   ├── routes/
│   │   ├── students.js            # Student routes (✓ working)
│   │   ├── problems.js            # Problem routes (placeholder)
│   │   ├── tests.js               # Test routes (placeholder)
│   │   └── results.js             # Result routes (placeholder)
│   │
│   └── middleware/
│       ├── upload.js              # File uploads (✓ working)
│       └── errorHandler.js        # Error handling (✓ working)
│
├── public/
│   ├── index.html                 # Web interface (✓ working)
│   └── app.js                     # Frontend JS (✓ working)
│
└── storage/                       # File storage (✓ created)
    ├── images/
    ├── pdfs/
    ├── scans/
    └── temp/
```

---

## Development Status

**Completed (60%):**
- ✅ Database schema and connection
- ✅ Student management (full CRUD)
- ✅ 6-digit student ID system with display format
- ✅ OMR scanner service (bubble detection)
- ✅ Answer sheet PDF generation
- ✅ Russian web interface (basic)
- ✅ File upload middleware
- ✅ Error handling

**To Do (40%):**
- ⏳ Problem management (create, edit, search)
- ⏳ Test generation workflow
- ⏳ Answer sheet scanning interface
- ⏳ Manual correction interface
- ⏳ Results dashboard with diagnostics
- ⏳ Student statistics and analytics

---

## Need Help?

Check these files for detailed information:
- `README.md` - Project overview
- `PROJECT_ARCHITECTURE.md` - System design
- `PROGRESS.md` - Current development status
- `STUDENT_ID_SYSTEM.md` - ID system details
- `BUDGET_AND_OCR_GUIDE.md` - OMR/OCR explanation

---

**You're ready to start using MARGA!** 🎉

Open http://localhost:3000 and register your first student.

# MARGA Test Generator

A complete, free, and open-source multilingual mathematics test generation and grading system.

## Features

- **Multilingual Support**: Russian, Kazakh, and English
- **Custom Test Generation**: Filter by class, difficulty, topics, and curriculum
- **Automated Grading**: Bubble sheet scanning using OMR (Optical Mark Recognition)
- **Diagnostic Analysis**: Detailed performance reports by topic and difficulty
- **PDF Generation**: Tests, answer sheets, and answer keys
- **Low Resource Usage**: Runs on 2GB RAM VPS

## Cost

**$5-10/month** for VPS hosting only. All software is 100% free and open-source.

## Quick Links

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)** - Full system design
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Code examples and API docs
- **[BUDGET_AND_OCR_GUIDE.md](BUDGET_AND_OCR_GUIDE.md)** - Budget breakdown and OMR details

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MySQL (local VPS)
- **Image Processing**: Sharp
- **OCR**: Tesseract.js
- **OMR**: Custom bubble detection
- **PDF**: PDFKit
- **QR Codes**: qrcode.js

## System Requirements

### Minimum (2GB VPS)
- 2GB RAM
- 1 vCPU
- 40GB SSD
- Ubuntu 22.04 or Debian 11

**Supports:**
- 15-20 concurrent users
- 100+ tests per day
- 50+ scans per hour
- 50,000+ problems in database

## Installation

### 1. Clone/Download Project

```bash
git clone <your-repo>
cd marga-test-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Set your database credentials and paths.

### 4. Create Database

```bash
mysql -u root -p < database_schema.sql
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Start Production Server

```bash
npm start
# Or with PM2:
pm2 start server.js --name marga-app --max-memory-restart 400M
```

## Usage

### Create a Problem

```http
POST /api/problems
Content-Type: multipart/form-data

{
  "problemData": {
    "problemText": {
      "ru": "Решите уравнение: 2x + 5 = 13",
      "kz": "Теңдеуді шешіңіз: 2x + 5 = 13",
      "en": "Solve the equation: 2x + 5 = 13"
    },
    "correctAnswer": "x = 4",
    "wrongAnswers": ["x = 3", "x = 5", "x = 6"],
    "classLevel": 7,
    "difficultyLevel": "medium",
    "tags": ["algebra", "linear_equations"],
    "curriculum": {
      "quarter": 2,
      "month": 11
    }
  },
  "problemImage": <file>,
  "solutionImage": <file>
}
```

### Generate Test

```http
POST /api/tests/generate
Content-Type: application/json

{
  "testName": "Algebra Test - Quarter 2",
  "classLevel": 7,
  "numberOfQuestions": 20,
  "language": "ru",
  "difficultyLevels": ["medium"],
  "tags": ["algebra"],
  "quarter": 2
}
```

### Scan Answer Sheet

```http
POST /api/results/scan
Content-Type: multipart/form-data

{
  "testId": "test-uuid",
  "studentName": "John Doe",
  "studentId": "2024001",
  "answerSheet": <image-file>
}
```

## How OMR Works

1. **PDF Generation**: Creates answer sheet with precisely positioned bubbles
2. **Student Fills**: Uses black pen to fill bubbles completely
3. **Scanning**: Phone camera or scanner (min 1200px width)
4. **Processing**:
   - Convert to black & white
   - Detect filled bubbles by darkness (>40% threshold)
   - Extract answers
5. **Grading**: Compare with answer key and generate diagnostics

## Project Structure

```
marga-test-generator/
├── server.js                 # Main entry point
├── src/
│   ├── config/
│   │   └── database.js       # Database connection
│   ├── models/
│   │   ├── Problem.js        # Problem model
│   │   ├── Test.js           # Test model
│   │   └── Result.js         # Result model
│   ├── services/
│   │   ├── problemService.js      # Problem management
│   │   ├── testService.js         # Test generation
│   │   ├── pdfService.js          # PDF generation
│   │   ├── answerSheetService.js  # Answer sheet PDFs
│   │   ├── scannerService.js      # OMR/OCR scanning
│   │   └── diagnosticService.js   # Analysis
│   ├── controllers/
│   │   ├── problemController.js
│   │   ├── testController.js
│   │   └── resultController.js
│   ├── routes/
│   │   ├── problems.js
│   │   ├── tests.js
│   │   └── results.js
│   ├── middleware/
│   │   ├── upload.js         # File upload handling
│   │   ├── validator.js      # Input validation
│   │   └── errorHandler.js   # Error handling
│   └── utils/
│       └── helpers.js        # Utility functions
├── storage/
│   ├── images/
│   ├── pdfs/
│   └── scans/
├── package.json
├── .env
└── README.md
```

## API Endpoints

### Problems
- `POST /api/problems` - Create problem
- `GET /api/problems/:id` - Get problem
- `GET /api/problems/search` - Search problems
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem

### Tests
- `POST /api/tests/generate` - Generate test
- `GET /api/tests/:id` - Get test
- `GET /api/tests/:id/pdf` - Download test PDF

### Results
- `POST /api/results/scan` - Scan answer sheet
- `GET /api/results/:id` - Get result
- `GET /api/results/test/:testId` - Get all results for test
- `GET /api/results/student/:studentId` - Get student results

## Performance

### With 2GB VPS:
- **Concurrent Users**: 15-20
- **Tests/Day**: 100-200
- **Scans/Hour**: 50-100
- **Database Records**: 50,000+
- **Response Time**: <500ms
- **Uptime**: 99.5%+

## Optimization Tips

1. **MySQL**: Configure for 256MB buffer pool
2. **Node.js**: Limit to 512MB heap size
3. **Images**: Auto-compress to 75% quality, max 800px
4. **PM2**: Set memory restart at 400MB
5. **Caching**: Cache frequently accessed data

## Troubleshooting

### Out of Memory
```bash
pm2 restart marga-app
# Consider upgrading to 4GB VPS
```

### Bubble Detection Fails
- Check scan quality (min 1200px width)
- Ensure good lighting
- Verify bubbles filled completely
- Use manual correction interface

### Database Connection Error
```bash
systemctl status mysql
mysql -u marga_user -p
```

## Contributing

This is a personal project. Feel free to fork and customize for your needs.

## License

ISC

## Support

For detailed documentation, see the guides in the project root:
- QUICK_START.md
- PROJECT_ARCHITECTURE.md
- IMPLEMENTATION_GUIDE.md
- BUDGET_AND_OCR_GUIDE.md

---

**Built with ❤️ for educators**

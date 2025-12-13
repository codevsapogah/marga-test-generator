# Budget Optimization & OCR/OMR Implementation Guide

## 💰 Can We Build It for Free? YES!

### All Software is Free and Open-Source

**Backend:**
- ✅ Node.js - Free (MIT License)
- ✅ Express - Free (MIT License)
- ✅ MySQL or PostgreSQL - Free (GPL/PostgreSQL License)

**Libraries:**
- ✅ All npm packages (multer, sharp, pdfkit, etc.) - Free
- ✅ Tesseract OCR - Free (Apache 2.0)
- ✅ OpenCV - Free (Apache 2.0)

**Only Cost: VPS Hosting**
- Estimated: $5-10/month for 2GB RAM VPS
- Providers: Hetzner ($4/mo), DigitalOcean ($12/mo), Contabo ($6/mo)

### Total Monthly Cost: $5-10 (VPS only)

---

## 💻 Will 2GB VPS Suffice?

### Memory Breakdown for Low Traffic

```
Operating System (Ubuntu/Debian):  ~400MB
MySQL Database:                    ~200MB
Node.js Application:               ~150MB
Available for operations:          ~1.25GB
```

**Answer: YES, 2GB is enough for low traffic!**

### Expected Limits with 2GB RAM

- **Concurrent users**: 10-20 simultaneous users
- **Database size**: Up to 50,000 problems comfortably
- **Daily test generations**: 100-200 tests
- **Answer sheet processing**: 50-100 per hour

### Optimization Tips for 2GB VPS

```javascript
// 1. Use MySQL connection pooling with limits
const pool = mysql.createPool({
    connectionLimit: 5,  // Reduced from 10
    queueLimit: 0
});

// 2. Set Node.js memory limit
// In package.json:
{
  "scripts": {
    "start": "node --max-old-space-size=512 server.js"
  }
}

// 3. Process images in streams
const sharp = require('sharp');

async function optimizeImage(buffer) {
    return await sharp(buffer)
        .resize(800, 800, { fit: 'inside' })  // Smaller size
        .jpeg({ quality: 75 })  // Lower quality
        .toBuffer();
}

// 4. Use lightweight alternatives
// Instead of opencv4nodejs (heavy), use simple image processing
```

### Recommended 2GB VPS Configuration

```bash
# Use MySQL instead of PostgreSQL (lighter)
# Optimize MySQL for low memory

# Edit /etc/mysql/my.cnf
[mysqld]
innodb_buffer_pool_size = 256M  # Default is 128M
max_connections = 50             # Reduced from 151
key_buffer_size = 16M
query_cache_size = 16M
```

### When to Upgrade to 4GB

- More than 20 concurrent users
- Processing 100+ answer sheets simultaneously
- Database exceeds 100,000 problems
- Adding AI features (problem generation)

---

## 📄 Answer Sheet OCR/OMR - How It Works

### Overview

**OMR (Optical Mark Recognition)** - Detects filled bubbles/circles
**OCR (Optical Character Recognition)** - Reads text (for student names/IDs)

### Approach 1: Simple Bubble Detection (Recommended for 2GB)

This is lightweight and free!

#### Answer Sheet Template

```
┌─────────────────────────────────────────────┐
│  MARGA Test Generator - Answer Sheet        │
│  Student Name: _______________              │
│  Student ID: [QR CODE]  or  ________        │
│                                             │
│  1. ⃝A  ⃝B  ⃝C  ⃝D                          │
│  2. ⃝A  ⃝B  ⃝C  ⃝D                          │
│  3. ⃝A  ⃝B  ⃝C  ⃝D                          │
│  ...                                        │
│  20. ⃝A  ⃝B  ⃝C  ⃝D                         │
└─────────────────────────────────────────────┘
```

#### Implementation Steps

**Step 1: Generate Answer Sheet PDF with Registration Marks**

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateAnswerSheet(testId, totalQuestions) {
    const doc = new PDFDocument({ size: 'A4' });
    const stream = fs.createWriteStream(`storage/pdfs/answer-sheet-${testId}.pdf`);
    doc.pipe(stream);

    // Title
    doc.fontSize(16).text('MARGA Test Generator - Answer Sheet', { align: 'center' });
    doc.moveDown();

    // Student info
    doc.fontSize(12).text('Student Name: _______________________');
    doc.text('Student ID: _______________________');
    doc.moveDown();

    // Registration marks (for alignment detection)
    // Top-left corner
    doc.circle(50, 100, 10).fill('black');
    // Top-right corner
    doc.circle(550, 100, 10).fill('black');
    // Bottom-left corner
    doc.circle(50, 750, 10).fill('black');

    // Draw answer bubbles
    let y = 150;
    for (let i = 1; i <= totalQuestions; i++) {
        doc.fontSize(10).text(`${i}.`, 70, y);

        // Draw bubbles for A, B, C, D
        const options = ['A', 'B', 'C', 'D'];
        let x = 120;

        options.forEach(option => {
            doc.circle(x, y + 5, 8).stroke();
            doc.fontSize(9).text(option, x - 3, y + 1);
            x += 40;
        });

        y += 30;

        // New column after 25 questions
        if (i === 25 && totalQuestions > 25) {
            y = 150;
            doc.addPage();
        }
    }

    doc.end();
    return `/pdfs/answer-sheet-${testId}.pdf`;
}
```

**Step 2: Scan and Process Answer Sheet**

```javascript
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

async function processAnswerSheet(imagePath) {
    // 1. Preprocess image
    const processedImage = await sharp(imagePath)
        .greyscale()
        .normalise()
        .threshold(128)  // Convert to pure black and white
        .toBuffer();

    // 2. Detect registration marks for alignment
    const alignment = await detectRegistrationMarks(processedImage);

    // 3. Extract answer regions based on alignment
    const answers = await extractAnswers(processedImage, alignment);

    // 4. OCR student name/ID (optional)
    const studentInfo = await extractStudentInfo(imagePath);

    return {
        studentInfo,
        answers
    };
}

async function detectRegistrationMarks(imageBuffer) {
    // Simplified: detect three black circles at corners
    // Returns coordinates for alignment transformation

    const metadata = await sharp(imageBuffer).metadata();

    // Expected positions (from template)
    return {
        topLeft: { x: 50, y: 100 },
        topRight: { x: 550, y: 100 },
        bottomLeft: { x: 50, y: 750 },
        width: metadata.width,
        height: metadata.height
    };
}

async function extractAnswers(imageBuffer, alignment) {
    const answers = {};

    // Define bubble positions based on template
    // Starting position after alignment
    let startX = 120;
    let startY = 150;
    const bubbleRadius = 8;
    const bubbleSpacing = 40;
    const questionSpacing = 30;

    // Process each question
    for (let q = 1; q <= 20; q++) {
        const questionY = startY + (q - 1) * questionSpacing;

        const options = ['A', 'B', 'C', 'D'];
        let selectedAnswer = null;
        let maxDarkness = 0;

        // Check each bubble
        for (let i = 0; i < options.length; i++) {
            const bubbleX = startX + (i * bubbleSpacing);
            const bubbleY = questionY + 5;

            // Extract bubble region (20x20 pixels around center)
            const bubbleRegion = await sharp(imageBuffer)
                .extract({
                    left: Math.max(0, bubbleX - 10),
                    top: Math.max(0, bubbleY - 10),
                    width: 20,
                    height: 20
                })
                .toBuffer();

            // Calculate darkness (percentage of black pixels)
            const darkness = await calculateDarkness(bubbleRegion);

            // If darkness > threshold, consider it filled
            if (darkness > 0.5 && darkness > maxDarkness) {
                maxDarkness = darkness;
                selectedAnswer = options[i];
            }
        }

        answers[q] = selectedAnswer;
    }

    return answers;
}

async function calculateDarkness(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    let darkPixels = 0;
    const totalPixels = info.width * info.height;

    // Count dark pixels (threshold < 128)
    for (let i = 0; i < data.length; i++) {
        if (data[i] < 128) {
            darkPixels++;
        }
    }

    return darkPixels / totalPixels;
}

async function extractStudentInfo(imagePath) {
    // OCR the top portion for student name/ID
    const result = await Tesseract.recognize(
        imagePath,
        'eng',
        {
            rectangle: { top: 50, left: 150, width: 400, height: 80 }
        }
    );

    // Parse text for name and ID
    const lines = result.data.text.split('\n');

    return {
        name: lines[0]?.replace('Student Name:', '').trim() || 'Unknown',
        id: lines[1]?.replace('Student ID:', '').trim() || null
    };
}
```

---

### Approach 2: Even Simpler - QR Code Based (Lightest!)

Instead of bubble detection, use QR codes for everything!

#### Modified Answer Sheet

```
┌─────────────────────────────────────────────┐
│  [QR: Test ID]         [QR: Student ID]     │
│                                             │
│  Write answers below:                       │
│  1. A    6. B    11. C   16. D             │
│  2. B    7. C    12. A   17. B             │
│  3. C    8. D    13. B   18. A             │
│  4. D    9. A    14. C   19. C             │
│  5. A   10. B    15. D   20. B             │
└─────────────────────────────────────────────┘
```

**Implementation:**

```javascript
const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

// Generate answer sheet with QR codes
async function generateQRAnswerSheet(testId) {
    const doc = new PDFDocument();

    // Generate QR codes
    const testQR = await QRCode.toDataURL(testId);
    const studentQR = await QRCode.toDataURL('STUDENT_FILL');

    doc.image(testQR, 50, 50, { width: 80 });
    doc.image(studentQR, 450, 50, { width: 80 });

    // Add answer grid
    // Students write A/B/C/D
    // ...

    doc.end();
}

// Process scanned sheet
async function processQRAnswerSheet(imagePath) {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);

    // Decode QR codes
    const testQR = jsQR(imageData.data, imageData.width, imageData.height);

    // Then use OCR to read handwritten answers
    const answers = await Tesseract.recognize(imagePath, 'eng', {
        rectangle: { top: 150, left: 50, width: 500, height: 600 }
    });

    // Parse "1. A  2. B  3. C..." format
    return parseAnswers(answers.data.text);
}
```

---

### Approach 3: Hybrid - Manual Entry (Fallback)

For very low volume or when scanning fails:

```javascript
// Simple web form for manual entry
app.post('/api/results/manual', async (req, res) => {
    const { testId, studentName, answers } = req.body;

    // answers = { "1": "A", "2": "B", ... }

    const result = await processManualAnswers(testId, studentName, answers);

    res.json({ success: true, result });
});
```

---

## 🎯 Recommended Solution for 2GB VPS

### Option 1: Lightweight Bubble Detection (Best Balance)

**Pros:**
- Automated scanning
- No external dependencies
- Works offline
- Students familiar with bubble sheets

**Cons:**
- Requires careful printing
- Needs good quality scans

**Dependencies:**
```bash
npm install sharp tesseract.js
# Total size: ~50MB
```

### Option 2: QR + Manual Entry (Simplest)

**Pros:**
- Minimal processing
- Very lightweight
- Easy to implement
- Reliable

**Cons:**
- Requires manual answer entry (quick though)
- Students need smartphones for QR

**Dependencies:**
```bash
npm install qrcode jsqr
# Total size: ~5MB
```

---

## 📦 Optimized Package.json for 2GB VPS

```json
{
  "name": "marga-test-generator",
  "version": "1.0.0",
  "scripts": {
    "start": "node --max-old-space-size=512 server.js",
    "dev": "nodemon --max-old-space-size=512 server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "uuid": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "pdfkit": "^0.14.0",
    "qrcode": "^1.5.3",
    "tesseract.js": "^5.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Total Dependencies Size: ~150MB**

---

## 🚀 Production Deployment on 2GB VPS

### 1. Choose Cheap VPS Provider

**Hetzner (Recommended - Best Value):**
- 2GB RAM, 1 vCPU, 40GB SSD
- Cost: €4.15/month (~$4.50)
- Location: Europe/US

**Contabo (Alternative):**
- 2GB RAM, 2 vCPU, 50GB SSD
- Cost: $5.99/month

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (optional, for serving static files)
sudo apt install -y nginx
```

### 3. Configure MySQL for Low Memory

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Add/modify:
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 30
innodb_log_file_size = 32M
```

### 4. Deploy Application

```bash
# Clone/upload your code
cd /var/www/marga-test-generator

# Install dependencies
npm install --production

# Create storage directories
mkdir -p storage/images/{problems,solutions}
mkdir -p storage/pdfs/tests
mkdir -p storage/scans

# Set permissions
chmod -R 755 storage

# Start with PM2
pm2 start server.js --name marga-app --max-memory-restart 400M
pm2 save
pm2 startup
```

### 5. Monitor Memory Usage

```bash
# Check memory
free -h

# Monitor PM2
pm2 monit

# Check logs
pm2 logs marga-app
```

---

## 💡 Cost Comparison

### Monthly Costs

| Item | Cost | Required? |
|------|------|-----------|
| VPS (2GB) | $5-10 | ✅ Yes |
| Domain | $1-2 | ❌ Optional |
| SSL Certificate | $0 (Let's Encrypt) | ✅ Yes |
| All Software | $0 | ✅ Yes |
| **Total** | **$5-10/mo** | |

### One-Time Costs

| Item | Cost |
|------|------|
| Development | $0 (DIY) |
| All Libraries | $0 |
| Deployment | $0 |
| **Total** | **$0** |

---

## ✅ Recommendations

**For Your Use Case (Not Many Users):**

1. ✅ Use **2GB VPS** from Hetzner ($4.50/mo)
2. ✅ Use **MySQL** (lighter than PostgreSQL)
3. ✅ Use **Bubble Detection** approach (familiar to students)
4. ✅ Add **Manual Entry Fallback** (for failed scans)
5. ✅ Keep images **small** (max 800x800px, 75% quality)
6. ✅ Use **PM2** with memory limit (400MB max)

**Total Cost: $4.50-6/month** ✨

**Expected Performance:**
- 20+ concurrent users
- 100+ tests per day
- 50+ scans per hour
- Stores 10,000+ problems

---

## 🎓 Free Learning Resources

**OCR/OMR Tutorials:**
- Tesseract.js Docs: https://tesseract.projectnaptha.com/
- Bubble Sheet Processing: https://pyimagesearch.com/bubble-sheet-scanning/

**VPS Setup:**
- DigitalOcean Tutorials: https://www.digitalocean.com/community/tutorials
- Node.js Production: https://nodejs.org/en/docs/guides/simple-profiling/

---

End of Budget & OCR Guide

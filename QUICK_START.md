# Quick Start Guide - MARGA Test Generator

## ✅ Yes, You Can Build It for FREE (except $5/mo VPS)!

### Total Cost: $4.50-10/month
- **VPS (2GB RAM)**: $4.50-10/mo
- **All Software**: $0 (100% free & open-source)
- **Domain** (optional): $1-2/mo

---

## 🎯 What You're Building

A complete math test generation system that:

1. **Creates multilingual math problems** (Russian, Kazakh, English)
2. **Generates custom tests** with randomized answers
3. **Produces PDF tests** with answer sheets
4. **Scans answer sheets** automatically (bubble detection)
5. **Grades tests** and provides diagnostics

---

## 💻 2GB VPS is Enough!

### What You Can Handle:
- ✅ 10-20 concurrent users
- ✅ 100+ tests per day
- ✅ 50+ answer sheet scans per hour
- ✅ 10,000+ math problems in database
- ✅ 100,000+ student results

### Recommended VPS:
**Hetzner CX11** - €4.15/month (~$4.50)
- 2GB RAM
- 1 vCPU
- 40GB SSD
- Locations: Germany, Finland, USA

---

## 📄 How Answer Sheet Scanning Works

### Method: Bubble Sheet Detection (OMR)

**Answer Sheet Template:**
```
┌─────────────────────────────────────┐
│  MARGA Test - Answer Sheet          │
│  [QR Code]                           │
│  Student: ___________                │
│                                      │
│  1. ⃝A  ⃝B  ⃝C  ⃝D                  │
│  2. ⃝A  ⃝B  ⃝C  ⃝D                  │
│  ...                                 │
└─────────────────────────────────────┘
```

### How It Works:

1. **Generate PDF** with bubbles (circles) for A/B/C/D
2. **Student fills** bubbles with black pen
3. **Scan** with phone camera or scanner (min 1200px width)
4. **Process image:**
   - Convert to black & white
   - Find bubble locations (fixed coordinates)
   - Measure darkness of each bubble
   - If bubble is >40% dark → it's filled
5. **Extract answers** → Grade automatically

### Technology Stack:
- **Sharp** - Image processing (lightweight, ~15MB)
- **Tesseract.js** - OCR for student names (~30MB)
- **QR Code** - Test identification (~2MB)
- **PDFKit** - Generate PDFs (~5MB)

**Total Dependencies: ~150MB**

---

## 🚀 Installation (5 Minutes)

### 1. Get a VPS

Sign up at [Hetzner](https://www.hetzner.com/cloud):
- Choose CX11 (2GB RAM, $4.50/mo)
- Select Ubuntu 22.04
- Create SSH key

### 2. Connect to VPS

```bash
ssh root@your-vps-ip
```

### 3. Install Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Secure MySQL
mysql_secure_installation

# Install PM2 (keeps app running)
npm install -g pm2

# Install build tools (for native modules)
apt install -y build-essential
```

### 4. Create Database

```bash
mysql -u root -p

# In MySQL:
CREATE DATABASE marga_test_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'marga_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON marga_test_generator.* TO 'marga_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Deploy Application

```bash
# Create directory
mkdir -p /var/www/marga-test-generator
cd /var/www/marga-test-generator

# Initialize project
npm init -y

# Install dependencies
npm install express mysql2 uuid multer sharp pdfkit qrcode tesseract.js canvas jsqr dotenv cors helmet express-rate-limit

# Create directories
mkdir -p storage/images/{problems,solutions}
mkdir -p storage/pdfs/{tests,answer-sheets,answer-keys}
mkdir -p storage/scans
mkdir -p src/{config,models,services,controllers,routes,middleware,utils}

# Set permissions
chmod -R 755 storage
```

### 6. Create .env File

```bash
nano .env
```

Add:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marga_test_generator
DB_USER=marga_user
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=production
STORAGE_PATH=/var/www/marga-test-generator/storage
```

### 7. Create Database Tables

```bash
mysql -u marga_user -p marga_test_generator < database_schema.sql
```

(Use the SQL schema from PROJECT_ARCHITECTURE.md)

### 8. Copy Code Files

Upload all the code files from your local machine:
- server.js
- src/ directory with all services, models, controllers

### 9. Start Application

```bash
# Start with PM2
pm2 start server.js --name marga-app --max-memory-restart 400M

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

### 10. Test

```bash
curl http://localhost:3000/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-10-31T..."}
```

---

## 📱 Usage Flow

### For Teachers:

**1. Add Math Problems**
```bash
POST /api/problems
{
  "problemText": {
    "ru": "Решите: 2x + 5 = 13",
    "kz": "Шешіңіз: 2x + 5 = 13",
    "en": "Solve: 2x + 5 = 13"
  },
  "correctAnswer": "x = 4",
  "wrongAnswers": ["x = 3", "x = 5", "x = 6"],
  "classLevel": 7,
  "difficultyLevel": "medium",
  "tags": ["algebra", "linear_equations"]
}
```

**2. Generate Test**
```bash
POST /api/tests/generate
{
  "testName": "Algebra Quiz - November",
  "classLevel": 7,
  "numberOfQuestions": 20,
  "language": "ru",
  "tags": ["algebra"],
  "quarter": 2
}
```

Returns:
- Test PDF (with questions)
- Answer sheet PDF (blank bubbles)
- Answer key PDF (for teacher)

**3. Print and Distribute**
- Print test PDF for students
- Print answer sheets

### For Students:

**1. Take Test**
- Read questions
- Fill bubbles on answer sheet with black pen
- Fill bubble COMPLETELY

**2. Return Answer Sheet**

### For Teachers (Grading):

**1. Scan Answer Sheets**
- Use phone camera or scanner
- Min 1200px width
- Good lighting

**2. Upload Scans**
```bash
POST /api/results/scan
- testId: "abc-123"
- answerSheet: (image file)
```

**3. Get Results**
```json
{
  "score": 15,
  "totalQuestions": 20,
  "percentage": 75,
  "answers": {
    "1": "B",
    "2": "A",
    ...
  },
  "diagnostics": {
    "byTopic": {
      "algebra": { "correct": 8, "total": 10, "percentage": 80 },
      "geometry": { "correct": 7, "total": 10, "percentage": 70 }
    },
    "weakTopics": ["geometry"]
  }
}
```

---

## 🎛️ System Monitoring

### Check Memory Usage
```bash
free -h
```

### Monitor Application
```bash
pm2 monit
```

### Check Logs
```bash
pm2 logs marga-app
```

### Restart if Needed
```bash
pm2 restart marga-app
```

---

## 🔧 Performance Tips

### 1. Optimize MySQL for 2GB
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 30
query_cache_size = 16M
```

Restart:
```bash
sudo systemctl restart mysql
```

### 2. Limit Node.js Memory
```bash
pm2 delete marga-app
pm2 start server.js --name marga-app --max-memory-restart 400M -- --max-old-space-size=512
pm2 save
```

### 3. Compress Images
Already done in code (Sharp with 75% quality, max 800px)

### 4. Clean Old Files
```bash
# Add to crontab
crontab -e

# Delete scans older than 30 days
0 2 * * * find /var/www/marga-test-generator/storage/scans -mtime +30 -delete
```

---

## 🆘 Troubleshooting

### Problem: Out of Memory
```bash
# Check what's using memory
pm2 monit

# Restart app
pm2 restart marga-app

# Consider upgrading to 4GB if persistent
```

### Problem: Bubble Detection Fails
- Ensure scan is high quality (min 1200px width)
- Check lighting (not too dark/bright)
- Verify bubbles are filled completely
- Use manual correction interface

### Problem: Database Connection Error
```bash
# Check MySQL is running
systemctl status mysql

# Check credentials in .env
cat .env

# Test connection
mysql -u marga_user -p
```

---

## 📊 Expected Performance

### With 2GB VPS:

| Metric | Capacity |
|--------|----------|
| Concurrent Users | 15-20 |
| Tests/Day | 100-200 |
| Scans/Hour | 50-100 |
| Database Records | 50,000+ |
| Response Time | <500ms |
| Uptime | 99.5%+ |

---

## 💡 Next Steps

1. ✅ Install on VPS (follow steps above)
2. ✅ Add 10-20 sample problems
3. ✅ Generate test PDF
4. ✅ Print and test scanning
5. ✅ Adjust bubble detection threshold if needed
6. Build simple web interface (optional)
7. Add user authentication (optional)
8. Set up automated backups

---

## 📚 Resources

**Documentation:**
- PROJECT_ARCHITECTURE.md - Full system design
- IMPLEMENTATION_GUIDE.md - Code examples
- BUDGET_AND_OCR_GUIDE.md - Detailed OCR explanation

**Learning:**
- Sharp Docs: https://sharp.pixelplumbing.com/
- Tesseract.js: https://tesseract.projectnaptha.com/
- PDFKit: https://pdfkit.org/

**Support:**
- Node.js Docs: https://nodejs.org/docs/
- MySQL Docs: https://dev.mysql.com/doc/

---

## ✨ Summary

**YES, you can build this completely FREE (except $5/mo VPS):**
- ✅ All software is open-source and free
- ✅ 2GB VPS is sufficient for your needs
- ✅ OMR (bubble detection) works reliably
- ✅ No need for Firebase/Supabase
- ✅ No external API costs
- ✅ Simple to deploy and maintain

**Total Investment:**
- Time: 2-3 hours setup
- Money: $5-10/month (VPS only)
- Complexity: Moderate (well-documented)

**You're ready to start!** 🚀

---

End of Quick Start Guide

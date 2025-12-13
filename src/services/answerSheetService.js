const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const QRCode = require('qrcode');

// Register fonts with Cyrillic support
const FONT_PATH = path.join(__dirname, '../../fonts');
const FONTS = {
    regular: path.join(FONT_PATH, 'Roboto-Regular.ttf'),
    bold: path.join(FONT_PATH, 'Roboto-Bold.ttf')
};

// LAYOUT CONSTANTS - Calculate once, use everywhere
const PAGE_WIDTH = 595.28;  // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// SPACING CONSTANTS
const SPACING = {
    questionSpacing: 16,
    bubbleSpacing: 25,
    bubbleRadius: 6,
    columnGap: 235,
    idColumnSpacing: 45,
    idRowSpacing: 18,
    idBubbleRadius: 5
};

// FONT SIZES
const FONTS_SIZES = {
    title: 16,
    subtitle: 9,
    sectionHeader: 10,
    instruction: 7,
    questionNumber: 8,
    bubbleLabel: 7
};

/**
 * Generate an answer sheet PDF for a test
 * Includes 6-digit ID bubbles and answer bubbles
 */
async function generateAnswerSheet(testData) {
    // BEST PRACTICE: Validate and provide defaults for ALL inputs
    const testId = testData.testId || 'unknown';
    const testName = testData.testName || 'Тест';
    const totalQuestions = parseInt(testData.totalQuestions) || 25;
    const classLevel = testData.classLevel || '7';
    const language = testData.language || 'ru';

    // Validate totalQuestions is reasonable
    if (totalQuestions < 1 || totalQuestions > 100) {
        throw new Error(`Invalid totalQuestions: ${totalQuestions}`);
    }

    const filePath = path.join(
        process.env.STORAGE_PATH || './storage',
        'pdfs',
        'answer-sheets',
        `answer-sheet-${testId}.pdf`
    );

    // Ensure directory exists
    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    // BEST PRACTICE: Wrap entire PDF generation in try-catch with error PDF fallback
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });

        // BEST PRACTICE: Font loading with graceful degradation
        let fontsLoaded = false;
        try {
            doc.registerFont('Roboto', FONTS.regular);
            doc.registerFont('Roboto-Bold', FONTS.bold);
            fontsLoaded = true;
        } catch (fontError) {
            console.warn('⚠️ Font loading failed, using default fonts:', fontError.message);
            // Continue with default Helvetica - don't crash
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Helper function to safely set font
        const safeFont = (fontName) => {
            if (fontsLoaded) {
                doc.font(fontName);
            } else {
                // Fall back to built-in Helvetica fonts
                doc.font(fontName === 'Roboto-Bold' ? 'Helvetica-Bold' : 'Helvetica');
            }
        };

        // BEST PRACTICE: QR code generation with try-catch
        let qrCodeDataUrl;
        try {
            qrCodeDataUrl = await QRCode.toDataURL(testId, {
                width: 60,
                margin: 1
            });
        } catch (qrError) {
            console.warn('⚠️ QR code generation failed:', qrError.message);
            // Continue without QR code - don't crash
        }

        // BEST PRACTICE: Use calculated positions
        const regMarkSize = 4;
        const regMarkMargin = 30;

        // Registration marks (for alignment detection)
        doc.circle(regMarkMargin, 60, regMarkSize).fill('black');
        doc.circle(PAGE_WIDTH - regMarkMargin, 60, regMarkSize).fill('black');
        doc.circle(regMarkMargin, PAGE_HEIGHT - 40, regMarkSize).fill('black');

        // Header
        doc.fontSize(FONTS_SIZES.title);
        safeFont('Roboto-Bold');
        doc.text('БЛАНК ОТВЕТОВ', MARGIN, 50, {
            width: CONTENT_WIDTH,
            align: 'center'
        });

        doc.moveDown(0.3);

        // Test info in one line - with text width validation
        const testInfo = `Тест: ${testName}     Класс: ${classLevel}     Вопросов: ${totalQuestions}`;
        doc.fontSize(FONTS_SIZES.subtitle);
        safeFont('Roboto');
        doc.text(testInfo, MARGIN, doc.y, {
            width: CONTENT_WIDTH,
            align: 'center'
        });

        doc.moveDown(0.5);

        // Name and Date fields
        doc.fontSize(8)
            .text('ФИО: _________________________________________     Дата: _______________', MARGIN);

        doc.moveDown(0.3);

        // Horizontal line separator
        doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).lineWidth(2).stroke('black');

        doc.moveDown(0.8);

        // QR Code (top right corner) - only if generated successfully
        if (qrCodeDataUrl) {
            try {
                doc.image(qrCodeDataUrl, PAGE_WIDTH - MARGIN - 50, 40, { width: 50 });
            } catch (imgError) {
                console.warn('⚠️ QR code image insertion failed:', imgError.message);
            }
        }

        // Student ID Section
        doc.fontSize(FONTS_SIZES.sectionHeader);
        safeFont('Roboto-Bold');
        doc.fillColor('black').text('НОМЕР СТУДЕНТА:', MARGIN);

        doc.fontSize(FONTS_SIZES.instruction);
        safeFont('Roboto');
        doc.fillColor('#666666')
            .text('Ваш 6-значный номер (Пример: ИИ-123456 → 123456)', MARGIN, doc.y + 1, { width: 350 })
            .fillColor('black');

        doc.moveDown(0.8);

        // Draw 6-digit ID bubbles
        const idStartY = doc.y;
        drawStudentIdBubbles(doc, 80, idStartY, safeFont);

        // Calculate actual height of ID bubbles section
        doc.y = idStartY + 195;

        // Instructions - more compact
        doc.fontSize(8);
        safeFont('Roboto-Bold');
        doc.text('ИНСТРУКЦИЯ:', MARGIN);

        doc.fontSize(FONTS_SIZES.instruction);
        safeFont('Roboto');
        doc.text('• Заполняйте кружки полностью   • Один ответ   • Черная ручка', MARGIN, doc.y + 2);

        doc.moveDown(0.8);

        // Horizontal line before answers
        doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).lineWidth(1).stroke('black');

        doc.moveDown(0.5);

        // Answers section
        doc.fontSize(FONTS_SIZES.sectionHeader);
        safeFont('Roboto-Bold');
        doc.text('ОТВЕТЫ', { align: 'center' });

        doc.moveDown(0.5);

        // Draw answer bubbles in 2-column grid
        const answerStartY = doc.y;
        drawAnswerBubblesGrid(doc, 60, answerStartY, totalQuestions, safeFont);

        // Footer
        doc.fontSize(FONTS_SIZES.instruction)
            .fillColor('gray')
            .text(`Test ID: ${testId}`, MARGIN, 800, { align: 'center', width: CONTENT_WIDTH });

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(`/storage/pdfs/answer-sheets/answer-sheet-${testId}.pdf`);
            });
            stream.on('error', reject);
        });

    } catch (error) {
        // BEST PRACTICE: Generate error PDF if main generation fails
        console.error('❌ Answer sheet generation failed:', error);

        try {
            const errorDoc = new PDFDocument({ size: 'A4' });
            const errorStream = fs.createWriteStream(filePath);
            errorDoc.pipe(errorStream);

            errorDoc.fontSize(16).text('Ошибка генерации бланка', 50, 50);
            errorDoc.fontSize(12).text(`Test ID: ${testId}`, 50, 100);
            errorDoc.fontSize(10).text(`Ошибка: ${error.message}`, 50, 130);
            errorDoc.end();

            await new Promise((resolve, reject) => {
                errorStream.on('finish', resolve);
                errorStream.on('error', reject);
            });
        } catch (fallbackError) {
            console.error('❌ Error PDF generation also failed:', fallbackError);
        }

        throw error; // Re-throw to propagate to caller
    }
}

/**
 * Draw 6-digit student ID bubble grid
 */
function drawStudentIdBubbles(doc, startX, startY, safeFont) {
    const columnSpacing = SPACING.idColumnSpacing;
    const rowSpacing = SPACING.idRowSpacing;
    const bubbleRadius = SPACING.idBubbleRadius;
    const numColumns = 6;
    const numDigits = 10;

    // Column headers
    doc.fontSize(FONTS_SIZES.questionNumber);
    safeFont('Roboto-Bold');
    for (let col = 0; col < numColumns; col++) {
        doc.text(
            `[${col + 1}]`,
            startX + (col * columnSpacing) - 5,
            startY - 15
        );
    }

    safeFont('Roboto');

    // Draw bubbles 0-9 for each column
    for (let digit = 0; digit < numDigits; digit++) {
        for (let col = 0; col < numColumns; col++) {
            const x = startX + (col * columnSpacing);
            const y = startY + (digit * rowSpacing);

            // Digit label (left side)
            if (col === 0) {
                doc.fontSize(FONTS_SIZES.questionNumber)
                    .fillColor('black')
                    .text(digit.toString(), x - 18, y - 3);
            }

            // Draw bubble
            doc.circle(x, y, bubbleRadius).stroke('black');
        }
    }

    // Draw vertical separation lines between columns
    doc.strokeColor('lightgray');
    for (let col = 1; col < numColumns; col++) {
        const x = startX + (col * columnSpacing) - (columnSpacing / 2);
        doc.moveTo(x, startY - 20).lineTo(x, startY + (numDigits * rowSpacing) + 5).stroke();
    }

    doc.strokeColor('black');
}

/**
 * Draw answer bubbles in 2-column grid (like React component)
 */
function drawAnswerBubblesGrid(doc, startX, startY, totalQuestions, safeFont) {
    const questionSpacing = SPACING.questionSpacing;
    const bubbleSpacing = SPACING.bubbleSpacing;
    const bubbleRadius = SPACING.bubbleRadius;
    const columnGap = SPACING.columnGap;
    const questionsPerColumn = Math.ceil(totalQuestions / 2);
    const options = ['A', 'B', 'C', 'D'];

    // Left column
    let currentY = startY;
    for (let q = 1; q <= questionsPerColumn && q <= totalQuestions; q++) {
        // Question number
        doc.fontSize(FONTS_SIZES.questionNumber);
        safeFont('Roboto');
        doc.fillColor('black')
            .text(`${q}.`, startX - 18, currentY - 3, { width: 15, align: 'right' });

        // Draw bubbles
        let bubbleX = startX;
        options.forEach((option) => {
            // Draw circle
            doc.circle(bubbleX, currentY, bubbleRadius)
                .lineWidth(0.8)
                .stroke('black');

            // Option letter inside circle
            doc.fontSize(FONTS_SIZES.bubbleLabel);
            safeFont('Roboto');
            doc.fillColor('black')
                .text(option, bubbleX - 2.5, currentY - 2.5);

            bubbleX += bubbleSpacing;
        });

        currentY += questionSpacing;
    }

    // Right column
    if (totalQuestions > questionsPerColumn) {
        currentY = startY;
        const rightColX = startX + columnGap;

        for (let q = questionsPerColumn + 1; q <= totalQuestions; q++) {
            // Question number
            doc.fontSize(FONTS_SIZES.questionNumber);
            safeFont('Roboto');
            doc.fillColor('black')
                .text(`${q}.`, rightColX - 18, currentY - 3, { width: 15, align: 'right' });

            // Draw bubbles
            let bubbleX = rightColX;
            options.forEach((option) => {
                // Draw circle
                doc.circle(bubbleX, currentY, bubbleRadius)
                    .lineWidth(0.8)
                    .stroke('black');

                // Option letter inside circle
                doc.fontSize(FONTS_SIZES.bubbleLabel);
                safeFont('Roboto');
                doc.fillColor('black')
                    .text(option, bubbleX - 2.5, currentY - 2.5);

                bubbleX += bubbleSpacing;
            });

            currentY += questionSpacing;
        }
    }
}

/**
 * Generate answer key PDF (for teacher)
 */
async function generateAnswerKey(testData, answerKey) {
    // BEST PRACTICE: Validate and provide defaults
    const testId = testData.testId || 'unknown';
    const testName = testData.testName || 'Тест';
    const classLevel = testData.classLevel || '7';
    const language = testData.language || 'ru';

    const filePath = path.join(
        process.env.STORAGE_PATH || './storage',
        'pdfs',
        'answer-keys',
        `answer-key-${testId}.pdf`
    );

    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    // BEST PRACTICE: Wrap in try-catch with error PDF fallback
    try {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN }
        });

        // BEST PRACTICE: Font loading with graceful degradation
        let fontsLoaded = false;
        try {
            doc.registerFont('Roboto', FONTS.regular);
            doc.registerFont('Roboto-Bold', FONTS.bold);
            fontsLoaded = true;
        } catch (fontError) {
            console.warn('⚠️ Font loading failed, using default fonts:', fontError.message);
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Helper function to safely set font
        const safeFont = (fontName) => {
            if (fontsLoaded) {
                doc.font(fontName);
            } else {
                doc.font(fontName === 'Roboto-Bold' ? 'Helvetica-Bold' : 'Helvetica');
            }
        };

        // Header
        doc.fontSize(18);
        safeFont('Roboto-Bold');
        doc.text('Ключ Ответов', { align: 'center' });

        doc.fontSize(12);
        safeFont('Roboto');
        doc.moveDown();

        // Test info
        doc.fontSize(10)
            .text(`Тест: ${testName}`)
            .text(`Класс: ${classLevel}`)
            .text(`Язык: ${language}`)
            .text(`Test ID: ${testId}`)
            .moveDown(2);

        // Answer key in columns
        doc.fontSize(10);
        if (fontsLoaded) {
            safeFont('Roboto');
        } else {
            doc.font('Courier'); // Fallback to Courier for monospace
        }

        let y = doc.y;
        let x = MARGIN;
        const columnWidth = 100;
        let count = 0;

        for (const [questionNum, answer] of Object.entries(answerKey)) {
            doc.text(`${questionNum.padStart(3, ' ')}. ${answer}`, x, y);

            count++;
            if (count % 25 === 0) {
                x += columnWidth;
                y = 150;
            } else {
                y += 18;
            }

            // New page if needed
            if (y > PAGE_HEIGHT - MARGIN - 50) {
                doc.addPage();
                x = MARGIN;
                y = MARGIN;
            }
        }

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(`/storage/pdfs/answer-keys/answer-key-${testId}.pdf`);
            });
            stream.on('error', reject);
        });

    } catch (error) {
        // BEST PRACTICE: Generate error PDF if main generation fails
        console.error('❌ Answer key generation failed:', error);

        try {
            const errorDoc = new PDFDocument({ size: 'A4' });
            const errorStream = fs.createWriteStream(filePath);
            errorDoc.pipe(errorStream);

            errorDoc.fontSize(16).text('Ошибка генерации ключа ответов', 50, 50);
            errorDoc.fontSize(12).text(`Test ID: ${testId}`, 50, 100);
            errorDoc.fontSize(10).text(`Ошибка: ${error.message}`, 50, 130);
            errorDoc.end();

            await new Promise((resolve, reject) => {
                errorStream.on('finish', resolve);
                errorStream.on('error', reject);
            });
        } catch (fallbackError) {
            console.error('❌ Error PDF generation also failed:', fallbackError);
        }

        throw error; // Re-throw to propagate to caller
    }
}

/**
 * Get bubble coordinates for answer detection
 * Used by scanner service (matches new grid layout)
 */
function getAnswerBubbleCoordinates(questionNumber, totalQuestions) {
    const startX = 60;
    const questionSpacing = 16;
    const bubbleSpacing = 25;  // Updated to match drawAnswerBubblesGrid
    const columnGap = 235;     // Updated to match drawAnswerBubblesGrid
    const questionsPerColumn = Math.ceil(totalQuestions / 2);

    // Note: startY would need to be calculated based on the actual PDF layout
    // This is an approximation - adjust based on actual measurements
    const startY = 430;

    let x = startX;
    let y;

    if (questionNumber <= questionsPerColumn) {
        // Left column
        y = startY + ((questionNumber - 1) * questionSpacing);
    } else {
        // Right column
        x = startX + columnGap;
        y = startY + ((questionNumber - questionsPerColumn - 1) * questionSpacing);
    }

    // Return coordinates for A, B, C, D
    return {
        A: { x: x, y: y },
        B: { x: x + bubbleSpacing, y: y },
        C: { x: x + bubbleSpacing * 2, y: y },
        D: { x: x + bubbleSpacing * 3, y: y }
    };
}

/**
 * Get student ID bubble coordinates
 * Used by scanner service
 */
function getStudentIdBubbleCoordinates() {
    const startX = 80;
    const startY = 150;
    const columnSpacing = 45;
    const rowSpacing = 18;

    const coordinates = [];

    for (let col = 0; col < 6; col++) {
        const colCoords = {};
        for (let digit = 0; digit <= 9; digit++) {
            colCoords[digit] = {
                x: startX + (col * columnSpacing),
                y: startY + (digit * rowSpacing)
            };
        }
        coordinates.push(colCoords);
    }

    return coordinates;
}

module.exports = {
    generateAnswerSheet,
    generateAnswerKey,
    getAnswerBubbleCoordinates,
    getStudentIdBubbleCoordinates
};

const PDFDocument = require('pdfkit');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

// Register fonts with Cyrillic support
const FONT_PATH = path.join(__dirname, '../../fonts');
const FONTS = {
    regular: path.join(FONT_PATH, 'Roboto-Regular.ttf'),
    bold: path.join(FONT_PATH, 'Roboto-Bold.ttf')
};

// LAYOUT CONSTANTS
const PAGE_WIDTH = 595.28;  // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// FONT SIZES
const FONTS_SIZES = {
    title: 20,
    subtitle: 11,
    instruction: 9,
    questionNumber: 11,
    questionText: 11,
    answerLetter: 9,
    answerText: 9,
    formula: 10,
    footer: 8
};

// COLORS
const COLORS = {
    primary: '#1e40af',
    text: 'black',
    textLight: '#666666',
    textDark: '#333333',
    formula: '#0066cc',
    gray: 'gray',
    separatorLight: '#eeeeee',
    separatorDark: '#cccccc'
};

/**
 * Generate test questions PDF
 */
async function generateTestPDF(problems, testData) {
    // BEST PRACTICE: Validate and provide defaults for ALL inputs
    const testId = testData.testId || 'unknown';
    const testName = testData.testName || 'Тест';
    const classLevel = testData.classLevel || '7';
    const language = testData.language || 'ru';

    // BEST PRACTICE: Validate problems array
    if (!Array.isArray(problems) || problems.length === 0) {
        throw new Error('Problems array is required and must not be empty');
    }

    const filePath = path.join(
        process.env.STORAGE_PATH || './storage',
        'pdfs',
        'tests',
        `test-${testId}.pdf`
    );

    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    // BEST PRACTICE: Wrap entire PDF generation in try-catch with error PDF fallback
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

        // Header with box
        doc.fontSize(FONTS_SIZES.title);
        safeFont('Roboto-Bold');
        doc.fillColor(COLORS.primary).text(testName, { align: 'center' });

        doc.fontSize(FONTS_SIZES.subtitle);
        safeFont('Roboto');
        doc.fillColor(COLORS.text)
            .text(`Класс: ${classLevel}   |   Вопросов: ${problems.length}`, { align: 'center' })
            .moveDown(0.5);

        // Draw line separator
        doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).stroke(COLORS.separatorDark);
        doc.moveDown(1);

        // Instructions box
        const instructions = {
            ru: 'Внимательно прочитайте каждый вопрос и выберите правильный ответ.',
            kz: 'Әр сұрақты мұқият оқып, дұрыс жауапты таңдаңыз.',
            en: 'Read each question carefully and choose the correct answer.'
        };

        doc.fontSize(FONTS_SIZES.instruction)
            .fillColor(COLORS.textLight)
            .text(instructions[language] || instructions.ru, { align: 'center' })
            .fillColor(COLORS.text)
            .moveDown(1.5);

        // Questions
        for (const problem of problems) {
            // Check if we need a new page
            if (doc.y > PAGE_HEIGHT - MARGIN - 150) {
                doc.addPage();
                doc.moveDown(1);
            }

            // Question number and text with background
            const questionY = doc.y;

            // Light background for question number
            doc.rect(MARGIN, questionY - 2, 30, 18)
                .fillOpacity(0.1)
                .fill(COLORS.primary)
                .fillOpacity(1);

            doc.fontSize(FONTS_SIZES.questionNumber);
            safeFont('Roboto-Bold');
            doc.fillColor(COLORS.primary)
                .text(`${problem.questionNumber}.`, MARGIN + 3, questionY);

            safeFont('Roboto');
            doc.fillColor(COLORS.text)
                .text(problem.problemText, 85, questionY, { width: CONTENT_WIDTH - 35 });

            doc.moveDown(0.3);

            // Formula (if exists)
            if (problem.formula) {
                doc.fontSize(FONTS_SIZES.formula);
                if (fontsLoaded) {
                    safeFont('Roboto');
                } else {
                    doc.font('Courier');
                }
                doc.fillColor(COLORS.formula)
                    .text(problem.formula, 85, doc.y, {
                        width: CONTENT_WIDTH - 35,
                        indent: 10
                    });
                doc.fillColor(COLORS.text);
                safeFont('Roboto');
                doc.moveDown(0.3);
            }

            // Image (if exists)
            if (problem.problemImageUrl) {
                const imagePath = path.join(
                    process.env.STORAGE_PATH || './storage',
                    problem.problemImageUrl
                );

                try {
                    await fsp.access(imagePath);
                    doc.image(imagePath, {
                        fit: [400, 250],
                        align: 'center'
                    });
                    doc.moveDown(0.3);
                } catch (err) {
                    console.warn(`⚠️ Image not found: ${imagePath}`);
                    // Image not found, skip
                }
            }

            // Answer options with better formatting
            for (const answer of problem.answers) {
                const answerY = doc.y;
                const circleRadius = 8;
                const circleY = answerY + 5;

                // Circle for answer letter
                doc.circle(90, circleY, circleRadius)
                    .lineWidth(1)
                    .stroke(COLORS.textLight);

                // Center the letter inside the circle
                // For font size 9, we need to offset Y by ~3 points to center vertically
                doc.fontSize(FONTS_SIZES.answerLetter);
                safeFont('Roboto-Bold');
                doc.fillColor(COLORS.textDark)
                    .text(answer.letter, 87, circleY - 3, { width: 6, align: 'center' });

                doc.fontSize(FONTS_SIZES.answerText);
                safeFont('Roboto');
                doc.fillColor(COLORS.text)
                    .text(answer.text, 105, answerY, { width: CONTENT_WIDTH - 55 });

                doc.moveDown(0.2);
            }

            // Draw bottom line separator
            doc.moveDown(0.5);
            doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).stroke(COLORS.separatorLight);
            doc.moveDown(1);
        }

        // Footer
        doc.fontSize(FONTS_SIZES.footer)
            .fillColor(COLORS.gray)
            .text(`Test ID: ${testId}`, MARGIN, PAGE_HEIGHT - 30, {
                align: 'center',
                width: CONTENT_WIDTH
            });

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(`/storage/pdfs/tests/test-${testId}.pdf`);
            });
            stream.on('error', reject);
        });

    } catch (error) {
        // BEST PRACTICE: Generate error PDF if main generation fails
        console.error('❌ Test PDF generation failed:', error);

        try {
            const errorDoc = new PDFDocument({ size: 'A4' });
            const errorStream = fs.createWriteStream(filePath);
            errorDoc.pipe(errorStream);

            errorDoc.fontSize(16).text('Ошибка генерации теста', 50, 50);
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

module.exports = {
    generateTestPDF
};

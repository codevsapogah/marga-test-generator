const sharp = require('sharp');
const path = require('path');
const { getAnswerBubbleCoordinates, getStudentIdBubbleCoordinates } = require('./answerSheetService');

/**
 * Process a scanned answer sheet image
 * Detects student ID and answers from bubbles (OMR only, no OCR)
 */
async function processAnswerSheet(imagePath, testId, totalQuestions) {
    try {
        // 1. Preprocess the image
        const processedImagePath = await preprocessImage(imagePath);

        // 2. Detect student ID from bubbles
        const studentId = await detectStudentIdFromBubbles(processedImagePath);

        if (!studentId) {
            throw new Error('Не удалось определить номер студента. Проверьте заполнение кружков.');
        }

        // 3. Detect QR code to verify test ID (optional verification)
        const qrTestId = await detectQRCode(imagePath);
        if (qrTestId && qrTestId !== testId) {
            console.warn(`QR code mismatch: expected ${testId}, got ${qrTestId}`);
        }

        // 4. Detect filled bubbles for answers
        const answers = await detectAnswerBubbles(processedImagePath, totalQuestions);

        // 5. Calculate confidence
        const confidence = calculateConfidence(answers, totalQuestions);

        return {
            studentId,
            answers,
            confidence,
            needsReview: confidence < 95 // Flag for manual review if low confidence
        };
    } catch (error) {
        console.error('Error processing answer sheet:', error);
        throw error;
    }
}

/**
 * Preprocess image for better bubble detection
 */
async function preprocessImage(imagePath) {
    const outputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.jpg');

    await sharp(imagePath)
        .greyscale()
        .normalise()
        .sharpen()
        .threshold(128) // Convert to pure black and white
        .toFile(outputPath);

    return outputPath;
}

/**
 * Detect 6-digit student ID from bubble grid
 */
async function detectStudentIdFromBubbles(imagePath) {
    const image = await sharp(imagePath);
    const coordinates = getStudentIdBubbleCoordinates();

    let studentId = '';

    // Read each of the 6 columns
    for (let col = 0; col < 6; col++) {
        const colCoords = coordinates[col];
        let detectedDigit = null;
        let maxDarkness = 0;

        // Check each digit (0-9) in this column
        for (let digit = 0; digit <= 9; digit++) {
            const coord = colCoords[digit];

            // Extract bubble region
            const bubbleRadius = 5;
            const extractSize = bubbleRadius * 2 + 4;

            try {
                const bubbleRegion = await image.clone()
                    .extract({
                        left: Math.max(0, Math.round(coord.x - bubbleRadius - 2)),
                        top: Math.max(0, Math.round(coord.y - bubbleRadius - 2)),
                        width: extractSize,
                        height: extractSize
                    })
                    .toBuffer();

                const darkness = await calculateDarkness(bubbleRegion);

                // Threshold: consider filled if > 40% dark
                if (darkness > 0.4 && darkness > maxDarkness) {
                    maxDarkness = darkness;
                    detectedDigit = digit.toString();
                }
            } catch (error) {
                console.error(`Error extracting ID bubble col ${col} digit ${digit}:`, error.message);
            }
        }

        if (detectedDigit === null) {
            console.warn(`Could not detect digit in ID column ${col + 1}`);
            return null; // Failed to read ID
        }

        studentId += detectedDigit;
    }

    return studentId;
}

/**
 * Detect QR code in the image to identify test ID
 */
async function detectQRCode(imagePath) {
    try {
        // For now, return null - QR detection requires canvas which is heavy
        // We'll rely on manual test ID input instead
        return null;
    } catch (error) {
        console.error('QR detection error:', error);
        return null;
    }
}

/**
 * Detect filled bubbles for all answers
 */
async function detectAnswerBubbles(imagePath, totalQuestions) {
    const answers = {};
    const image = await sharp(imagePath);

    for (let q = 1; q <= totalQuestions; q++) {
        const coords = getAnswerBubbleCoordinates(q, totalQuestions);

        let selectedAnswer = null;
        let maxDarkness = 0;

        // Check each option (A, B, C, D)
        for (const option of ['A', 'B', 'C', 'D']) {
            const coord = coords[option];

            const bubbleRadius = 5;
            const extractSize = bubbleRadius * 2 + 4;

            try {
                const bubbleRegion = await image.clone()
                    .extract({
                        left: Math.max(0, Math.round(coord.x - bubbleRadius - 2)),
                        top: Math.max(0, Math.round(coord.y - bubbleRadius - 2)),
                        width: extractSize,
                        height: extractSize
                    })
                    .toBuffer();

                const darkness = await calculateDarkness(bubbleRegion);

                // Threshold: consider filled if > 40% dark
                if (darkness > 0.4 && darkness > maxDarkness) {
                    maxDarkness = darkness;
                    selectedAnswer = option;
                }
            } catch (error) {
                console.error(`Error extracting answer bubble Q${q}-${option}:`, error.message);
            }
        }

        answers[q] = selectedAnswer || null;
    }

    return answers;
}

/**
 * Calculate darkness percentage of an image region
 */
async function calculateDarkness(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let darkPixels = 0;
    const totalPixels = info.width * info.height;

    // Count pixels below threshold (dark pixels)
    const threshold = 128;

    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] < threshold) {
            darkPixels++;
        }
    }

    return darkPixels / totalPixels;
}

/**
 * Calculate overall confidence score for the scan
 */
function calculateConfidence(answers, totalQuestions) {
    const answeredQuestions = Object.values(answers).filter(a => a !== null).length;
    return (answeredQuestions / totalQuestions) * 100;
}

/**
 * Verify scan quality before processing
 */
async function verifyScanQuality(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();

        const quality = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check minimum resolution
        if (metadata.width < 1200 || metadata.height < 1600) {
            quality.valid = false;
            quality.errors.push('Разрешение изображения слишком низкое. Минимум 1200x1600 пикселей.');
        }

        // Check file size
        const fs = require('fs').promises;
        const stats = await fs.stat(imagePath);

        if (stats.size < 50000) {
            quality.valid = false;
            quality.errors.push('Файл слишком маленький. Возможно, изображение повреждено.');
        }

        // Check if image is too dark or too bright
        const imageStats = await sharp(imagePath).stats();
        const brightness = imageStats.channels[0].mean;

        if (brightness < 50) {
            quality.warnings.push('Изображение слишком темное. Рекомендуется пересканировать с лучшим освещением.');
        } else if (brightness > 230) {
            quality.warnings.push('Изображение слишком светлое. Отрегулируйте настройки сканера.');
        }

        return quality;
    } catch (error) {
        return {
            valid: false,
            errors: ['Не удалось прочитать файл изображения.'],
            warnings: []
        };
    }
}

/**
 * Generate correction interface data
 * Returns a structure for frontend to display for manual correction
 */
function generateCorrectionInterface(answers, totalQuestions) {
    const corrections = [];

    for (let q = 1; q <= totalQuestions; q++) {
        const answer = answers[q];

        corrections.push({
            questionNumber: q,
            detectedAnswer: answer || null,
            confidence: answer ? 'high' : 'none',
            needsReview: !answer,
            options: ['A', 'B', 'C', 'D']
        });
    }

    return {
        corrections,
        totalQuestions,
        answeredQuestions: Object.values(answers).filter(a => a !== null).length,
        unansweredCount: Object.values(answers).filter(a => a === null).length
    };
}

/**
 * Adjust darkness threshold for scanning
 * Can be called to fine-tune based on printer/scanner characteristics
 */
let DARKNESS_THRESHOLD = parseFloat(process.env.BUBBLE_DARKNESS_THRESHOLD) || 0.4;

function setDarknessThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
        DARKNESS_THRESHOLD = threshold;
        console.log(`Darkness threshold updated to: ${threshold}`);
    } else {
        throw new Error('Threshold must be between 0 and 1');
    }
}

function getDarknessThreshold() {
    return DARKNESS_THRESHOLD;
}

module.exports = {
    processAnswerSheet,
    verifyScanQuality,
    generateCorrectionInterface,
    detectStudentIdFromBubbles,
    detectAnswerBubbles,
    setDarknessThreshold,
    getDarknessThreshold
};

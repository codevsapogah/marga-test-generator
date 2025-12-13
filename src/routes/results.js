const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const resultController = require('../controllers/resultController');

// Result routes
router.post('/scan', upload.single('answerSheet'), resultController.scan);
router.get('/needs-review', resultController.getNeedingReview);
router.get('/test/:testId', resultController.getByTest);
router.get('/test/:testId/stats', resultController.getClassStats);
router.get('/student/:studentId', resultController.getByStudent);
router.get('/:id', resultController.getById);
router.put('/:id/correct', resultController.correct);

module.exports = router;

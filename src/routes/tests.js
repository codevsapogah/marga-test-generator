const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Test routes
router.post('/generate', testController.generate);
router.post('/:id/regenerate-pdfs', testController.regeneratePDFs);
router.get('/', testController.getAll);
router.get('/:id', testController.getById);
router.get('/:id/stats', testController.getStats);
router.delete('/:id', testController.delete);

module.exports = router;

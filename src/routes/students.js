const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// Student routes
router.post('/register', studentController.register);
router.get('/', studentController.getAll);
router.get('/search', studentController.search);
router.get('/:id', studentController.getById);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.delete);
router.get('/:id/stats', studentController.getStats);
router.post('/bulk-import', studentController.bulkImport);

// Trash management routes
router.get('/trash/all', studentController.getTrash);
router.get('/trash/stats', studentController.getTrashStats);
router.post('/trash/:id/restore', studentController.restore);
router.delete('/trash/:id/permanent', studentController.permanentDelete);
router.delete('/trash/clean-all', studentController.cleanAllTrash);

module.exports = router;

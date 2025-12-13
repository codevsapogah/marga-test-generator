const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const problemController = require('../controllers/problemController');

// Problem routes
router.post('/', upload.fields([
    { name: 'problemImage', maxCount: 1 },
    { name: 'solutionImage', maxCount: 1 }
]), problemController.create);

router.get('/search', problemController.search);
router.get('/count', problemController.count);
router.get('/tags', problemController.getTags);
router.get('/:id', problemController.getById);
router.put('/:id', problemController.update);
router.delete('/:id', problemController.delete);

module.exports = router;

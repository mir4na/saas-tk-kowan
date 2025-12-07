const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const authenticate = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/notes - Get all notes
router.get('/', noteController.getNotes);

// GET /api/notes/:id - Get single note
router.get('/:id', noteController.getNote);

// POST /api/notes - Create new note
router.post('/', noteController.createNote);

// PUT /api/notes/:id - Update note (autosave)
router.put('/:id', noteController.updateNote);

// DELETE /api/notes/:id - Delete note
router.delete('/:id', noteController.deleteNote);

module.exports = router;

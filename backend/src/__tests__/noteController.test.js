const request = require('supertest');
const express = require('express');
const pool = require('../config/database');
const noteController = require('../controllers/noteController');
const { authenticate } = require('../middleware/auth');

jest.mock('../config/database');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.get('/notes', noteController.getNotes);
app.get('/notes/:id', noteController.getNote);
app.post('/notes', noteController.createNote);
app.put('/notes/:id', noteController.updateNote);
app.delete('/notes/:id', noteController.deleteNote);

describe('Note Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notes', () => {
    it('should return all notes for authenticated user', async () => {
      const mockNotes = [
        {
          id: 1,
          title: 'Test Note 1',
          content: 'Content 1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: 'Test Note 2',
          content: 'Content 2',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      pool.query.mockResolvedValueOnce({ rows: mockNotes });

      const response = await request(app).get('/notes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notes).toHaveLength(2);
      expect(response.body.notes[0].title).toBe('Test Note 1');
    });

    it('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/notes');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Server error');
    });
  });

  describe('GET /notes/:id', () => {
    it('should return a specific note', async () => {
      const mockNote = {
        id: 1,
        title: 'Test Note',
        content: 'Test Content',
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockNote] });

      const response = await request(app).get('/notes/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.note.title).toBe('Test Note');
    });

    it('should return 404 if note not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/notes/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('POST /notes', () => {
    it('should create a new note', async () => {
      const mockNote = {
        id: 1,
        title: 'New Note',
        content: 'New Content',
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockNote] });

      const response = await request(app)
        .post('/notes')
        .send({
          title: 'New Note',
          content: 'New Content'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.note.title).toBe('New Note');
    });

    it('should create note with default title if not provided', async () => {
      const mockNote = {
        id: 1,
        title: 'Untitled Note',
        content: 'Some content',
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockNote] });

      const response = await request(app)
        .post('/notes')
        .send({
          content: 'Some content'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.note.title).toBe('Untitled Note');
    });
  });

  describe('PUT /notes/:id', () => {
    it('should update an existing note', async () => {
      const mockNote = {
        id: 1,
        title: 'Updated Note',
        content: 'Updated Content',
        created_at: new Date(),
        updated_at: new Date()
      };

      pool.query.mockResolvedValueOnce({ rows: [mockNote] });

      const response = await request(app)
        .put('/notes/1')
        .send({
          title: 'Updated Note',
          content: 'Updated Content'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.note.title).toBe('Updated Note');
    });

    it('should return 404 if note not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/notes/999')
        .send({
          title: 'Updated',
          content: 'Updated'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('DELETE /notes/:id', () => {
    it('should delete a note', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app).delete('/notes/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');
    });

    it('should return 404 if note not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).delete('/notes/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });
});
